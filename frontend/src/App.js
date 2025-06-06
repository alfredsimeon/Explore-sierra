import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Import components
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import AuthPage from './components/AuthPage';
import ServicesPage from './components/ServicesPage';
import ServiceDetailPage from './components/ServiceDetailPage';
import AITripPlanner from './components/AITripPlanner';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AdminServiceManagement, AdminBookingsManagement } from './AdminManagement';

// Auth Context
export const AuthContext = React.createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      // Since we don't have a verify endpoint, we'll try to get user bookings
      // This will fail if token is invalid
      const response = await axios.get('/my-bookings');
      // If successful, token is valid - we'll need to store user info during login
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    } catch (error) {
      // Token is invalid
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const authValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.user_type === 'admin'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Sierra Explore...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <div className="App">
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/services/:type" element={<ServicesPage />} />
              <Route path="/service/:type/:id" element={<ServiceDetailPage />} />
              <Route path="/ai-trip-planner" element={<AITripPlanner />} />
              
              {/* Protected User Routes */}
              <Route 
                path="/dashboard" 
                element={
                  authValue.isAuthenticated ? 
                  <UserDashboard /> : 
                  <Navigate to="/auth" />
                } 
              />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  authValue.isAdmin ? 
                  <AdminDashboard /> : 
                  <Navigate to="/auth" />
                } 
              />
              <Route 
                path="/admin/manage/:serviceType" 
                element={
                  authValue.isAdmin ? 
                  <AdminServiceManagement /> : 
                  <Navigate to="/auth" />
                } 
              />
              <Route 
                path="/admin/bookings" 
                element={
                  authValue.isAdmin ? 
                  <AdminBookingsManagement /> : 
                  <Navigate to="/auth" />
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;