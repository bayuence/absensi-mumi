"use client";

import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center transform transition-all duration-1000 hover:scale-105">
          {/* Glowing card background */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl"></div>
          
          <div className="relative p-12">
            {/* Animated title */}
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-6 animate-pulse">
              Selamat Datang di Website Presensi MUMI 👋
            </h1>
            
            {/* Subtitle with typing animation effect */}
            <p className="mb-8 text-xl text-gray-200 opacity-90 font-light tracking-wide">
              Silakan login untuk melanjutkan
            </p>
            
            {/* Animated login button */}
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-white transition-all duration-300 ease-out transform hover:scale-110 hover:rotate-1 focus:outline-none focus:ring-4 focus:ring-purple-300"
            >
              {/* Button background with gradient and animation */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl shadow-2xl transition-all duration-300 ease-out group-hover:shadow-purple-500/50 group-hover:shadow-2xl"></span>
              
              {/* Animated border */}
              <span className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
              
              {/* Button content */}
              <span className="relative flex items-center space-x-2">
                <span>Login Sekarang</span>
                <svg 
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Custom CSS Styles */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.4;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}