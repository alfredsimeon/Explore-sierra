import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaUsers, FaRocket, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const AITripPlanner = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);
  const [formData, setFormData] = useState({
    query: '',
    destinations: [],
    duration: 3,
    budget: '',
    preferences: []
  });

  const sierraLeoneDestinations = [
    'Freetown',
    'Bo',
    'Kenema',
    'Makeni',
    'Koidu',
    'Banana Islands',
    'Bunce Island',
    'Tokeh Beach',
    'River No. 2 Beach',
    'Tiwai Island',
    'Gola Rainforest',
    'Outamba-Kilimi National Park'
  ];

  const travelPreferences = [
    'Beach & Relaxation',
    'Cultural Experiences',
    'Adventure & Hiking',
    'Historical Sites',
    'Wildlife & Nature',
    'Local Cuisine',
    'Photography',
    'Music & Festivals',
    'Community Tourism',
    'Luxury Travel'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDestinationToggle = (destination) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.includes(destination)
        ? prev.destinations.filter(d => d !== destination)
        : [...prev.destinations, destination]
    }));
  };

  const handlePreferenceToggle = (preference) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateTripPlan = async () => {
    if (formData.destinations.length === 0) {
      alert('Please select at least one destination');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/ai-trip-planner', {
        query: formData.query || `Plan a ${formData.duration}-day trip to Sierra Leone`,
        destinations: formData.destinations,
        duration: formData.duration,
        budget: formData.budget ? parseFloat(formData.budget) : null
      });

      setTripPlan(response.data);
      setCurrentStep(5); // Move to results step
    } catch (error) {
      console.error('Error generating trip plan:', error);
      alert('Failed to generate trip plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPlanner = () => {
    setCurrentStep(1);
    setTripPlan(null);
    setFormData({
      query: '',
      destinations: [],
      duration: 3,
      budget: '',
      preferences: []
    });
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AI Trip Planner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let our AI create the perfect Sierra Leone itinerary tailored to your preferences
          </p>
        </motion.div>

        {/* Progress Bar */}
        {currentStep <= 4 && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                    step <= currentStep
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Trip Description */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20"
              >
                <div className="text-center mb-8">
                  <FaRocket className="text-4xl text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Tell us about your trip</h2>
                  <p className="text-gray-600">Describe what kind of Sierra Leone experience you're looking for</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      What kind of trip are you planning?
                    </label>
                    <textarea
                      value={formData.query}
                      onChange={(e) => handleInputChange('query', e.target.value)}
                      placeholder="e.g., I want a cultural adventure with beach relaxation, exploring local markets and trying traditional food..."
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-32 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">
                        <FaCalendarAlt className="inline mr-2" />
                        Trip Duration
                      </label>
                      <select
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21].map(days => (
                          <option key={days} value={days}>
                            {days} {days === 1 ? 'day' : 'days'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">
                        <FaDollarSign className="inline mr-2" />
                        Budget (Optional)
                      </label>
                      <input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        placeholder="Enter your budget in USD"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Destinations */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20"
              >
                <div className="text-center mb-8">
                  <FaMapMarkerAlt className="text-4xl text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Choose your destinations</h2>
                  <p className="text-gray-600">Select the places you'd like to visit in Sierra Leone</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sierraLeoneDestinations.map((destination) => (
                    <button
                      key={destination}
                      onClick={() => handleDestinationToggle(destination)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        formData.destinations.includes(destination)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="text-center">
                        <FaMapMarkerAlt className="mx-auto mb-2" />
                        <span className="font-medium">{destination}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={prevStep}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={formData.destinations.length === 0}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20"
              >
                <div className="text-center mb-8">
                  <FaUsers className="text-4xl text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">What interests you?</h2>
                  <p className="text-gray-600">Select your travel preferences to personalize your itinerary</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {travelPreferences.map((preference) => (
                    <button
                      key={preference}
                      onClick={() => handlePreferenceToggle(preference)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.preferences.includes(preference)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="font-medium">{preference}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={prevStep}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Generate */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20"
              >
                <div className="text-center mb-8">
                  <FaRocket className="text-4xl text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Review your trip details</h2>
                  <p className="text-gray-600">Make sure everything looks good before we generate your itinerary</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-bold text-gray-800 mb-3">Trip Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-medium">{formData.duration} days</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Budget:</span>
                        <span className="ml-2 font-medium">
                          {formData.budget ? `$${formData.budget}` : 'Not specified'}
                        </span>
                      </div>
                    </div>
                    {formData.query && (
                      <div className="mt-4">
                        <span className="text-gray-600">Description:</span>
                        <p className="mt-1 text-gray-800">{formData.query}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-bold text-gray-800 mb-3">Selected Destinations</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.destinations.map((destination) => (
                        <span
                          key={destination}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                        >
                          {destination}
                        </span>
                      ))}
                    </div>
                  </div>

                  {formData.preferences.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-bold text-gray-800 mb-3">Travel Preferences</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.preferences.map((preference) => (
                          <span
                            key={preference}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {preference}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={prevStep}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={generateTripPlan}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Generating Your Trip...</span>
                      </>
                    ) : (
                      <>
                        <FaRocket />
                        <span>Generate My Trip Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Results */}
            {currentStep === 5 && tripPlan && (
              <motion.div
                key="step5"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaRocket className="text-2xl text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Sierra Leone Adventure</h2>
                  <p className="text-gray-600">Here's your personalized itinerary</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Trip Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{tripPlan.duration_days}</div>
                        <div className="text-gray-600">Days</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{tripPlan.destinations.length}</div>
                        <div className="text-gray-600">Destinations</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">${tripPlan.total_estimated_cost}</div>
                        <div className="text-gray-600">Estimated Cost</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">AI Generated Itinerary</h3>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {tripPlan.itinerary.ai_generated_plan}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Your Selected Destinations</h3>
                    <div className="flex flex-wrap gap-2">
                      {tripPlan.destinations.map((destination, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-medium"
                        >
                          {destination}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-8 space-x-4">
                  <button
                    onClick={resetPlanner}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Plan Another Trip
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Save Itinerary
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AITripPlanner;