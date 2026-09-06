import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Bike } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ComingSoon from './pages/ComingSoon';
import CustomerSupport from './pages/CustomerSupport';
import PartnerDashboard from './pages/PartnerHub/PartnerDashboard';
import PartnerList from './pages/PartnerHub/PartnerList';
import PartnerDetail from './pages/PartnerHub/PartnerDetail';
import UpdateRequests from './pages/PartnerHub/UpdateRequests';

const adminRoles = ['Super Admin', 'Admin'];

function Home() {
  const { isCustomerSupport } = useAuth();
  return isCustomerSupport ? <Navigate to="/customer-support" replace /> : <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={adminRoles}><Settings /></ProtectedRoute>} />
          <Route path="/customer-support" element={<ProtectedRoute allowedRoles={[...adminRoles, 'Customer Support']}><CustomerSupport /></ProtectedRoute>} />
          <Route path="/delivery-management" element={<ProtectedRoute allowedRoles={adminRoles}><ComingSoon title="Delivery Partner Management" description="Manage CartKaro Delivery Partner App riders, assignments and live tracking. This module is coming soon." icon={Bike} /></ProtectedRoute>} />
          <Route path="/partner-hub" element={<ProtectedRoute allowedRoles={adminRoles}><PartnerDashboard /></ProtectedRoute>} />
          <Route path="/partner-hub/partners" element={<ProtectedRoute allowedRoles={adminRoles}><PartnerList /></ProtectedRoute>} />
          <Route path="/partner-hub/partners/:partnerId" element={<ProtectedRoute allowedRoles={adminRoles}><PartnerDetail /></ProtectedRoute>} />
          <Route path="/partner-hub/update-requests" element={<ProtectedRoute allowedRoles={adminRoles}><UpdateRequests /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
