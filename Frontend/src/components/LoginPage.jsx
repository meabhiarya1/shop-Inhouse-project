import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginInterface() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-16 left-20 w-6 h-6 bg-orange-300 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute top-12 right-32 w-4 h-4 bg-yellow-300 rounded-full opacity-50"></div>
      <div className="absolute top-8 right-16 w-8 h-4 bg-pink-400 rounded-full opacity-60"></div>
      <div className="absolute top-36 right-8 w-3 h-3 bg-blue-400 rounded-full opacity-70"></div>
      <div className="absolute bottom-32 left-8 w-4 h-4 bg-blue-300 rounded-full opacity-60"></div>
      <div className="absolute bottom-16 left-32 w-2 h-2 bg-yellow-400 rounded-full opacity-50"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 bg-green-300 rounded-full opacity-40"></div>
      
      <div className="w-full max-w-6xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left Panel - App Showcase */}
        <div className="w-1/2 bg-blue-600 p-12 text-white relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-4 left-4 w-4 h-4 bg-orange-300 rounded-full opacity-30"></div>
          <div className="absolute top-20 left-8 w-2 h-2 bg-green-300 rounded-full opacity-40"></div>
          <div className="absolute bottom-20 left-4 w-6 h-6 bg-red-300 rounded-full opacity-25"></div>
          <div className="absolute bottom-8 right-8 w-3 h-3 bg-yellow-300 rounded-full opacity-35"></div>
          <div className="absolute top-1/2 left-2 w-2 h-2 bg-green-400 rounded-full opacity-30"></div>
          
      {/* Main info card */}
          <div className="bg-white text-gray-800 rounded-2xl p-6 mb-6 shadow-xl transform -rotate-6 hover:rotate-0 transition-all duration-500 relative z-10">
            <div className="flex items-start mb-4">
              <div className="w-16 h-12 bg-yellow-200 rounded-lg mr-4 flex items-center justify-center text-2xl">
        📦
              </div>
              <div className="flex-1">
        <h3 className="font-bold text-lg leading-tight">Stock Intake Checklist</h3>
        <p className="text-sm text-gray-500">Inventory</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3 font-medium">1.</span>
        <span>Scan or add items</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-3 font-medium">2.</span>
        <span>Verify quantities</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-3 font-medium">3.</span>
        <span>Save and sync</span>
              </div>
            </div>
          </div>

          {/* Small floating card - calories */}
          <div className="absolute top-8 right-8 bg-white rounded-2xl p-3 shadow-lg transform rotate-12 hover:rotate-6 transition-all duration-300 z-20">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
      <p className="text-xs text-gray-600 font-medium">Real-time stock updates</p>
          </div>

          {/* Profile card */}
          <div className="absolute top-32 right-4 bg-white rounded-2xl p-4 shadow-lg transform rotate-[-8deg] hover:rotate-[-3deg] transition-all duration-300 z-20">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-200 rounded-full mr-2"></div>
              <div>
        <p className="text-xs font-semibold text-gray-800">Warehouse Manager</p>
        <p className="text-xs text-gray-400">Admin (Operations)</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded mr-2"></div>
        <p className="text-xs text-gray-700">Central Warehouse</p>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-pink-200 rounded mr-2"></div>
        <p className="text-xs text-gray-700">Inventory Specialist</p>
              </div>
            </div>
          </div>

          {/* Main content text */}
          <div className="mt-24 relative z-10">
      <h1 className="text-4xl font-bold mb-4 leading-tight">Smarter Inventory Control</h1>
      <p className="text-blue-100 mb-8 text-lg">Track stock, suppliers, and sales in one place.</p>
            
            {/* Pagination dots */}
            <div className="flex space-x-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full opacity-60"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full opacity-60"></div>
            </div>
          </div>

          {/* Wavy decorative lines */}
          <div className="absolute bottom-16 left-8">
            <svg width="80" height="30" viewBox="0 0 80 30" className="opacity-40">
              <path d="M0 15 Q20 5 40 15 T80 15" stroke="currentColor" strokeWidth="3" fill="none"/>
              <path d="M0 20 Q20 10 40 20 T80 20" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-1/2 p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
             
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome back</h2>
      <p className="text-gray-500 leading-relaxed">Sign in to manage products, stock, and sales.</p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="relative">
                  <input
                    type="email"
        placeholder="Work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-400">
                      <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => alert('Sign in clicked')}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}