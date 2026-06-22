// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Users, Bike } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ComingSoon from './pages/ComingSoon';
import PartnerDashboard from './pages/PartnerHub/PartnerDashboard';
import PartnerList from './pages/PartnerHub/PartnerList';
import PartnerDetail from './pages/PartnerHub/PartnerDetail';
import UpdateRequests from './pages/PartnerHub/UpdateRequests';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-management"
            element={
              <ProtectedRoute>
                <ComingSoon
                  title="Customer Management"
                  description="Manage CartKaro Customer App users, profiles, orders and support tickets. This module is coming soon."
                  icon={Users}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery-management"
            element={
              <ProtectedRoute>
                <ComingSoon
                  title="Delivery Partner Management"
                  description="Manage CartKaro Delivery Partner App riders, assignments and live tracking. This module is coming soon."
                  icon={Bike}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/partner-hub"
            element={
              <ProtectedRoute>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner-hub/partners"
            element={
              <ProtectedRoute>
                <PartnerList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner-hub/partners/:partnerId"
            element={
              <ProtectedRoute>
                <PartnerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner-hub/update-requests"
            element={
              <ProtectedRoute>
                <UpdateRequests />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
