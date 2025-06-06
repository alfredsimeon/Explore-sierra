import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSave, FaTimes, FaHotel, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { MdEventNote, MdTour, MdHome } from 'react-icons/md';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Admin Service Management Component
export const AdminServiceManagement = ({ serviceType }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({});

  const getServiceConfig = (type) => {
    const configs = {
      hotel: {
        title: 'Hotels',
        icon: FaHotel,
        endpoint: 'hotels',
        fields: [
          { name: 'name', label: 'Hotel Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'price_per_night', label: 'Price per Night ($)', type: 'number', required: true },
          { name: 'amenities', label: 'Amenities (comma-separated)', type: 'text' },
        ]
      },
      car: {
        title: 'Cars',
        icon: FaCar,
        endpoint: 'cars',
        fields: [
          { name: 'name', label: 'Car Name', type: 'text', required: true },
          { name: 'brand', label: 'Brand', type: 'text', required: true },
          { name: 'model', label: 'Model', type: 'text', required: true },
          { name: 'year', label: 'Year', type: 'number', required: true },
          { name: 'price_per_day', label: 'Price per Day ($)', type: 'number', required: true },
          { name: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'] },
          { name: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel'] },
          { name: 'seats', label: 'Number of Seats', type: 'number', required: true },
        ]
      },
      event: {
        title: 'Events',
        icon: MdEventNote,
        endpoint: 'events',
        fields: [
          { name: 'name', label: 'Event Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'date', label: 'Event Date', type: 'datetime-local', required: true },
          { name: 'price', label: 'Price ($)', type: 'number', required: true },
          { name: 'max_attendees', label: 'Max Attendees', type: 'number', required: true },
          { name: 'organizer', label: 'Organizer', type: 'text', required: true },
          { name: 'category', label: 'Category', type: 'select', options: ['Cultural', 'Music', 'Festival', 'Sports'] },
        ]
      },
      tour: {
        title: 'Tours',
        icon: MdTour,
        endpoint: 'tours',
        fields: [
          { name: 'name', label: 'Tour Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'duration_days', label: 'Duration (days)', type: 'number', required: true },
          { name: 'price_per_person', label: 'Price per Person ($)', type: 'number', required: true },
          { name: 'max_group_size', label: 'Max Group Size', type: 'number', required: true },
          { name: 'difficulty_level', label: 'Difficulty', type: 'select', options: ['Easy', 'Moderate', 'Challenging'] },
          { name: 'tour_type', label: 'Tour Type', type: 'select', options: ['Cultural', 'Adventure', 'Beach', 'Historical'] },
        ]
      },
      'real-estate': {
        title: 'Real Estate',
        icon: MdHome,
        endpoint: 'real-estate',
        fields: [
          { name: 'title', label: 'Property Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'property_type', label: 'Property Type', type: 'select', options: ['House', 'Apartment', 'Land', 'Commercial'] },
          { name: 'listing_type', label: 'Listing Type', type: 'select', options: ['Sale', 'Rent'] },
          { name: 'price', label: 'Price ($)', type: 'number', required: true },
          { name: 'bedrooms', label: 'Bedrooms', type: 'number' },
          { name: 'bathrooms', label: 'Bathrooms', type: 'number' },
          { name: 'area_sqm', label: 'Area (sqm)', type: 'number' },
        ]
      }
    };
    return configs[type] || configs.hotel;
  };

  const config = getServiceConfig(serviceType);

  useEffect(() => {
    fetchServices();
  }, [serviceType]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/${config.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error(`Error fetching ${serviceType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormData({
      location: {
        district: 'Western Area',
        city: 'Freetown',
        area: '',
        coordinates: { lat: 8.4840, lng: -13.2299 }
      },
      images: [],
      available: true,
      contact_info: { phone: '', email: '' }
    });
    setIsModalOpen(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/${config.endpoint}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting item');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Process form data
      const processedData = { ...formData };
      
      // Handle arrays (amenities, features, etc.)
      config.fields.forEach(field => {
        if (field.name === 'amenities' || field.name === 'features' || field.name === 'included') {
          if (typeof processedData[field.name] === 'string') {
            processedData[field.name] = processedData[field.name].split(',').map(item => item.trim()).filter(item => item);
          }
        }
      });

      // Handle dates
      if (processedData.date && typeof processedData.date === 'string') {
        processedData.date = new Date(processedData.date).toISOString();
      }

      // Add default values for specific service types
      if (serviceType === 'tour' && !processedData.destinations) {
        processedData.destinations = [processedData.location];
      }

      if (serviceType === 'car' && !processedData.features) {
        processedData.features = ['Air Conditioning', 'GPS'];
      }

      if (editingService) {
        await axios.put(`${API}/${config.endpoint}/${editingService.id}`, processedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/${config.endpoint}`, processedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving item');
    }
  };

  const Icon = config.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Manage {config.title}
            </h1>
            <p className="text-gray-600 mt-2">Add, edit, and manage your {config.title.toLowerCase()}</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <FaPlus />
            <span>Add New</span>
          </button>
        </motion.div>

        {services.length === 0 ? (
          <div className="text-center py-16">
            <Icon className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No {config.title} Yet</h2>
            <p className="text-gray-500 mb-6">Start by adding your first {serviceType}</p>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Add Your First {serviceType}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {service.name || service.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {service.description}
                    </p>
                    
                    {service.location && (
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>{service.location.city}, {service.location.district}</span>
                      </div>
                    )}
                    
                    {service.rating && (
                      <div className="flex items-center text-yellow-500 text-sm mb-3">
                        <FaStar className="mr-1" />
                        <span>{service.rating} ({service.reviews_count || 0} reviews)</span>
                      </div>
                    )}
                    
                    <div className="text-2xl font-bold text-emerald-600">
                      ${serviceType === 'hotel' ? service.price_per_night :
                        serviceType === 'car' ? service.price_per_day :
                        serviceType === 'tour' ? service.price_per_person :
                        service.price}
                      <span className="text-sm text-gray-500 ml-1">
                        {serviceType === 'hotel' ? '/night' :
                         serviceType === 'car' ? '/day' :
                         serviceType === 'tour' ? '/person' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FaEdit className="text-sm" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <FaTrash className="text-sm" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-90vh overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {editingService ? 'Edit' : 'Add New'} {serviceType}
                    </h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.fields.map((field) => (
                      <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        
                        {field.type === 'select' ? (
                          <select
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            rows="4"
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    ))}

                    {/* Location Fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                      <select
                        value={formData.location?.district || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          location: { ...formData.location, district: e.target.value }
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select District</option>
                        <option value="Western Area">Western Area</option>
                        <option value="Bo">Bo</option>
                        <option value="Kenema">Kenema</option>
                        <option value="Kono">Kono</option>
                        <option value="Bombali">Bombali</option>
                        <option value="Tonkolili">Tonkolili</option>
                        <option value="Port Loko">Port Loko</option>
                        <option value="Kambia">Kambia</option>
                        <option value="Kailahun">Kailahun</option>
                        <option value="Moyamba">Moyamba</option>
                        <option value="Bonthe">Bonthe</option>
                        <option value="Pujehun">Pujehun</option>
                        <option value="Koinadugu">Koinadugu</option>
                        <option value="Falaba">Falaba</option>
                        <option value="Karene">Karene</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={formData.location?.city || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          location: { ...formData.location, city: e.target.value }
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter city"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area (Optional)</label>
                      <input
                        type="text"
                        value={formData.location?.area || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          location: { ...formData.location, area: e.target.value }
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter area/neighborhood"
                      />
                    </div>

                    {/* Contact Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={formData.contact_info?.phone || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contact_info: { ...formData.contact_info, phone: e.target.value }
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="+232 XX XXX XXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={formData.contact_info?.email || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contact_info: { ...formData.contact_info, email: e.target.value }
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <FaSave />
                      <span>{editingService ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Admin Bookings Management
export const AdminBookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Manage Bookings
          </h1>
          <p className="text-gray-600">View and manage all customer bookings</p>
        </motion.div>

        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No Bookings Yet</h2>
            <p className="text-gray-500">Bookings will appear here when customers make reservations</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Booking ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Service</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Guests</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Payment</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-gray-100 hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {booking.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {booking.service_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {booking.service_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(booking.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {booking.guests}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                        ${booking.total_price}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : booking.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        <AnimatePresence>
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-90vh overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Booking Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Booking ID:</span>
                          <span className="font-mono">{selectedBooking.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service:</span>
                          <span>{selectedBooking.service_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="capitalize">{selectedBooking.service_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Booking Date:</span>
                          <span>{new Date(selectedBooking.booking_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Service Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span>{new Date(selectedBooking.start_date).toLocaleDateString()}</span>
                        </div>
                        {selectedBooking.end_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">End Date:</span>
                            <span>{new Date(selectedBooking.end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guests:</span>
                          <span>{selectedBooking.guests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Price:</span>
                          <span className="font-bold text-emerald-600">${selectedBooking.total_price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.special_requests && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Special Requests</h3>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedBooking.special_requests}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedBooking.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedBooking.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Payment: {selectedBooking.payment_status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedBooking.status === 'confirmed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          Status: {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
