import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronDown, 
  Plus, 
  Trash2, 
  GripVertical,
  Loader2,
  Save,
  Settings
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../utils/storage';

const SUPPORTED_FIELD_TYPES = [
  'singleLineText',
  'multilineText', 
  'singleSelect',
  'multipleSelects',
  'multipleAttachments'
];

const FIELD_TYPE_LABELS = {
  singleLineText: 'Single Line Text',
  multilineText: 'Multi-line Text',
  singleSelect: 'Single Select',
  multipleSelects: 'Multiple Select',
  multipleAttachments: 'Attachments'
};

function FormBuilder() {
  const navigate = useNavigate();
  const userId = storage.getUserId();

  const [step, setStep] = useState(1); // 1: Select base/table, 2: Configure fields
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showConditionModal, setShowConditionModal] = useState(null);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    loadBases();
  }, [userId, navigate]);

  const loadBases = async () => {
    try {
      setLoading(true);
      const res = await api.getBases(userId);
      setBases(res.data);
    } catch (err) {
      console.error('Error loading bases:', err);
      setError('Failed to load Airtable bases');
    } finally {
      setLoading(false);
    }
  };

  const handleBaseSelect = async (base) => {
    setSelectedBase(base);
    setSelectedTable(null);
    setTables([]);
    
    try {
      setLoading(true);
      const res = await api.getTables(base.id, userId);
      setTables(res.data);
    } catch (err) {
      console.error('Error loading tables:', err);
      setError('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    
    // Filter and map supported fields to questions
    const supportedFields = table.fields.filter(f => SUPPORTED_FIELD_TYPES.includes(f.type));
    const mappedQuestions = supportedFields.map((field, index) => ({
      questionKey: `q_${index}`,
      airtableFieldId: field.name, // Airtable uses field name in API
      label: field.name,
      type: field.type,
      required: false,
      options: field.options?.choices?.map(c => c.name) || [],
      conditionalRules: null
    }));
    
    setQuestions(mappedQuestions);
    setFormTitle(`${table.name} Form`);
    setStep(2);
  };

  const updateQuestion = (index, updates) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addCondition = (questionIndex) => {
    setShowConditionModal(questionIndex);
  };

  const saveCondition = (questionIndex, rules) => {
    updateQuestion(questionIndex, { conditionalRules: rules });
    setShowConditionModal(null);
  };

  const removeCondition = (questionIndex) => {
    updateQuestion(questionIndex, { conditionalRules: null });
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setError('Please enter a form title');
      return;
    }
    
    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await api.createForm({
        userId,
        title: formTitle,
        airtableBaseId: selectedBase.id,
        airtableTableId: selectedTable.id,
        questions
      });
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err.response?.data?.error || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => step === 1 ? navigate('/dashboard') : setStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {step === 2 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Form
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Select Base and Table */
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Form</h2>
              <p className="text-gray-500">Select an Airtable base and table to create a form</p>
            </div>

            {/* Base Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bases.map((base) => (
                  <button
                    key={base.id}
                    onClick={() => handleBaseSelect(base)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedBase?.id === base.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">{base.name}</h4>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Selection */}
            {selectedBase && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Table</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => handleTableSelect(table)}
                        className="p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 bg-white text-left transition-all"
                      >
                        <h4 className="font-medium text-gray-900">{table.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {table.fields.filter(f => SUPPORTED_FIELD_TYPES.includes(f.type)).length} supported fields
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Configure Fields */
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Form</h2>
              <p className="text-gray-500">
                Customize your form fields and add conditional logic
              </p>
            </div>

            {/* Form Title */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter form title"
              />
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              
              {questions.map((question, index) => (
                <div
                  key={question.questionKey}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-gray-400 cursor-move">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      {/* Label */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Label
                        </label>
                        <input
                          type="text"
                          value={question.label}
                          onChange={(e) => updateQuestion(index, { label: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      {/* Type and Required */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="text-sm text-gray-500">
                            Type: {FIELD_TYPE_LABELS[question.type]}
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                      </div>

                      {/* Options for select fields */}
                      {(question.type === 'singleSelect' || question.type === 'multipleSelects') && question.options.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">
                            Options: {question.options.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Conditional Logic */}
                      <div className="pt-2 border-t border-gray-100">
                        {question.conditionalRules ? (
                          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Conditional: </span>
                              <span className="text-gray-600">
                                Show when {question.conditionalRules.conditions.length} condition(s) ({question.conditionalRules.logic})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => addCondition(index)}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeCondition(index)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => addCondition(index)}
                            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            <Settings className="w-4 h-4" />
                            Add Conditional Logic
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeQuestion(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No supported fields found in this table</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Condition Modal */}
      {showConditionModal !== null && (
        <ConditionModal
          questions={questions}
          currentIndex={showConditionModal}
          existingRules={questions[showConditionModal]?.conditionalRules}
          onSave={(rules) => saveCondition(showConditionModal, rules)}
          onClose={() => setShowConditionModal(null)}
        />
      )}
    </div>
  );
}

function ConditionModal({ questions, currentIndex, existingRules, onSave, onClose }) {
  const [logic, setLogic] = useState(existingRules?.logic || 'AND');
  const [conditions, setConditions] = useState(existingRules?.conditions || []);

  const availableQuestions = questions.slice(0, currentIndex);

  const addCondition = () => {
    if (availableQuestions.length === 0) return;
    setConditions([...conditions, {
      questionKey: availableQuestions[0].questionKey,
      operator: 'equals',
      value: ''
    }]);
  };

  const updateCondition = (index, updates) => {
    setConditions(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const removeCondition = (index) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (conditions.length === 0) {
      onSave(null);
    } else {
      onSave({ logic, conditions });
    }
  };

  const getQuestionOptions = (questionKey) => {
    const q = questions.find(q => q.questionKey === questionKey);
    return q?.options || [];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Conditional Logic</h3>
          <p className="text-sm text-gray-500 mt-1">
            Show this question based on previous answers
          </p>
        </div>

        <div className="p-6 space-y-4">
          {availableQuestions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No previous questions available for conditions
            </p>
          ) : (
            <>
              {/* Logic Selector */}
              {conditions.length > 1 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">Match:</span>
                  <select
                    value={logic}
                    onChange={(e) => setLogic(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AND">All conditions (AND)</option>
                    <option value="OR">Any condition (OR)</option>
                  </select>
                </div>
              )}

              {/* Conditions */}
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <select
                      value={condition.questionKey}
                      onChange={(e) => updateCondition(index, { questionKey: e.target.value, value: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableQuestions.map(q => (
                        <option key={q.questionKey} value={q.questionKey}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                    
                    <div className="flex gap-2">
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, { operator: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="equals">Equals</option>
                        <option value="notEquals">Not Equals</option>
                        <option value="contains">Contains</option>
                      </select>
                      
                      {getQuestionOptions(condition.questionKey).length > 0 ? (
                        <select
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select value</option>
                          {getQuestionOptions(condition.questionKey).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeCondition(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={addCondition}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default FormBuilder;
