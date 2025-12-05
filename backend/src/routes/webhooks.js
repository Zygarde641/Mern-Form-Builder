const express = require('express');
const Response = require('../models/Response');
const router = express.Router();

router.post('/airtable', async (req, res) => {
  const { webhook } = req.body;
  
  try {
    // Verify webhook secret (add proper verification in production)
    // const signature = req.headers['x-airtable-webhook-signature'];
    // if (!verifySignature(signature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }
    
    if (webhook && webhook.changedTablesById) {
      for (const tableId in webhook.changedTablesById) {
        const changes = webhook.changedTablesById[tableId];
        
        // Handle record updates
        if (changes.changedRecordsById) {
          for (const recordId in changes.changedRecordsById) {
            const dbResponse = await Response.findOne({ airtableRecordId: recordId });
            if (dbResponse) {
              dbResponse.updatedAt = new Date();
              await dbResponse.save();
              console.log(`Updated response for record: ${recordId}`);
            }
          }
        }
        
        // Handle record deletions - mark as deleted, never hard delete
        if (changes.destroyedRecordIds) {
          for (const recordId of changes.destroyedRecordIds) {
            const result = await Response.updateOne(
              { airtableRecordId: recordId },
              { deletedInAirtable: true, updatedAt: new Date() }
            );
            if (result.modifiedCount > 0) {
              console.log(`Marked response as deleted for record: ${recordId}`);
            }
          }
        }
        
        // Handle created records (if needed for sync)
        if (changes.createdRecordsById) {
          console.log(`New records created in Airtable: ${Object.keys(changes.createdRecordsById).length}`);
        }
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook verification endpoint (Airtable sends a GET request to verify)
router.get('/airtable', (req, res) => {
  res.status(200).json({ status: 'Webhook endpoint active' });
});

module.exports = router;
