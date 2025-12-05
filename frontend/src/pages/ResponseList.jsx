import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

function ResponseList() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedResponse, setExpandedResponse] = useState(null);

  useEffect(() => {
    loadData();
  }, [formId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formRes, responsesRes] = await Promise.all([
        api.getForm(formId),
        api.getResponses(formId)
      ]);
      setForm(formRes.data);
      setResponses(responsesRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (responseId) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId);
  };

  const getQuestionLabel = (questionKey) => {
    const question = form?.questions?.find(q => q.questionKey === questionKey);
    return question?.label || questionKey;
  };

  const formatAnswer = (answer) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return String(answer);
  };

  if (loading) {
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
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <Link
              to={`/form/${formId}`}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View Form
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {form?.title} - Responses
          </h1>
          <p className="text-gray-500">
            {responses.length} response{responses.length !== 1 ? 's' : ''} collected
          </p>
        </div>

        {/* Responses */}
        {responses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-500 mb-6">Share your form to start collecting responses</p>
            <Link
              to={`/form/${formId}`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Form
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response, index) => (
              <div
                key={response._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Response Header */}
                <button
                  onClick={() => toggleExpand(response._id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {responses.length - index}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        Response #{responses.length - index}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(response.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {expandedResponse === response._id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Response Details */}
                {expandedResponse === response._id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-4">
                      {response.answers && Object.entries(
                        response.answers instanceof Map 
                          ? Object.fromEntries(response.answers) 
                          : response.answers
                      ).map(([key, value]) => (
                        <div key={key} className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            {getQuestionLabel(key)}
                          </p>
                          <p className="text-gray-900">
                            {formatAnswer(value) || <span className="text-gray-400 italic">No answer</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {response.airtableRecordId && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-400">
                          Airtable Record ID: {response.airtableRecordId}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ResponseList;
