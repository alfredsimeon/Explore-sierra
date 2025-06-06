import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaHotel, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaSignOutAlt, FaHeart, FaPhone, FaEnvelope, FaStar, FaShieldAlt, FaGlobe, FaUsers, FaEdit, FaTrash, FaPlus, FaEye, FaArrowLeft, FaArrowRight, FaCheck, FaCreditCard, FaHistory, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdEventNote, MdTour, MdHome, MdDashboard } from "react-icons/md";
import { HiSparkles } from "react-icons/hi";
import { loadStripe } from '@stripe/stripe-js';
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51RNKU3RE0BTw05tvxg8LkG7s1l5qpJeCER5468EBYbRXLXDNVF56bJ6tYWpv3JeoHo3LM17a9y7un0rRzmeUqGnI00dEUsDH9Y');

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const signup = async (email, password, full_name, phone = '') => {
    try {
      const response = await axios.post(`${API}/auth/signup`, { email, password, full_name, phone });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: MdHome },
    { name: "Hotels", path: "/hotels", icon: FaHotel },
    { name: "Cars", path: "/cars", icon: FaCar },
    { name: "Events", path: "/events", icon: MdEventNote },
    { name: "Tours", path: "/tours", icon: MdTour },
    { name: "Real Estate", path: "/real-estate", icon: MdHome },
    { name: "AI Planner", path: "/ai-planner", icon: HiSparkles },
  ];

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FaGlobe className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Sierra Explore
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className="text-sm" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={user.user_type === 'admin' ? '/dashboard/admin' : '/dashboard/user'}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  <MdDashboard />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-emerald-600 rounded-lg"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className={`w-full h-0.5 bg-current transition-all duration-200 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
                <div className={`w-full h-0.5 bg-current transition-all duration-200 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <div className={`w-full h-0.5 bg-current transition-all duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden mt-4 py-4 border-t border-gray-200"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                  >
                    <Icon />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// Booking Modal Component
const BookingModal = ({ isOpen, onClose, service, serviceType }) => {
  const { user } = useAuth();
  const [bookingData, setBookingData] = useState({
    start_date: '',
    end_date: '',
    guests: 1,
    special_requests: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Payment
  const [booking, setBooking] = useState(null);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to make a booking');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/bookings/create`, {
        service_type: serviceType,
        service_id: service.id,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date || bookingData.start_date,
        guests: bookingData.guests,
        special_requests: bookingData.special_requests
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBooking(response.data);
      setStep(2);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create payment intent
      const response = await axios.post(`${API}/payments/create-intent`, {
        booking_id: booking.id,
        amount: booking.total_price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const stripe = await stripePromise;
      
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.client_secret
      });

      if (error) {
        console.error('Stripe error:', error);
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-90vh overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 1 ? 'Book Now' : 'Payment'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h3 className="font-semibold text-emerald-800">{service?.name}</h3>
                <p className="text-emerald-600">{service?.description?.substring(0, 100)}...</p>
                <p className="text-2xl font-bold text-emerald-700 mt-2">
                  ${serviceType === 'hotel' ? service?.price_per_night : 
                    serviceType === 'car' ? service?.price_per_day :
                    serviceType === 'tour' ? service?.price_per_person :
                    service?.price}
                  {serviceType === 'hotel' ? '/night' : 
                   serviceType === 'car' ? '/day' :
                   serviceType === 'tour' ? '/person' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {serviceType === 'event' ? 'Event Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingData.start_date}
                    onChange={(e) => setBookingData({...bookingData, start_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                {serviceType !== 'event' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={bookingData.end_date}
                      onChange={(e) => setBookingData({...bookingData, end_date: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {serviceType === 'car' ? 'Drivers' : 'Guests'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={bookingData.guests}
                  onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                <textarea
                  rows="3"
                  value={bookingData.special_requests}
                  onChange={(e) => setBookingData({...bookingData, special_requests: e.target.value})}
                  placeholder="Any special requirements or requests..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Creating Booking...' : 'Continue to Payment'}
              </button>
            </form>
          )}

          {step === 2 && booking && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FaCheck className="text-green-600" />
                  <span className="font-semibold text-green-800">Booking Created Successfully!</span>
                </div>
                <p className="text-green-600">Booking ID: {booking.id}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{booking.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dates:</span>
                    <span>{booking.start_date} {booking.end_date && `- ${booking.end_date}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests:</span>
                    <span>{booking.guests}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${booking.total_price}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FaCreditCard />
                <span>{loading ? 'Processing...' : 'Pay with Stripe'}</span>
              </button>

              <p className="text-xs text-gray-500 text-center">
                Your payment is secured by Stripe. You will be redirected to complete the payment.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Home Page Component
const HomePage = () => {
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);

  const heroImages = [
    "https://images.pexels.com/photos/4441618/pexels-photo-4441618.jpeg",
    "https://images.pexels.com/photos/3030306/pexels-photo-3030306.jpeg",
    "https://images.unsplash.com/photo-1630510590518-6f07f53458e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxGcmVldG93biUyMFNpZXJyYSUyMExlb25lfGVufDB8fHx8MTc0OTIzMDA5M3ww&ixlib=rb-4.1.0&q=85"
  ];

  const features = [
    {
      icon: FaHotel,
      title: "Luxury Hotels",
      description: "Premium accommodations across Freetown, Bo, and Kenema",
      count: "50+"
    },
    {
      icon: FaCar,
      title: "Car Rentals", 
      description: "Reliable vehicles for exploring Sierra Leone",
      count: "200+"
    },
    {
      icon: MdEventNote,
      title: "Cultural Events",
      description: "Traditional festivals and modern entertainment",
      count: "100+"
    },
    {
      icon: MdTour,
      title: "Adventure Tours",
      description: "Banana Islands, Bunce Island, and nature experiences",
      count: "75+"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <div className="absolute inset-0">
          <img 
            src={heroImages[0]}
            alt="Sierra Leone Beauty"
            className="w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl">
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Discover the Beauty of
            <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Sierra Leone
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto"
          >
            From pristine beaches to vibrant culture, explore West Africa's hidden gem with our AI-powered travel platform
          </motion.p>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => setIsAIPlannerOpen(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <HiSparkles className="inline mr-2" />
              Plan My Trip with AI
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>
            
            <Link
              to="/hotels"
              className="px-8 py-4 border-2 border-white/30 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              Explore Hotels
            </Link>
          </motion.div>
        </div>

        {/* Floating AI Assistant Button */}
        <motion.button
          onClick={() => setIsAIPlannerOpen(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform duration-300 z-40"
        >
          <HiSparkles />
        </motion.button>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Your Gateway to Sierra Leone
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the warmth of Sierra Leonean hospitality through our curated selection of accommodations, tours, and experiences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative p-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="text-2xl text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      {feature.count}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
              Popular Destinations
            </h2>
            <p className="text-xl text-gray-600">Discover Sierra Leone's most beautiful locations</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Freetown Peninsula",
                description: "Beaches, culture, and vibrant city life",
                image: heroImages[1]
              },
              {
                name: "Banana Islands",
                description: "Pristine beaches and crystal-clear waters",
                image: heroImages[2]
              },
              {
                name: "Bo District",
                description: "Cultural heritage and diamond mines",
                image: heroImages[0]
              }
            ].map((destination, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="aspect-w-16 aspect-h-12">
                  <img 
                    src={destination.image} 
                    alt={destination.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{destination.name}</h3>
                  <p className="text-gray-200">{destination.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Trip Planner Modal */}
      <AIPlannerModal isOpen={isAIPlannerOpen} onClose={() => setIsAIPlannerOpen(false)} />
    </div>
  );
};

// Service List Component
const ServiceListPage = ({ serviceType }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const endpoint = serviceType === 'real-estate' ? 'real-estate' : `${serviceType}s`;
        const response = await axios.get(`${API}/${endpoint}`);
        setServices(response.data);
      } catch (error) {
        console.error(`Error fetching ${serviceType}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [serviceType]);

  const getServiceIcon = (type) => {
    switch(type) {
      case 'hotel': return FaHotel;
      case 'car': return FaCar;
      case 'event': return MdEventNote;
      case 'tour': return MdTour;
      case 'real-estate': return MdHome;
      default: return FaGlobe;
    }
  };

  const getServiceTitle = (type) => {
    switch(type) {
      case 'hotel': return 'Hotels in Sierra Leone';
      case 'car': return 'Car Rentals in Sierra Leone';
      case 'event': return 'Events in Sierra Leone';
      case 'tour': return 'Tours in Sierra Leone';
      case 'real-estate': return 'Real Estate in Sierra Leone';
      default: return 'Services';
    }
  };

  const Icon = getServiceIcon(serviceType);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            {getServiceTitle(serviceType)}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover amazing {serviceType === 'real-estate' ? 'properties' : `${serviceType}s`} across Sierra Leone
          </p>
        </motion.div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <Icon className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No {serviceType}s available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20 group"
              >
                <div className="h-48 bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center relative overflow-hidden">
                  {service.images && service.images.length > 0 ? (
                    <img src={service.images[0]} alt={service.name || service.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="text-4xl text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300" />
                  <button 
                    onClick={() => {
                      setSelectedService(service);
                      setIsBookingOpen(true);
                    }}
                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-200"
                  >
                    <FaEye />
                  </button>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {service.name || service.title}
                  </h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center mb-3">
                    <FaMapMarkerAlt className="text-emerald-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      {service.location.area ? `${service.location.area}, ` : ''}
                      {service.location.city}, {service.location.district}
                    </span>
                  </div>
                  
                  {service.rating && (
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < Math.floor(service.rating) ? 'text-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({service.reviews_count || 0} reviews)
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-emerald-600">
                        ${serviceType === 'hotel' ? service.price_per_night :
                          serviceType === 'car' ? service.price_per_day :
                          serviceType === 'tour' ? service.price_per_person :
                          serviceType === 'real-estate' ? service.price :
                          service.price}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {serviceType === 'hotel' ? '/night' :
                         serviceType === 'car' ? '/day' :
                         serviceType === 'tour' ? '/person' :
                         serviceType === 'real-estate' ? (service.listing_type === 'Rent' ? '/month' : '') :
                         ''}
                      </span>
                    </div>
                    <Link
                      to={`/${serviceType === 'real-estate' ? 'real-estate' : serviceType}s/${service.id}`}
                      className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      {serviceType === 'real-estate' ? 'View Details' : 'Book Now'}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        service={selectedService}
        serviceType={serviceType}
      />
    </div>
  );
};

// Service Detail Component
const ServiceDetailPage = ({ serviceType }) => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const endpoint = serviceType === 'real-estate' ? 'real-estate' : `${serviceType}s`;
        const response = await axios.get(`${API}/${endpoint}/${id}`);
        setService(response.data);
      } catch (error) {
        console.error(`Error fetching ${serviceType}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id, serviceType]);

  const nextImage = () => {
    if (service?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
    }
  };

  const prevImage = () => {
    if (service?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + service.images.length) % service.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Not Found</h2>
          <Link 
            to={`/${serviceType}s`}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Back to {serviceType}s
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="mb-6"
        >
          <Link 
            to={`/${serviceType === 'real-estate' ? 'real-estate' : serviceType}s`}
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <FaArrowLeft />
            <span>Back to {serviceType}s</span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative h-96 bg-white rounded-2xl overflow-hidden shadow-lg mb-6"
            >
              {service.images && service.images.length > 0 ? (
                <>
                  <img 
                    src={service.images[currentImageIndex]} 
                    alt={service.name || service.title}
                    className="w-full h-full object-cover"
                  />
                  {service.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <FaChevronRight />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {service.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                  <FaHotel className="text-6xl text-white" />
                </div>
              )}
            </motion.div>

            {/* Service Info */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6"
            >
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {service.name || service.title}
              </h1>
              
              <div className="flex items-center mb-4">
                <FaMapMarkerAlt className="text-emerald-500 mr-2" />
                <span className="text-gray-600">
                  {service.location.area ? `${service.location.area}, ` : ''}
                  {service.location.city}, {service.location.district}
                </span>
              </div>

              {service.rating && (
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < Math.floor(service.rating) ? 'text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {service.rating} ({service.reviews_count || 0} reviews)
                  </span>
                </div>
              )}

              <p className="text-gray-700 leading-relaxed mb-6">
                {service.description}
              </p>

              {/* Features/Amenities */}
              {(service.amenities || service.features || service.included) && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {serviceType === 'hotel' ? 'Amenities' : 
                     serviceType === 'car' ? 'Features' :
                     serviceType === 'tour' ? 'Included' :
                     'Features'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(service.amenities || service.features || service.included || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-600">
                        <FaCheck className="text-emerald-500 text-sm" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Specific Info */}
              {serviceType === 'hotel' && service.room_types && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Room Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.room_types.map((room, index) => (
                      <div key={index} className="bg-emerald-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-emerald-800">{room.type}</h4>
                        <p className="text-emerald-600 text-sm mb-2">{room.description}</p>
                        <p className="text-emerald-700 font-bold">${room.price}/night</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviceType === 'car' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Brand</p>
                    <p className="font-semibold">{service.brand}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Year</p>
                    <p className="font-semibold">{service.year}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Seats</p>
                    <p className="font-semibold">{service.seats}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-gray-600 text-sm">Fuel</p>
                    <p className="font-semibold">{service.fuel_type}</p>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {service.contact_info && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    {service.contact_info.phone && (
                      <div className="flex items-center space-x-2">
                        <FaPhone className="text-blue-600" />
                        <span className="text-blue-700">{service.contact_info.phone}</span>
                      </div>
                    )}
                    {service.contact_info.email && (
                      <div className="flex items-center space-x-2">
                        <FaEnvelope className="text-blue-600" />
                        <span className="text-blue-700">{service.contact_info.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Reviews */}
            {service.reviews && service.reviews.length > 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Reviews</h3>
                <div className="space-y-4">
                  {service.reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{review.user}</h4>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{review.comment}</p>
                      <p className="text-gray-500 text-sm">{review.date}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sticky top-24"
            >
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-emerald-600">
                  ${serviceType === 'hotel' ? service.price_per_night :
                    serviceType === 'car' ? service.price_per_day :
                    serviceType === 'tour' ? service.price_per_person :
                    service.price}
                </div>
                <div className="text-gray-600">
                  {serviceType === 'hotel' ? 'per night' :
                   serviceType === 'car' ? 'per day' :
                   serviceType === 'tour' ? 'per person' :
                   serviceType === 'real-estate' ? (service.listing_type === 'Rent' ? 'per month' : '') :
                   ''}
                </div>
              </div>

              {serviceType !== 'real-estate' && (
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 mb-4"
                >
                  Book Now
                </button>
              )}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Service fee</span>
                  <span>Free</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Cancellation</span>
                  <span>Free</span>
                </div>
                <div className="flex items-center text-green-600 text-sm">
                  <FaShieldAlt className="mr-2" />
                  <span>Secure booking</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        service={service}
        serviceType={serviceType}
      />
    </div>
  );
};

// AI Planner Modal Component
const AIPlannerModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    destinations: [],
    duration: 3,
    budget: '',
    preferences: [],
    travelers: 1
  });
  const [loading, setLoading] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);

  const sierraLeoneDestinations = [
    "Freetown Peninsula", "Banana Islands", "Bo District", "Kenema", 
    "Tokeh Beach", "River No. 2 Beach", "Bunce Island", "Tiwai Island"
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const query = `I want to visit ${formData.destinations.join(', ')} for ${formData.duration} days with ${formData.travelers} travelers. Budget: $${formData.budget}. Preferences: ${formData.preferences.join(', ')}`;
      
      const response = await axios.post(`${API}/ai-trip-planner`, {
        query,
        destinations: formData.destinations,
        duration: formData.duration,
        budget: parseFloat(formData.budget) || null
      });
      
      setTripPlan(response.data);
      setStep(4);
    } catch (error) {
      console.error('Error generating trip plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-90vh overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">AI Trip Planner</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center mt-4 space-x-2">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Select Destinations</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {sierraLeoneDestinations.map((destination) => (
                  <button
                    key={destination}
                    onClick={() => {
                      const newDest = formData.destinations.includes(destination)
                        ? formData.destinations.filter(d => d !== destination)
                        : [...formData.destinations, destination];
                      setFormData({...formData, destinations: newDest});
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      formData.destinations.includes(destination)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {destination}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={formData.destinations.length === 0}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Trip Details</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget (USD)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Travelers</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.travelers}
                    onChange={(e) => setFormData({...formData, travelers: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Preferences</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['Beach & Relaxation', 'Cultural Experiences', 'Adventure Activities', 'Historical Sites', 'Local Cuisine', 'Wildlife & Nature'].map((pref) => (
                  <button
                    key={pref}
                    onClick={() => {
                      const newPrefs = formData.preferences.includes(pref)
                        ? formData.preferences.filter(p => p !== pref)
                        : [...formData.preferences, pref];
                      setFormData({...formData, preferences: newPrefs});
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      formData.preferences.includes(pref)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && tripPlan && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Sierra Leone Adventure</h3>
              <div className="bg-emerald-50 p-4 rounded-lg mb-4">
                <p className="text-emerald-700 whitespace-pre-wrap">
                  {tripPlan.itinerary.ai_generated_plan}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setTripPlan(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Plan Another Trip
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Login Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    if (result.success) {
      window.location.href = result.user.user_type === 'admin' ? '/dashboard/admin' : '/dashboard/user';
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue your Sierra Leone adventure</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Demo Login:</strong><br />
            Admin: admin@sierraexplore.com / admin123
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Hotels Page Component
const HotelsPage = () => <ServiceListPage serviceType="hotel" />;
const CarsPage = () => <ServiceListPage serviceType="car" />;
const EventsPage = () => <ServiceListPage serviceType="event" />;
const ToursPage = () => <ServiceListPage serviceType="tour" />;
const RealEstatePage = () => <ServiceListPage serviceType="real-estate" />;

// Detail Pages
const HotelDetailPage = () => <ServiceDetailPage serviceType="hotel" />;
const CarDetailPage = () => <ServiceDetailPage serviceType="car" />;
const EventDetailPage = () => <ServiceDetailPage serviceType="event" />;
const TourDetailPage = () => <ServiceDetailPage serviceType="tour" />;
const PropertyDetailPage = () => <ServiceDetailPage serviceType="real-estate" />;

const AIPlannerPage = () => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <AIPlannerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {!isOpen && (
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            AI Trip Planner
          </h1>
          <button
            onClick={() => setIsOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
          >
            Start Planning
          </button>
        </div>
      )}
    </div>
  );
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await signup(formData.email, formData.password, formData.full_name, formData.phone);
    if (result.success) {
      window.location.href = '/dashboard/user';
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Join Sierra Explore</h2>
          <p className="text-gray-600">Start your Sierra Leone adventure today</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+232 XX XXX XXXX"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.user_type !== 'admin') {
    return <Navigate to="/dashboard/user" replace />;
  }
  
  return children;
};

// User Dashboard
const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-xl text-gray-600">Manage your Sierra Leone adventures</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {[
            { title: "My Bookings", icon: FaCalendarAlt, count: bookings.length, color: "emerald" },
            { title: "Favorites", icon: FaHeart, count: "12", color: "red" },
            { title: "Trip Plans", icon: HiSparkles, count: "2", color: "blue" }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
              >
                <div className={`w-12 h-12 bg-${item.color}-500 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-3xl font-bold text-gray-600">{item.count}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Bookings</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No bookings yet. Start exploring Sierra Leone!</p>
              <Link 
                to="/hotels"
                className="inline-block mt-4 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Browse Hotels
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-800">{booking.service_name}</h3>
                    <p className="text-gray-600 text-sm">{booking.start_date}</p>
                    <p className="text-emerald-600 font-medium">${booking.total_price}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  
  const initSampleData = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/init-sample-data`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Sample data initialized successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error initializing sample data:', error);
      alert('Error initializing sample data');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600">Manage Sierra Explore platform</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Hotels", count: stats?.hotels || 0, icon: FaHotel, path: "/admin/hotels" },
            { title: "Cars", count: stats?.cars || 0, icon: FaCar, path: "/admin/cars" },
            { title: "Events", count: stats?.events || 0, icon: MdEventNote, path: "/admin/events" },
            { title: "Tours", count: stats?.tours || 0, icon: MdTour, path: "/admin/tours" },
            { title: "Properties", count: stats?.properties || 0, icon: MdHome, path: "/admin/properties" },
            { title: "Users", count: stats?.users || 0, icon: FaUsers },
            { title: "Bookings", count: stats?.bookings || 0, icon: FaCalendarAlt },
            { title: "Revenue", count: "$24.5K", icon: FaCreditCard }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.count}</p>
                  </div>
                  <Icon className="text-2xl text-emerald-500" />
                </div>
                {stat.path && (
                  <Link 
                    to={stat.path}
                    className="mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Manage →
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={initSampleData}
                className="p-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="flex items-center space-x-3">
                  <FaPlus />
                  <div>
                    <h3 className="font-semibold">Initialize Sample Data</h3>
                    <p className="text-sm opacity-90">Add Sierra Leone hotels, tours, and events</p>
                  </div>
                </div>
              </button>
              
              <Link
                to="/admin/hotels"
                className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-left block"
              >
                <div className="flex items-center space-x-3">
                  <FaHotel />
                  <div>
                    <h3 className="font-semibold">Manage Hotels</h3>
                    <p className="text-sm opacity-90">Add, edit, and delete hotel listings</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/admin/bookings"
                className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-left block"
              >
                <div className="flex items-center space-x-3">
                  <FaHistory />
                  <div>
                    <h3 className="font-semibold">View All Bookings</h3>
                    <p className="text-sm opacity-90">Monitor and manage customer bookings</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Bookings</h2>
            {stats?.recent_bookings?.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">{booking.service_name}</h3>
                      <p className="text-gray-600 text-sm">{booking.service_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${booking.total_price}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No recent bookings</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Service Lists */}
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/real-estate" element={<RealEstatePage />} />
            
            {/* Service Details */}
            <Route path="/hotels/:id" element={<HotelDetailPage />} />
            <Route path="/cars/:id" element={<CarDetailPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/tours/:id" element={<TourDetailPage />} />
            <Route path="/real-estate/:id" element={<PropertyDetailPage />} />
            
            <Route path="/ai-planner" element={<AIPlannerPage />} />
            
            {/* User Dashboard */}
            <Route 
              path="/dashboard/user" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Dashboard */}
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
