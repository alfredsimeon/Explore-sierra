import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaStar, FaCalendarAlt, FaUsers, FaPhone, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../App';

const ServiceDetailPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    start_date: '',
    end_date: '',
    guests: 1,
    special_requests: ''
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchService();
  }, [type, id]);

  const fetchService = async () => {
    try {
      const endpoint = type === 'real-estate' ? 'real-estate' : `${type}s`;
      const response = await axios.get(`/${endpoint}/${id}`);
      setService(response.data);
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingRequest = {
        service_type: type === 'real-estate' ? 'real-estate' : type.slice(0, -1), // Remove 's' from plural
        service_id: id,
        ...bookingData
      };

      const response = await axios.post('/bookings/create', bookingRequest);
      alert('Booking created successfully!');
      setShowBookingForm(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Service Not Found</h2>
          <p className="text-gray-600">The requested service could not be found.</p>
        </div>
      </div>
    );
  }

  const price = service.price_per_night || service.price_per_day || service.price_per_person || service.price;
  const priceLabel = type === 'hotels' ? '/night' : type === 'cars' ? '/day' : type === 'tours' ? '/person' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <div className="h-64 md:h-96 bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center">
              <div className="text-8xl text-white">
                {type === 'hotels' && '🏨'}
                {type === 'cars' && '🚗'}
                {type === 'tours' && '🗺️'}
                {type === 'events' && '🎉'}
                {type === 'real-estate' && '🏠'}
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    {service.name || service.title}
                  </h1>

                  {service.location && (
                    <div className="flex items-center text-gray-600 mb-4">
                      <FaMapMarkerAlt className="mr-2" />
                      <span className="text-lg">
                        {service.location.area && `${service.location.area}, `}
                        {service.location.city}, {service.location.district}
                      </span>
                    </div>
                  )}

                  {service.rating > 0 && (
                    <div className="flex items-center text-yellow-500 mb-6">
                      <FaStar className="mr-2" />
                      <span className="text-lg font-medium">
                        {service.rating} ({service.reviews_count || 0} reviews)
                      </span>
                    </div>
                  )}

                  <div className="prose max-w-none mb-8">
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Service-specific details */}
                  {type === 'hotels' && service.amenities && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {service.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === 'cars' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-800">Brand</div>
                        <div className="text-gray-600">{service.brand}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-800">Year</div>
                        <div className="text-gray-600">{service.year}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-800">Transmission</div>
                        <div className="text-gray-600">{service.transmission}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-800">Seats</div>
                        <div className="text-gray-600">{service.seats}</div>
                      </div>
                    </div>
                  )}

                  {type === 'tours' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-800">Duration</div>
                        <div className="text-gray-600">{service.duration_days} days</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-800">Group Size</div>
                        <div className="text-gray-600">Max {service.max_group_size}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-800">Difficulty</div>
                        <div className="text-gray-600">{service.difficulty_level}</div>
                      </div>
                    </div>
                  )}

                  {type === 'events' && service.date && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Event Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-gray-600">
                          <FaCalendarAlt className="mr-2" />
                          <span>
                            {new Date(service.date).toLocaleDateString()} at{' '}
                            {new Date(service.date).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaUsers className="mr-2" />
                          <span>
                            {service.current_attendees || 0} / {service.max_attendees} attendees
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {service.contact_info && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
                      <div className="space-y-2">
                        {service.contact_info.phone && (
                          <div className="flex items-center text-gray-600">
                            <FaPhone className="mr-2" />
                            <span>{service.contact_info.phone}</span>
                          </div>
                        )}
                        {service.contact_info.email && (
                          <div className="flex items-center text-gray-600">
                            <FaEnvelope className="mr-2" />
                            <span>{service.contact_info.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Booking Card */}
                <div className="lg:w-96">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 sticky top-24">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-emerald-600">
                        ${price}
                        <span className="text-lg text-gray-500 ml-1">{priceLabel}</span>
                      </div>
                    </div>

                    {!showBookingForm ? (
                      <button
                        onClick={() => setShowBookingForm(true)}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                      >
                        Book Now
                      </button>
                    ) : (
                      <form onSubmit={handleBooking} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            required
                            value={bookingData.start_date}
                            onChange={(e) => setBookingData({...bookingData, start_date: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        {type !== 'events' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={bookingData.end_date}
                              onChange={(e) => setBookingData({...bookingData, end_date: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {type === 'hotels' ? 'Guests' : type === 'tours' ? 'Participants' : 'People'}
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Requests (Optional)
                          </label>
                          <textarea
                            rows="3"
                            value={bookingData.special_requests}
                            onChange={(e) => setBookingData({...bookingData, special_requests: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Any special requirements..."
                          />
                        </div>

                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowBookingForm(false)}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={bookingLoading}
                            className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                          </button>
                        </div>
                      </form>
                    )}

                    {!isAuthenticated && (
                      <p className="text-center text-sm text-gray-500 mt-4">
                        Please sign in to make a booking
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;