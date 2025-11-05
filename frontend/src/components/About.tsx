import React from 'react';

const About: React.FC = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our <span className="gradient-text">Mission</span>
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              At DoProof, we believe that innovation knows no boundaries. Our mission is to democratize technology and provide cutting-edge solutions that empower both fresh graduates and ambitious startups to achieve their dreams.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We're not just building products; we're building futures. Every line of code, every feature, and every interaction is designed with one goal in mind: to help you succeed in the digital age.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <span className="text-gray-700 font-medium">Empowering the next generation of innovators</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <span className="text-gray-700 font-medium">Breaking down barriers to technology access</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <span className="text-gray-700 font-medium">Creating sustainable solutions for tomorrow</span>
              </div>
            </div>
            
            <div className="mt-8">
              <button className="btn-outline">
                Learn More About Us
              </button>
            </div>
          </div>
          
          <div className="relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Vision 2030</h3>
                <p className="text-gray-600">
                  To become the leading platform that bridges the gap between talent and opportunity, 
                  fostering innovation across all industries.
                </p>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary-200 rounded-full opacity-60 animate-bounce-slow"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary-200 rounded-full opacity-60 animate-bounce-slow" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        
        {/* Values Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
            <p className="text-gray-600">We strive for excellence in everything we do, from code quality to user experience.</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaboration</h3>
            <p className="text-gray-600">We believe in the power of teamwork and collaboration to achieve extraordinary results.</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600">We constantly push boundaries and explore new possibilities to stay ahead of the curve.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 