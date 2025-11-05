import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Dummy data
const dummyProfile = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  avatar: "👨‍🎓",
  skills: ["React", "Node.js", "Python", "Machine Learning", "UI/UX Design"],
  education: {
    degree: "Bachelor of Computer Science",
    university: "Tech University",
    graduationYear: "2024",
    gpa: "3.8/4.0"
  },
  profileCompletion: 85,
  totalPoints: 1250,
  rank: 7
};

const dummyProofOfWork = [
  {
    id: 1,
    title: "E-commerce Website Development",
    startup: "ShopTech Solutions",
    description: "Built a full-stack e-commerce platform using React and Node.js",
    submittedDate: "2024-01-15",
    status: "Approved",
    points: 300,
    feedback: "Excellent work! Clean code and great user experience."
  },
  {
    id: 2,
    title: "Mobile App UI Design",
    startup: "InnovateMobile",
    description: "Designed user interface for a fitness tracking mobile app",
    submittedDate: "2024-01-10",
    status: "Pending",
    points: 200,
    feedback: null
  },
  {
    id: 3,
    title: "Data Analysis Dashboard",
    startup: "DataViz Corp",
    description: "Created interactive dashboard for sales data visualization",
    submittedDate: "2024-01-05",
    status: "Rejected",
    points: 0,
    feedback: "Dashboard lacks proper error handling and documentation."
  },
  {
    id: 4,
    title: "API Integration Project",
    startup: "ConnectAPI",
    description: "Integrated multiple third-party APIs for a booking system",
    submittedDate: "2024-01-20",
    status: "Approved",
    points: 250,
    feedback: "Great API design and comprehensive testing."
  }
];

const dummyTasks = [
  {
    id: 1,
    title: "Frontend Developer Needed",
    startup: "TechStart Inc",
    description: "Build responsive landing page using React and Tailwind CSS",
    deadline: "2024-02-15",
    rewardPoints: 150,
    difficulty: "Easy",
    skills: ["React", "Tailwind CSS", "JavaScript"]
  },
  {
    id: 2,
    title: "Backend API Development",
    startup: "DataFlow Systems",
    description: "Create RESTful API for user management system",
    deadline: "2024-02-20",
    rewardPoints: 300,
    difficulty: "Medium",
    skills: ["Node.js", "Express", "MongoDB"]
  },
  {
    id: 3,
    title: "Mobile App Testing",
    startup: "AppTest Pro",
    description: "Perform comprehensive testing for iOS app",
    deadline: "2024-02-10",
    rewardPoints: 100,
    difficulty: "Easy",
    skills: ["iOS", "Testing", "QA"]
  },
  {
    id: 4,
    title: "Machine Learning Model",
    startup: "AI Solutions",
    description: "Develop recommendation system using Python",
    deadline: "2024-02-25",
    rewardPoints: 500,
    difficulty: "Hard",
    skills: ["Python", "Machine Learning", "TensorFlow"]
  }
];

const dummyLeaderboard = [
  { rank: 1, name: "Sarah Chen", points: 2850, avatar: "👩‍💻", badge: "🥇" },
  { rank: 2, name: "Mike Rodriguez", points: 2650, avatar: "👨‍💻", badge: "🥈" },
  { rank: 3, name: "Emma Wilson", points: 2400, avatar: "👩‍💻", badge: "🥉" },
  { rank: 4, name: "David Kim", points: 2200, avatar: "👨‍💻", badge: "🏅" },
  { rank: 5, name: "Lisa Thompson", points: 2000, avatar: "👩‍💻", badge: "🏅" },
  { rank: 6, name: "James Brown", points: 1800, avatar: "👨‍💻", badge: "🏅" },
  { rank: 7, name: "Alex Johnson", points: 1250, avatar: "👨‍🎓", badge: "🏅" },
  { rank: 8, name: "Maria Garcia", points: 1100, avatar: "👩‍💻", badge: "🏅" },
  { rank: 9, name: "Tom Anderson", points: 950, avatar: "👨‍💻", badge: "🏅" },
  { rank: 10, name: "Anna Lee", points: 800, avatar: "👩‍💻", badge: "🏅" }
];

const FresherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🚀</div>
              <div>
                <h1 className="text-xl font-bold gradient-text">DoProof</h1>
                <p className="text-xs text-gray-500 -mt-1">Fresher Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}!</span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{dummyProfile.avatar}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{dummyProfile.name}</h2>
                  <p className="text-gray-600">{dummyProfile.email}</p>
                </div>
              </div>
              
              {/* Profile Completion */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                  <span className="text-sm text-gray-600">{dummyProfile.profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dummyProfile.profileCompletion}%` }}
                  ></div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {dummyProfile.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Education</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{dummyProfile.education.degree}</p>
                  <p className="text-gray-600">{dummyProfile.education.university}</p>
                  <p className="text-gray-600">Graduated: {dummyProfile.education.graduationYear} | GPA: {dummyProfile.education.gpa}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lg:w-64">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Points:</span>
                    <span className="font-bold">{dummyProfile.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Rank:</span>
                    <span className="font-bold">#{dummyProfile.rank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasks Completed:</span>
                    <span className="font-bold">{dummyProofOfWork.filter(task => task.status === 'Approved').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'proof-of-work', label: 'My Proof-of-Work', icon: '📝' },
            { id: 'tasks', label: 'Available Tasks', icon: '🎯' },
            { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Proof-of-Work */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Proof-of-Work</h3>
              <div className="space-y-3">
                {dummyProofOfWork.slice(0, 3).map((task) => (
                  <div key={task.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.startup}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dummyProofOfWork.filter(t => t.status === 'Approved').length}</div>
                  <div className="text-sm text-gray-600">Approved Tasks</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dummyProfile.totalPoints}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{dummyProofOfWork.filter(t => t.status === 'Pending').length}</div>
                  <div className="text-sm text-gray-600">Pending Tasks</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">#{dummyProfile.rank}</div>
                  <div className="text-sm text-gray-600">Current Rank</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proof-of-work' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">My Proof-of-Work</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Startup</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dummyProofOfWork.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{task.startup}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{task.submittedDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Startup:</span>
                    <span className="font-medium">{task.startup}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deadline:</span>
                    <span className="font-medium">{task.deadline}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reward:</span>
                    <span className="font-medium text-green-600">{task.rewardPoints} points</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">Required Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {task.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Top Freshers Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fresher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dummyLeaderboard.map((player) => (
                    <tr key={player.rank} className={`hover:bg-gray-50 ${player.name === dummyProfile.name ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{player.badge}</span>
                          <span className="text-sm font-medium text-gray-900">#{player.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{player.avatar}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{player.name}</div>
                            {player.name === dummyProfile.name && (
                              <div className="text-xs text-blue-600 font-medium">You</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{player.points.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="text-2xl">{player.badge}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FresherDashboard; 