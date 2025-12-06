import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Zap, Database, ArrowRight } from 'lucide-react';
import { storage } from '../utils/storage';

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (storage.isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="font-semibold text-lg">FormFlow</span>
        </div>
        <button
          onClick={handleGetStarted}
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          Get Started
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center leading-tight mb-4">
          Build powerful forms,
          <br />
          sync with Airtable
        </h1>
        <p className="text-gray-400 text-center max-w-lg mb-8">
          Create custom forms with conditional logic and automatically send responses to your
          Airtable bases.
        </p>
        <button
          onClick={handleGetStarted}
          className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium px-6 py-3 rounded-full transition-colors"
        >
          Start Building
          <ArrowRight className="w-4 h-4" />
        </button>
      </main>

      {/* Features Section */}
      <section className="px-8 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-[#232323] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-semibold mb-2">Easy Form Builder</h3>
            <p className="text-gray-400 text-sm">
              Drag and drop interface to create forms with various field types including text, select, and more.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#232323] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-semibold mb-2">Conditional Logic</h3>
            <p className="text-gray-400 text-sm">
              Show or hide questions based on previous answers to create dynamic form experiences.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#232323] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-semibold mb-2">Airtable Sync</h3>
            <p className="text-gray-400 text-sm">
              Automatically sync form submissions to your Airtable bases for easy data management.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        © 2025 FormFlow. All rights reserved.
      </footer>
    </div>
  );
}

export default Landing;
