'use client';

import { User } from '@/lib/database.types';
import { useState } from 'react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: ProfileModalProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  return (
    <>
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md animate-modalSlideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Background with Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/90 via-pink-300/90 to-blue-400/90 rounded-3xl blur-xl"></div>
        
        {/* Main Card */}
        <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-all duration-200 shadow-lg group"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Cover Photo */}
          <div 
            className={`relative h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 ${user.foto_sampul ? 'cursor-pointer' : ''} group/cover`}
            onClick={() => user.foto_sampul && setViewingImage(user.foto_sampul)}
          >
            {user.foto_sampul ? (
              <>
                <img
                  src={user.foto_sampul}
                  alt="Cover"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/20 transition-all duration-300"></div>
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </div>

          {/* Profile Photo */}
          <div className="relative px-6 pb-6">
            <div className="flex justify-center -mt-16 mb-4">
              <div 
                className={`relative group ${user.foto_profil ? 'cursor-pointer' : ''}`}
                onClick={() => user.foto_profil && setViewingImage(user.foto_profil)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                  {user.foto_profil ? (
                    <>
                      <img
                        src={user.foto_profil}
                        alt={user.nama}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {user.nama?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Name */}
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
              {user.nama}
            </h2>
            
            {/* Decorative Dots */}
            <div className="flex justify-center gap-1 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse delay-75"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-150"></div>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              {/* Asal */}
              <div className="group bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Asal</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{user.asal}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="group bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Status</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{user.status}</p>
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              {user.keterangan && (
                <div className="group bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-pink-600 uppercase tracking-wider">Keterangan</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{user.keterangan}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setViewingImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 group"
          >
            <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative max-w-4xl max-h-[90vh] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Zoom Instruction */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium">Klik di luar gambar untuk menutup</p>
          </div>
        </div>
      )}
    </>
  );
}
