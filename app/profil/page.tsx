'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  username: string;
  nama: string;
  asal: string;
  status: string;
  keterangan: string;
  foto_profil?: string;
  foto_sampul?: string;
}

export default function ProfilPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadType, setUploadType] = useState<'profile' | 'cover'>('profile');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const username = localStorage.getItem('loggedUser');
    if (!username) {
      router.push('/login');
      return;
    }

    fetchUserProfile(username);
  }, [router]);

  const fetchUserProfile = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, nama, asal, status, keterangan, foto_profil, foto_sampul')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Jika kolom foto_profil/foto_sampul belum ada, tetap ambil data tanpa foto
        if (error.code === 'PGRST116' || error.message?.includes('foto_profil') || error.message?.includes('foto_sampul')) {
          const { data: dataWithoutPhoto, error: retryError } = await supabase
            .from('users')
            .select('username, nama, asal, status, keterangan')
            .eq('username', username)
            .single();
          
          if (retryError) throw retryError;
          setUserProfile(dataWithoutPhoto);
        } else {
          throw error;
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Gagal memuat profil. Pastikan Anda sudah login.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar' });
      return;
    }

    // Set upload type
    setUploadType(type);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setSelectedFile(file);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelUpload = () => {
    setShowModal(false);
    setPreviewImage(null);
    setSelectedFile(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 1), 3));
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewImage) return;
    
    // Crop image sesuai dengan preview
    const croppedBlob = await cropImage();
    if (!croppedBlob) return;
    
    // Convert blob to file
    const croppedFile = new File([croppedBlob], selectedFile.name, { type: selectedFile.type });
    
    // Upload berdasarkan tipe
    if (uploadType === 'profile') {
      await uploadPhoto(croppedFile);
    } else {
      await uploadCover(croppedFile);
    }
    
    setShowModal(false);
    setPreviewImage(null);
    setSelectedFile(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const cropImage = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let canvas: HTMLCanvasElement;
        let outputWidth: number;
        let outputHeight: number;
        let previewWidth: number;
        let previewHeight: number;

        if (uploadType === 'profile') {
          // Profile: Circular crop 400x400
          previewWidth = 288; // w-72
          previewHeight = 288; // h-72
          outputWidth = 400;
          outputHeight = 400;
        } else {
          // Cover: Rectangle landscape crop
          // Preview container menggunakan w-full h-48 di modal max-w-2xl (672px)
          previewWidth = 640; // Approx width of max-w-2xl minus padding
          previewHeight = 192; // h-48
          outputWidth = 1200; // High res cover
          outputHeight = 360; // Landscape ratio (roughly 3.33:1)
        }
        
        canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }

        // Background putih
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outputWidth, outputHeight);

        // Clip based on type
        ctx.save();
        if (uploadType === 'profile') {
          // Circular clip
          ctx.beginPath();
          ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        }
        // For cover, no clip needed (rectangle)

        // Scale ratio dari preview ke output
        const ratio = outputWidth / previewWidth;

        // Hitung ukuran gambar di preview
        let imgWidth: number;
        let imgHeight: number;
        
        if (uploadType === 'profile') {
          // Profile: fit by height
          imgHeight = previewHeight;
          imgWidth = (img.width / img.height) * imgHeight;
        } else {
          // Cover: fit by width
          imgWidth = previewWidth;
          imgHeight = (img.height / img.width) * imgWidth;
        }

        // Posisi center gambar di container
        const centerX = previewWidth / 2;
        const centerY = previewHeight / 2;

        // Transform canvas context (sama seperti CSS transform)
        ctx.translate(centerX * ratio, centerY * ratio); // Pindah ke center
        ctx.translate(position.x * ratio, position.y * ratio); // Apply translate dari drag
        ctx.scale(zoom, zoom); // Apply scale dari zoom
        ctx.translate(-imgWidth / 2 * ratio, -imgHeight / 2 * ratio); // Offset untuk center origin

        // Draw image
        ctx.drawImage(img, 0, 0, imgWidth * ratio, imgHeight * ratio);
        
        ctx.restore();

        // Convert to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
      img.src = previewImage!;
    });
  };

  const uploadPhoto = async (file: File) => {
    if (!userProfile) return;

    setUploading(true);
    setMessage(null);

    try {
      // Hapus foto lama jika ada
      if (userProfile.foto_profil) {
        try {
          const oldPath = userProfile.foto_profil.split('/storage/v1/object/public/profile-photos/')[1];
          if (oldPath) {
            await supabase.storage.from('profile-photos').remove([oldPath]);
          }
        } catch (err) {
          console.log('Old photo removal skipped:', err);
        }
      }

      // Upload foto baru
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userProfile.username}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error detail:', uploadError);
        throw new Error('Gagal upload: ' + (uploadError.message || JSON.stringify(uploadError)));
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update database
      const { error: updateError } = await supabase
        .from('users')
        .update({ foto_profil: publicUrl })
        .eq('username', userProfile.username);

      if (updateError) {
        console.error('Update error detail:', updateError);
        throw new Error('Gagal update database: ' + (updateError.message || JSON.stringify(updateError)));
      }

      // Update local state
      setUserProfile({ ...userProfile, foto_profil: publicUrl });
      setMessage({ type: 'success', text: 'Foto profil berhasil diupload!' });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Gagal mengupload foto' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!userProfile?.foto_profil) return;

    if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return;

    setUploading(true);
    setMessage(null);

    try {
      // Hapus dari storage
      const fileName = userProfile.foto_profil.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${userProfile.username}/${fileName}`]);
      }

      // Update database
      const { error } = await supabase
        .from('users')
        .update({ foto_profil: null })
        .eq('username', userProfile.username);

      if (error) throw error;

      // Update local state
      setUserProfile({ ...userProfile, foto_profil: undefined });
      setMessage({ type: 'success', text: 'Foto profil berhasil dihapus!' });
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      setMessage({ type: 'error', text: 'Gagal menghapus foto profil' });
    } finally {
      setUploading(false);
    }
  };

  const uploadCover = async (file: File) => {
    if (!userProfile) return;

    setUploading(true);
    setMessage(null);

    try {
      // Hapus cover lama jika ada
      if (userProfile.foto_sampul) {
        try {
          const oldPath = userProfile.foto_sampul.split('/storage/v1/object/public/profile-photos/')[1];
          if (oldPath) {
            await supabase.storage.from('profile-photos').remove([oldPath]);
          }
        } catch (err) {
          console.log('Old cover removal skipped:', err);
        }
      }

      // Upload cover baru
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${Date.now()}.${fileExt}`;
      const filePath = `${userProfile.username}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error detail:', uploadError);
        throw new Error('Gagal upload: ' + (uploadError.message || JSON.stringify(uploadError)));
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      console.log('Cover Public URL:', publicUrl);

      // Update database
      const { error: updateError } = await supabase
        .from('users')
        .update({ foto_sampul: publicUrl })
        .eq('username', userProfile.username);

      if (updateError) {
        console.error('Update error detail:', updateError);
        throw new Error('Gagal update database: ' + (updateError.message || JSON.stringify(updateError)));
      }

      // Update local state
      setUserProfile({ ...userProfile, foto_sampul: publicUrl });
      setMessage({ type: 'success', text: 'Foto sampul berhasil diupload!' });
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Gagal mengupload foto sampul' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCover = async () => {
    if (!userProfile?.foto_sampul) return;

    if (!confirm('Apakah Anda yakin ingin menghapus foto sampul?')) return;

    setUploading(true);
    setMessage(null);

    try {
      // Hapus dari storage
      const fileName = userProfile.foto_sampul.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${userProfile.username}/${fileName}`]);
      }

      // Update database
      const { error } = await supabase
        .from('users')
        .update({ foto_sampul: null })
        .eq('username', userProfile.username);

      if (error) throw error;

      // Update local state
      setUserProfile({ ...userProfile, foto_sampul: undefined });
      setMessage({ type: 'success', text: 'Foto sampul berhasil dihapus!' });
    } catch (error: any) {
      console.error('Error deleting cover:', error);
      setMessage({ type: 'error', text: 'Gagal menghapus foto sampul' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat profil...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profil Saya
            </h1>
            <p className="text-gray-600 mt-2">Informasi data diri Anda</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            } flex items-center space-x-2`}>
              <span>{message.type === 'success' ? '✅' : '❌'}</span>
              <span>{message.text}</span>
            </div>
          )}

          {userProfile ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Profile Header with Cover Photo */}
              <div className="relative">
                {/* Cover Photo */}
                <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
                  {userProfile.foto_sampul ? (
                    <img 
                      src={userProfile.foto_sampul} 
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                  )}
                  
                  {/* Cover Photo Action Buttons */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    {/* Upload Cover Button */}
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 text-blue-600 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      title="Upload foto sampul"
                    >
                      <span className="text-lg">🖼️</span>
                      <span className="text-sm font-medium">Sampul</span>
                    </button>

                    {/* Delete Cover Button */}
                    {userProfile.foto_sampul && (
                      <button
                        onClick={handleDeleteCover}
                        disabled={uploading}
                        className="bg-white bg-opacity-90 hover:bg-red-50 text-red-600 p-2 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Hapus foto sampul"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Photo - Overlap di tengah cover */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 z-10">
                  <div className="relative">
                    {/* Profile Photo */}
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden border-4 border-white">
                      {userProfile.foto_profil ? (
                        <img 
                          src={userProfile.foto_profil} 
                          alt={userProfile.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {userProfile.nama.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                  {/* Photo Action Buttons */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {/* Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-white hover:bg-gray-100 text-blue-600 p-2 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Upload foto"
                    >
                      {uploading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      ) : (
                        <span className="text-xl">📷</span>
                      )}
                    </button>

                    {/* Delete Button */}
                    {userProfile.foto_profil && (
                      <button
                        onClick={handleDeletePhoto}
                        disabled={uploading}
                        className="bg-white hover:bg-red-50 text-red-600 p-2 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Hapus foto"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    )}
                  </div>

                  {/* Hidden File Inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'profile')}
                    className="hidden"
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'cover')}
                    className="hidden"
                  />
                  </div>
                </div>
              </div>

              {/* Profile Info - Below the cover section */}
              <div className="pt-20 pb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {userProfile.nama}
                </h2>
                <p className="text-gray-600">@{userProfile.username}</p>
              </div>

              {/* Profile Details */}
              <div className="p-8 space-y-6">
                {/* Username */}
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    Username
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👤</span>
                    <p className="text-lg text-gray-800">{userProfile.username}</p>
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    Nama Lengkap
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📝</span>
                    <p className="text-lg text-gray-800">{userProfile.nama}</p>
                  </div>
                </div>

                {/* Asal */}
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    Asal
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📍</span>
                    <p className="text-lg text-gray-800">{userProfile.asal}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="border-b border-gray-100 pb-4">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    Status
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {userProfile.status === 'pelajar' ? '🎓' : '👨‍💼'}
                    </span>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 capitalize">
                      {userProfile.status}
                    </span>
                  </div>
                </div>

                {/* Keterangan */}
                <div className="pb-4">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">
                    Keterangan
                  </label>
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">💬</span>
                    <p className="text-lg text-gray-800 flex-1">
                      {userProfile.keterangan || 'Tidak ada keterangan'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <span>ℹ️</span>
                  <p>Untuk mengubah data profil, silakan hubungi admin</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-600">Data profil tidak ditemukan</p>
            </div>
          )}
        </div>

        {/* Modal Preview & Crop Photo */}
        {showModal && previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {uploadType === 'profile' ? 'Atur Foto Profil' : 'Atur Foto Sampul'}
                </h3>
                <p className="text-gray-600 text-sm">
                  Geser untuk memposisikan, scroll/pinch untuk zoom
                </p>
              </div>

              {/* Preview Image with Touch Controls */}
              <div className="flex flex-col items-center space-y-4">
                <div 
                  className={`${
                    uploadType === 'profile' 
                      ? 'w-72 h-72 rounded-full' 
                      : 'w-full h-48'
                  } overflow-hidden border-4 border-blue-500 shadow-xl relative bg-gray-100 touch-none`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="pointer-events-none select-none"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        maxWidth: 'none',
                        maxHeight: 'none',
                        width: uploadType === 'cover' ? '100%' : 'auto',
                        height: uploadType === 'profile' ? '100%' : 'auto'
                      }}
                      draggable={false}
                    />
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-4 bg-gray-50 rounded-xl px-6 py-3">
                  <button
                    onClick={() => setZoom(prev => Math.max(prev - 0.2, 1))}
                    className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow flex items-center justify-center text-xl font-bold text-gray-700 transition-all"
                  >
                    −
                  </button>
                  <div className="flex items-center space-x-2 min-w-[80px] justify-center">
                    <span className="text-2xl">🔍</span>
                    <span className="text-sm font-semibold text-gray-700">{(zoom * 100).toFixed(0)}%</span>
                  </div>
                  <button
                    onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
                    className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow flex items-center justify-center text-xl font-bold text-gray-700 transition-all"
                  >
                    +
                  </button>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  🔄 Reset Posisi
                </button>
              </div>

              {/* File Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ukuran file:</span>
                  <span className="font-medium text-gray-800">
                    {selectedFile ? (selectedFile.size / 1024).toFixed(2) + ' KB' : ''}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelUpload}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Simpan Foto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
