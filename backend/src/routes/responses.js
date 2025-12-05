const express = require('express');
const axios = require('axios');
const Form = require('../models/Form');
const Response = require('../models/Response');
const User = require('../models/User');
const { shouldShowQuestion } = require('../utils/conditionalLogic');
const router = express.Router();

// Submit form response
router.post('/', async (req, res) => {
  const { formId, answers } = req.body;
  
  try {
    const form = await Form.findById(formId).populate('owner');
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Validate required fields (only for visible questions)
    const requiredFields = form.questions.filter(q => {
      if (!q.required) return false;
      // Check if question should be shown based on conditional rules
      return shouldShowQuestion(q.conditionalRules, answers);
    });
    
    for (const field of requiredFields) {
      const answer = answers[field.questionKey];
      if (answer === undefined || answer === null || answer === '') {
        return res.status(400).json({ error: `${field.label} is required` });
      }
    }

    // Prepare Airtable record - only include visible questions
    const airtableFields = {};
    form.questions.forEach(question => {
      const answer = answers[question.questionKey];
      if (answer !== undefined && answer !== null && answer !== '') {
        // Check if question should be shown
        if (shouldShowQuestion(question.conditionalRules, answers)) {
          // Handle different field types
          if (question.type === 'multipleAttachments' && Array.isArray(answer)) {
            // Attachments need special formatting for Airtable
            airtableFields[question.airtableFieldId] = answer.map(url => ({ url }));
          } else {
            airtableFields[question.airtableFieldId] = answer;
          }
        }
      }
    });

    // Create record in Airtable
    const airtableResponse = await axios.post(
      `https://api.airtable.com/v0/${form.airtableBaseId}/${form.airtableTableId}`,
      { fields: airtableFields },
      { headers: { Authorization: `Bearer ${form.owner.accessToken}` } }
    );

    // Save response in database
    const response = new Response({
      formId,
      airtableRecordId: airtableResponse.data.id,
      answers
    });
    await response.save();

    res.status(201).json(response);
  } catch (error) {
    console.error('Error submitting response:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// Get responses for a form
router.get('/forms/:formId', async (req, res) => {
  try {
    const responses = await Response.find({ 
      formId: req.params.formId,
      deletedInAirtable: false 
    }).sort({ createdAt: -1 });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single response
router.get('/:responseId', async (req, res) => {
  try {
    const response = await Response.findById(req.params.responseId);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
