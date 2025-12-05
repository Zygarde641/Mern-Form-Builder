import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, FileText, BarChart3, Trash2, ExternalLink, LogOut, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../utils/storage';

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [forms, setForms] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get userId from URL params or storage
    const urlUserId = searchParams.get('userId');
    if (urlUserId) {
      storage.setUserId(urlUserId);
      // Clean URL
      navigate('/dashboard', { replace: true });
    }

    const userId = storage.getUserId();
    if (!userId) {
      navigate('/');
      return;
    }

    loadData(userId);
  }, [navigate, searchParams]);

  const loadData = async (userId) => {
    try {
      setLoading(true);
      const [userRes, formsRes] = await Promise.all([
        api.getCurrentUser(userId),
        api.getForms(userId)
      ]);
      setUser(userRes.data);
      setForms(formsRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    
    try {
      await api.deleteForm(formId);
      setForms(forms.filter(f => f._id !== formId));
    } catch (err) {
      console.error('Error deleting form:', err);
      alert('Failed to delete form');
    }
  };

  const handleLogout = () => {
    storage.clearUserId();
    navigate('/');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Form Builder</h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600">{user.email}</span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Forms</h2>
          <Link
            to="/forms/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Form
          </Link>
        </div>

        {/* Forms Grid */}
        {forms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-500 mb-6">Create your first form to get started</p>
            <Link
              to="/forms/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div
                key={form._id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{form.title}</h3>
                    <p className="text-sm text-gray-500">
                      {form.questions?.length || 0} questions
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  Created {new Date(form.createdAt).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/form/${form._id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    to={`/forms/${form._id}/responses`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Responses
                  </Link>
                  <button
                    onClick={() => handleDelete(form._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
