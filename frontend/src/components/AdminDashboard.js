import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHotel, 
  FaCar, 
  FaCalendarAlt, 
  FaUsers, 
  FaDollarSign, 
  FaChartLine,
  FaPlus,
  FaEye,
  FaCog,
  FaBell
} from 'react-icons/fa';
import { MdTour, MdHome, MdEventNote } from 'react-icons/md';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    hotels: 0,
    cars: 0,
    events: 0,
    tours: 0,
    properties: 0,
    users: 0,
    bookings: 0,
    recent_bookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSampleData = async () => {
    try {
      setLoading(true);
      await axios.post('/admin/init-sample-data');
      await fetchStats();
      alert('Sample data initialized successfully!');
    } catch (error) {
      console.error('Error initializing sample data:', error);
      alert('Error initializing sample data');
    } finally {
      setLoading(false);
    }
  };

  const serviceCards = [
    {
      title: 'Hotels',
      count: stats.hotels,
      icon: FaHotel,
      color: 'from-blue-500 to-blue-600',
      managePath: '/admin/manage/hotel'
    },
    {
      title: 'Cars',
      count: stats.cars,
      icon: FaCar,
      color: 'from-emerald-500 to-emerald-600',
      managePath: '/admin/manage/car'
    },
    {
      title: 'Tours',
      count: stats.tours,
      icon: MdTour,
      color: 'from-purple-500 to-purple-600',
      managePath: '/admin/manage/tour'
    },
    {
      title: 'Events',
      count: stats.events,
      icon: MdEventNote,
      color: 'from-orange-500 to-orange-600',
      managePath: '/admin/manage/event'
    },
    {
      title: 'Real Estate',
      count: stats.properties,
      icon: MdHome,
      color: 'from-red-500 to-red-600',
      managePath: '/admin/manage/real-estate'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Manage your Sierra Explore platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={initializeSampleData}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <FaPlus />
                <span>Initialize Sample Data</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-800">{stats.users}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FaUsers className="text-white text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800">{stats.bookings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Services</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.hotels + stats.cars + stats.tours + stats.events + stats.properties}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FaChartLine className="text-white text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Revenue</p>
                <p className="text-3xl font-bold text-gray-800">$12,450</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <FaDollarSign className="text-white text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Service Management Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Service Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {serviceCards.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className="text-2xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{service.title}</h3>
                  <p className="text-3xl font-bold text-emerald-600 mb-4">{service.count}</p>
                  <Link
                    to={service.managePath}
                    className="w-full flex items-center justify-center space-x-2 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <FaCog className="text-sm" />
                    <span>Manage</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Recent Bookings</h3>
              <Link
                to="/admin/bookings"
                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <FaEye />
              </Link>
            </div>
            
            {stats.recent_bookings.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_bookings.map((booking, index) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{booking.service_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{booking.service_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${booking.total_price}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="text-4xl mx-auto mb-2 opacity-50" />
                <p>No recent bookings</p>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <Link
                to="/admin/manage/hotel"
                className="w-full flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <FaHotel className="text-blue-600" />
                <span className="font-medium text-blue-800">Add New Hotel</span>
              </Link>
              
              <Link
                to="/admin/manage/car"
                className="w-full flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <FaCar className="text-emerald-600" />
                <span className="font-medium text-emerald-800">Add New Car</span>
              </Link>
              
              <Link
                to="/admin/manage/tour"
                className="w-full flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <MdTour className="text-purple-600" />
                <span className="font-medium text-purple-800">Add New Tour</span>
              </Link>
              
              <Link
                to="/admin/bookings"
                className="w-full flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <FaCalendarAlt className="text-orange-600" />
                <span className="font-medium text-orange-800">View All Bookings</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Platform Management */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6">Platform Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl">
              <FaCog className="text-3xl text-emerald-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 mb-2">System Settings</h4>
              <p className="text-gray-600 text-sm mb-4">Configure platform settings and preferences</p>
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                Manage Settings
              </button>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <FaBell className="text-3xl text-blue-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 mb-2">Notifications</h4>
              <p className="text-gray-600 text-sm mb-4">Send announcements to all users</p>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Send Notification
              </button>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <FaChartLine className="text-3xl text-purple-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 mb-2">Analytics</h4>
              <p className="text-gray-600 text-sm mb-4">View detailed platform analytics</p>
              <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                View Analytics
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;