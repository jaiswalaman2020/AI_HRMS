import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/ui.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Attendance from './pages/Attendance.jsx';
import Leave from './pages/Leave.jsx';
import Payroll from './pages/Payroll.jsx';
import Performance from './pages/Performance.jsx';
import Recruitment from './pages/Recruitment.jsx';
import CandidateDetail from './pages/CandidateDetail.jsx';
import CareerApply from './pages/CareerApply.jsx';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center"><Spinner label="Authenticating…" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

const HR = ['admin', 'senior_manager', 'hr_recruiter'];
const MGMT = ['admin', 'senior_manager'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/careers" element={<CareerApply />} />
      <Route path="/careers/:jobId" element={<CareerApply />} />

      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/employees" element={<Protected roles={HR}><Employees /></Protected>} />
      <Route path="/attendance" element={<Protected><Attendance /></Protected>} />
      <Route path="/leave" element={<Protected><Leave /></Protected>} />
      <Route path="/payroll" element={<Protected><Payroll /></Protected>} />
      <Route path="/performance" element={<Protected><Performance /></Protected>} />
      <Route path="/recruitment" element={<Protected roles={HR}><Recruitment /></Protected>} />
      <Route path="/recruitment/candidates/:id" element={<Protected roles={HR}><CandidateDetail /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
