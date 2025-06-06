import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHotel, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaStar, FaArrowRight } from 'react-icons/fa';
import { MdTour, MdHome } from 'react-icons/md';
import axios from 'axios';

const HomePage = () => {
  const [featuredServices, setFeaturedServices] = useState({
    hotels: [],
    cars: [],
    tours: [],
    events: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedServices();
  }, []);

  const fetchFeaturedServices = async () => {
    try {
      const [hotelsRes, carsRes, toursRes, eventsRes] = await Promise.all([
        axios.get('/hotels'),
        axios.get('/cars'),
        axios.get('/tours'),
        axios.get('/events')
      ]);

      setFeaturedServices({
        hotels: hotelsRes.data.slice(0, 3),
        cars: carsRes.data.slice(0, 3),
        tours: toursRes.data.slice(0, 3),
        events: eventsRes.data.slice(0, 3)
      });
    } catch (error) {
      console.error('Error fetching featured services:', error);
    } finally {
      setLoading(false);
    }
  };

  const services = [
    {
      title: 'Hotels',
      description: 'Luxury accommodations across Sierra Leone',
      icon: FaHotel,
      path: '/services/hotels',
      color: 'from-blue-500 to-blue-600',
      count: featuredServices.hotels.length
    },
    {
      title: 'Car Rentals',
      description: 'Reliable vehicles for your adventures',
      icon: FaCar,
      path: '/services/cars',
      color: 'from-emerald-500 to-emerald-600',
      count: featuredServices.cars.length
    },
    {
      title: 'Tours',
      description: 'Guided experiences and cultural immersion',
      icon: MdTour,
      path: '/services/tours',
      color: 'from-purple-500 to-purple-600',
      count: featuredServices.tours.length
    },
    {
      title: 'Events',
      description: 'Cultural festivals and local celebrations',
      icon: FaCalendarAlt,
      path: '/services/events',
      color: 'from-orange-500 to-orange-600',
      count: featuredServices.events.length
    },
    {
      title: 'Real Estate',
      description: 'Properties for sale and rent',
      icon: MdHome,
      path: '/services/real-estate',
      color: 'from-red-500 to-red-600',
      count: 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Explore
              </span>
              <br />
              <span className="text-gray-800">Sierra Leone</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover the beauty, culture, and adventure of West Africa's hidden gem. 
              From pristine beaches to vibrant cities, your Sierra Leone journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/ai-trip-planner"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Plan Your Trip with AI</span>
                <FaArrowRight />
              </Link>
              <Link
                to="/services/hotels"
                className="px-8 py-4 border-2 border-emerald-500 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-300"
              >
                Browse Services
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Services</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need for an unforgettable Sierra Leone experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link
                    to={service.path}
                    className="block bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="text-2xl text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 font-semibold group-hover:text-emerald-700">
                        Explore {service.title}
                      </span>
                      <FaArrowRight className="text-emerald-600 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      {!loading && featuredServices.hotels.length > 0 && (
        <section className="py-16 px-4 bg-white/50">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">Featured Hotels</h2>
                <p className="text-gray-600">Handpicked accommodations for your stay</p>
              </div>
              <Link
                to="/services/hotels"
                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-2"
              >
                <span>View All</span>
                <FaArrowRight />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredServices.hotels.map((hotel, index) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-48 bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center">
                    <FaHotel className="text-4xl text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{hotel.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{hotel.location.city}, {hotel.location.district}</span>
                    </div>
                    {hotel.rating > 0 && (
                      <div className="flex items-center text-yellow-500 text-sm mb-3">
                        <FaStar className="mr-1" />
                        <span>{hotel.rating} ({hotel.reviews_count} reviews)</span>
                      </div>
                    )}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hotel.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-emerald-600">
                        ${hotel.price_per_night}
                        <span className="text-sm text-gray-500 ml-1">/night</span>
                      </div>
                      <Link
                        to={`/service/hotel/${hotel.id}`}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Explore Sierra Leone?</h2>
            <p className="text-xl mb-8 opacity-90">
              Let our AI trip planner create the perfect itinerary for your adventure
            </p>
            <Link
              to="/ai-trip-planner"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-emerald-600 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              <span>Start Planning Now</span>
              <FaArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;