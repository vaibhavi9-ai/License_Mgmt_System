import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.css';

// Auth components
import AdminLogin from './components/Auth/AdminLogin';
import CustomerLogin from './components/Auth/CustomerLogin';
import CustomerSignup from './components/Auth/CustomerSignup';

// Layout components
import AdminLayout from './components/Layout/AdminLayout';
import CustomerLayout from './components/Layout/CustomerLayout';

// Admin components
import AdminDashboard from './components/Admin/AdminDashboard';
import CustomerManagement from './components/Admin/CustomerManagement';
import SubscriptionPackManagement from './components/Admin/SubscriptionPackManagement';
import SubscriptionManagement from './components/Admin/SubscriptionManagement';

// Customer components
import CustomerDashboard from './components/Customer/CustomerDashboard';
import SubscriptionRequest from './components/Customer/SubscriptionRequest';
import SubscriptionHistory from './components/Customer/SubscriptionHistory';

// Common components
import ProtectedRoute from './components/Common/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />

          {/* Admin protected routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="subscription-packs" element={<SubscriptionPackManagement />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
          </Route>

          {/* Customer protected routes */}
          <Route path="/customer" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CustomerDashboard />} />
            <Route path="subscription-request" element={<SubscriptionRequest />} />
            <Route path="subscription-history" element={<SubscriptionHistory />} />
          </Route>

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/customer/login" />} />
          <Route path="*" element={<Navigate to="/customer/login" />} />
        </Routes>

        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;