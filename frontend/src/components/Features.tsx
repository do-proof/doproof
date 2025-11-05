import React from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const Features: React.FC = () => {
  const features: Feature[] = [
    {
      icon: "🚀",
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with our optimized solutions that scale with your needs.",
      color: "bg-blue-500"
    },
    {
      icon: "🛡️",
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee to keep your business running smoothly.",
      color: "bg-green-500"
    },
    {
      icon: "💡",
      title: "Innovation First",
      description: "Cutting-edge technology and creative solutions that give you a competitive edge in the market.",
      color: "bg-purple-500"
    },
    {
      icon: "🤝",
      title: "24/7 Support",
      description: "Round-the-clock expert support to help you succeed at every step of your journey.",
      color: "bg-orange-500"
    },
    {
      icon: "📊",
      title: "Analytics & Insights",
      description: "Comprehensive analytics and actionable insights to drive data-driven decisions.",
      color: "bg-red-500"
    },
    {
      icon: "🌐",
      title: "Global Reach",
      description: "Connect with users worldwide with our multi-region infrastructure and localization support.",
      color: "bg-indigo-500"
    }
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose <span className="gradient-text">DoProof</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We provide the tools and support you need to turn your vision into reality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 ${feature.color} rounded-lg flex items-center justify-center text-2xl mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-white rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">500+</div>
              <div className="text-gray-600">Startups</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features; 