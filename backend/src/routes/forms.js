const express = require('express');
const axios = require('axios');
const Form = require('../models/Form');
const User = require('../models/User');
const router = express.Router();

// Get user's Airtable bases
router.get('/bases', async (req, res) => {
  const { userId } = req.query;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const response = await axios.get('https://api.airtable.com/v0/meta/bases', {
      headers: { Authorization: `Bearer ${user.accessToken}` }
    });
    res.json(response.data.bases);
  } catch (error) {
    console.error('Error fetching bases:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get tables from a base
router.get('/bases/:baseId/tables', async (req, res) => {
  const { baseId } = req.params;
  const { userId } = req.query;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const response = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: { Authorization: `Bearer ${user.accessToken}` }
    });
    res.json(response.data.tables);
  } catch (error) {
    console.error('Error fetching tables:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all forms for a user
router.get('/', async (req, res) => {
  const { userId } = req.query;
  
  try {
    const forms = await Form.find({ owner: userId }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create form
router.post('/', async (req, res) => {
  const { userId, title, airtableBaseId, airtableTableId, questions } = req.body;
  
  try {
    // Validate supported field types
    const supportedTypes = ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments'];
    const invalidTypes = questions.filter(q => !supportedTypes.includes(q.type));
    
    if (invalidTypes.length > 0) {
      return res.status(400).json({ 
        error: 'Unsupported field types detected',
        invalidTypes: invalidTypes.map(q => q.type)
      });
    }

    const form = new Form({
      owner: userId,
      title,
      airtableBaseId,
      airtableTableId,
      questions
    });
    
    await form.save();
    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get form by ID
router.get('/:formId', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update form
router.put('/:formId', async (req, res) => {
  const { title, questions } = req.body;
  
  try {
    // Validate supported field types
    const supportedTypes = ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments'];
    const invalidTypes = questions.filter(q => !supportedTypes.includes(q.type));
    
    if (invalidTypes.length > 0) {
      return res.status(400).json({ 
        error: 'Unsupported field types detected',
        invalidTypes: invalidTypes.map(q => q.type)
      });
    }

    const form = await Form.findByIdAndUpdate(
      req.params.formId,
      { title, questions, updatedAt: new Date() },
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete form
router.delete('/:formId', async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
