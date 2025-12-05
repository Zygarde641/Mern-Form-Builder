const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  questionKey: String,
  operator: { type: String, enum: ['equals', 'notEquals', 'contains'] },
  value: mongoose.Schema.Types.Mixed
});

const conditionalRulesSchema = new mongoose.Schema({
  logic: { type: String, enum: ['AND', 'OR'] },
  conditions: [conditionSchema]
});

const questionSchema = new mongoose.Schema({
  questionKey: { type: String, required: true },
  airtableFieldId: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments'],
    required: true 
  },
  required: { type: Boolean, default: false },
  options: [String], // For select fields
  conditionalRules: conditionalRulesSchema
});

const formSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  airtableBaseId: { type: String, required: true },
  airtableTableId: { type: String, required: true },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', formSchema);
