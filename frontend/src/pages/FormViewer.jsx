import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  Upload, 
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { shouldShowQuestion } from '../utils/conditionalLogic';

function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const res = await api.getForm(formId);
      setForm(res.data);
      
      // Initialize answers
      const initialAnswers = {};
      res.data.questions.forEach(q => {
        if (q.type === 'multipleSelects' || q.type === 'multipleAttachments') {
          initialAnswers[q.questionKey] = [];
        } else {
          initialAnswers[q.questionKey] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Error loading form:', err);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (questionKey, value) => {
    setAnswers(prev => ({ ...prev, [questionKey]: value }));
    // Clear validation error when user types
    if (validationErrors[questionKey]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[questionKey];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    form.questions.forEach(question => {
      // Only validate visible questions
      if (!shouldShowQuestion(question.conditionalRules, answers)) {
        return;
      }
      
      if (question.required) {
        const answer = answers[question.questionKey];
        if (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          errors[question.questionKey] = `${question.label} is required`;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Only submit answers for visible questions
      const visibleAnswers = {};
      form.questions.forEach(question => {
        if (shouldShowQuestion(question.conditionalRules, answers)) {
          visibleAnswers[question.questionKey] = answers[question.questionKey];
        }
      });
      
      await api.submitResponse({
        formId,
        answers: visibleAnswers
      });
      
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.error || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-500 mb-4">The form you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500 mb-6">Your response has been submitted successfully.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
              loadForm();
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-10">
            <h1 className="text-2xl font-bold text-white">{form.title}</h1>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {form.questions.map((question) => {
              // Check if question should be shown
              if (!shouldShowQuestion(question.conditionalRules, answers)) {
                return null;
              }

              return (
                <QuestionField
                  key={question.questionKey}
                  question={question}
                  value={answers[question.questionKey]}
                  onChange={(value) => updateAnswer(question.questionKey, value)}
                  error={validationErrors[question.questionKey]}
                />
              );
            })}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function QuestionField({ question, value, onChange, error }) {
  const renderField = () => {
    switch (question.type) {
      case 'singleLineText':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Your answer"
          />
        );

      case 'multilineText':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Your answer"
          />
        );

      case 'singleSelect':
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  value === option
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.questionKey}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multipleSelects':
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  (value || []).includes(option)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const current = value || [];
                    if (e.target.checked) {
                      onChange([...current, option]);
                    } else {
                      onChange(current.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multipleAttachments':
        return (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-2">
                Enter file URLs (one per line)
              </p>
              <textarea
                value={(value || []).join('\n')}
                onChange={(e) => {
                  const urls = e.target.value.split('\n').filter(url => url.trim());
                  onChange(urls);
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="https://example.com/file1.pdf&#10;https://example.com/file2.jpg"
              />
            </div>
            {(value || []).length > 0 && (
              <div className="mt-3 space-y-2">
                {value.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="truncate flex-1">{url}</span>
                    <button
                      type="button"
                      onClick={() => onChange(value.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-gray-900 font-medium">
          {question.label}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default FormViewer;
