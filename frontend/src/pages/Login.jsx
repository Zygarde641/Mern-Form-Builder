import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Database, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../utils/storage';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (storage.isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Database className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Airtable Form Builder</h1>
            <p className="text-gray-500 mt-2">
              Create dynamic forms connected to your Airtable bases
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Authentication Failed</p>
                <p className="text-sm text-red-600 mt-1">
                  {error === 'auth_failed' 
                    ? 'Unable to connect to Airtable. Please try again.'
                    : 'An error occurred during login.'}
                </p>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Connect to any Airtable base</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Build forms with conditional logic</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Sync responses automatically</span>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={api.loginWithAirtable}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <span>Login with Airtable</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            By logging in, you authorize this app to access your Airtable data
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
