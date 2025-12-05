import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormViewer from './pages/FormViewer';
import ResponseList from './pages/ResponseList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms/new" element={<FormBuilder />} />
        <Route path="/form/:formId" element={<FormViewer />} />
        <Route path="/forms/:formId/responses" element={<ResponseList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
