import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaStar, FaFilter, FaSearch } from 'react-icons/fa';
import axios from 'axios';

const ServicesPage = () => {
  const { type } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    location: '',
    rating: ''
  });

  useEffect(() => {
    fetchServices();
  }, [type]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'real-estate' ? 'real-estate' : type;
      const response = await axios.get(`/${endpoint}`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceConfig = () => {
    const configs = {
      hotels: {
        title: 'Hotels',
        description: 'Discover comfortable accommodations across Sierra Leone',
        priceLabel: '/night'
      },
      cars: {
        title: 'Car Rentals',
        description: 'Reliable vehicles for your Sierra Leone adventure',
        priceLabel: '/day'
      },
      tours: {
        title: 'Tours',
        description: 'Guided experiences and cultural immersion',
        priceLabel: '/person'
      },
      events: {
        title: 'Events',
        description: 'Cultural festivals and local celebrations',
        priceLabel: ''
      },
      'real-estate': {
        title: 'Real Estate',
        description: 'Properties for sale and rent in Sierra Leone',
        priceLabel: ''
      }
    };
    return configs[type] || configs.hotels;
  };

  const config = getServiceConfig();

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const price = service.price_per_night || service.price_per_day || service.price_per_person || service.price || 0;
    const matchesMinPrice = !filters.minPrice || price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || price <= parseFloat(filters.maxPrice);
    
    const matchesLocation = !filters.location || 
                           service.location?.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
                           service.location?.district?.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesRating = !filters.rating || service.rating >= parseFloat(filters.rating);

    return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesLocation && matchesRating;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {config.title.toLowerCase()}...</p>
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
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            {config.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {config.description}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${config.title.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div>
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredServices.length} of {services.length} {config.title.toLowerCase()}
          </p>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <FaFilter className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No {config.title} Found</h2>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="h-48 bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center">
                  <div className="text-4xl text-white">
                    {type === 'hotels' && '🏨'}
                    {type === 'cars' && '🚗'}
                    {type === 'tours' && '🗺️'}
                    {type === 'events' && '🎉'}
                    {type === 'real-estate' && '🏠'}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {service.name || service.title}
                  </h3>
                  
                  {service.location && (
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{service.location.city}, {service.location.district}</span>
                    </div>
                  )}
                  
                  {service.rating > 0 && (
                    <div className="flex items-center text-yellow-500 text-sm mb-3">
                      <FaStar className="mr-1" />
                      <span>{service.rating} ({service.reviews_count || 0} reviews)</span>
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-emerald-600">
                      ${service.price_per_night || service.price_per_day || service.price_per_person || service.price}
                      <span className="text-sm text-gray-500 ml-1">{config.priceLabel}</span>
                    </div>
                    <Link
                      to={`/service/${type}/${service.id}`}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;