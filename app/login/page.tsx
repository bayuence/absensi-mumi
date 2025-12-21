    'use client';

    import { useState, useEffect } from 'react';
import supabase from "@/lib/supabaseClient";
    import { useRouter } from 'next/navigation';

    // Gunakan environment variables


    type ViewMode = 'login' | 'register';

    export default function LoginPage() {
        const router = useRouter();
        const [viewMode, setViewMode] = useState<ViewMode>('login');

        // Cek jika sudah login, langsung redirect ke dashboard
        useEffect(() => {
            if (typeof window !== 'undefined') {
                const loggedUser = localStorage.getItem('user');
                if (loggedUser) {
                    router.replace('/dashboard');
                }
            }
        }, [router]);
    
    // Form data untuk login
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });

    // Form data untuk registrasi lengkap sesuai tabel users
    const [registerData, setRegisterData] = useState({
        username: '',
        password: '',
        nama: '',
        asal: '',
        status: 'pelajar', // default value
        keterangan: ''
    });

    // State untuk foto profil
    const [fotoProfil, setFotoProfil] = useState<File | null>(null);
    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [rawPreview, setRawPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({
        ...loginData,
        [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setRegisterData({
        ...registerData,
        [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    // Handle foto profil upload - Buka modal untuk crop
    const handleFotoProfilChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
        e.target.value = '';

        // Prevent multiple calls
        if (loading || showPhotoModal) return;

        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar');
            return;
        }

        // Create preview dan buka modal
        const reader = new FileReader();
        reader.onloadend = () => {
            setRawPreview(reader.result as string);
            setSelectedFile(file);
            setShowPhotoModal(true);
            if (error) setError('');
        };
        reader.readAsDataURL(file);
    };

    // Handle crop dan konfirmasi foto
    const handleConfirmPhoto = async () => {
        if (!selectedFile || !rawPreview || loading) return;

        setLoading(true);

        try {
            // Crop image sesuai preview
            const croppedBlob = await cropProfileImage();
            if (!croppedBlob) {
                setError('Gagal memproses foto');
                setLoading(false);
                return;
            }

            // Kompresi hasil crop
            const compressedBlob = await compressImage(croppedBlob);
            const compressedFile = new File([compressedBlob], selectedFile.name, { type: 'image/jpeg' });

            // Set foto final
            setFotoProfil(compressedFile);

            // Create preview untuk display
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewFoto(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);

            // Reset modal state
            setShowPhotoModal(false);
            setRawPreview(null);
            setSelectedFile(null);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        } catch (err) {
            console.error('Error processing photo:', err);
            setError('Gagal memproses foto');
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel modal
    const handleCancelPhoto = () => {
        setShowPhotoModal(false);
        setRawPreview(null);
        setSelectedFile(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
    };

    // Mouse/Touch handlers untuk drag
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

    // Crop image berdasarkan zoom dan position
    const cropProfileImage = (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const outputSize = 400; // 400x400 untuk foto profil
                const previewSize = 288; // w-72 (18rem = 288px)
                
                canvas.width = outputSize;
                canvas.height = outputSize;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    resolve(null);
                    return;
                }

                // Background putih
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, outputSize, outputSize);

                // Circular clip
                ctx.save();
                ctx.beginPath();
                ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                // Scale ratio dari preview ke output
                const ratio = outputSize / previewSize;

                // Hitung ukuran gambar di preview (fit by height untuk circular)
                const imgHeight = previewSize;
                const imgWidth = (img.width / img.height) * imgHeight;

                // Posisi center gambar
                const centerX = previewSize / 2;
                const centerY = previewSize / 2;

                // Transform canvas context
                ctx.translate(centerX * ratio, centerY * ratio);
                ctx.translate(position.x * ratio, position.y * ratio);
                ctx.scale(zoom, zoom);
                ctx.translate(-imgWidth / 2 * ratio, -imgHeight / 2 * ratio);

                // Draw image
                ctx.drawImage(img, 0, 0, imgWidth * ratio, imgHeight * ratio);
                
                ctx.restore();

                // Convert to blob
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.95);
            };
            img.src = rawPreview!;
        });
    };

    // Fungsi kompresi foto (target ~100KB)
    const compressImage = (input: File | Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    
                    // Gunakan ukuran asli jika sudah dikrop (400x400)
                    // Atau resize jika masih raw file
                    let width = img.width;
                    let height = img.height;
                    
                    // Jika ukuran besar, resize dulu
                    const maxSize = 800;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        } else {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Kompresi dengan quality adaptif (target ~100KB)
                    let quality = 0.8;
                    const compress = () => {
                        canvas.toBlob(
                            function(blob) {
                                if (!blob) {
                                    reject(new Error('Failed to compress image'));
                                    return;
                                }
                                
                                const targetSize = 100 * 1024; // 100KB
                                if (blob.size > targetSize && quality > 0.3) {
                                    quality -= 0.1;
                                    compress();
                                } else {
                                    console.log('Compressed size:', (blob.size / 1024).toFixed(2), 'KB');
                                    resolve(blob);
                                }
                            },
                            'image/jpeg',
                            quality
                        );
                    };
                    
                    compress();
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(input);
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
        console.log('=== LOGIN START ===');
        console.log('Username:', loginData.username);

        // Validasi input
        if (!loginData.username.trim() || !loginData.password.trim()) {
            setError('Username dan password tidak boleh kosong');
            setLoading(false);
            return;
        }

        // Cari user berdasarkan username
        console.log('Mencari user di database...');
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('username', loginData.username.trim())
            .single();

        console.log('User data:', userData);
        console.log('User error:', userError);

        if (userError) {
            if (userError.code === 'PGRST116') {
            // Username tidak ditemukan, alihkan ke form registrasi
            setError('');
            setSuccess('Username tidak ditemukan. Silakan lengkapi data registrasi di bawah ini.');
            
            // Set username yang sudah diketik ke form registrasi
            setRegisterData({
                ...registerData,
                username: loginData.username.trim()
            });
            
            // Pindah ke mode registrasi setelah delay
            setTimeout(() => {
                setViewMode('register');
                setSuccess('');
            }, 2000);
            } else {
            setError('Terjadi kesalahan: ' + userError.message);
            }
            setLoading(false);
            return;
        }

        // Verifikasi password
        if (userData && userData.password === loginData.password.trim()) {
            setSuccess('Login berhasil!');
            console.log('Login berhasil untuk:', userData.nama);

            // Simpan data user lengkap ke localStorage (termasuk is_admin)
            localStorage.setItem('loggedUser', userData.username);
            localStorage.setItem('user', JSON.stringify(userData));

            // === SIMPAN DATA SUBSCRIPTION DEVICE SAAT LOGIN (dengan username & device_info) ===
            try {
                const localSub = localStorage.getItem('pushSubscription');
                const username = userData.username;
                const deviceInfo = typeof navigator !== 'undefined' ? navigator.userAgent : '';
                if (localSub) {
                    const subObj = JSON.parse(localSub);
                    if (subObj && subObj.endpoint) {
                        fetch('/api/push-subscribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...subObj,
                                username,
                                device_info: deviceInfo
                            })
                        });
                    }
                }
            } catch (e) {
                // ignore error
            }

            // Redirect ke dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
            
        } else {
            setError('Password salah');
            console.log('Password tidak cocok');
        }

        } catch (err: any) {
        console.error('Error login:', err);
        setError('Terjadi kesalahan: ' + err.message);
        }

        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
        console.log('=== REGISTER START ===');
        
        // Validasi input wajib
        if (!registerData.username.trim() || !registerData.password.trim() || !registerData.nama.trim() || !registerData.asal.trim()) {
            setError('Username, password, nama, dan asal daerah wajib diisi');
            setLoading(false);
            return;
        }

        // Validasi foto profil WAJIB
        if (!fotoProfil) {
            setError('Foto profil wajib diupload');
            setLoading(false);
            return;
        }

        // Validasi keterangan berdasarkan status yang dipilih
        if (!registerData.keterangan.trim()) {
            setError(`Keterangan untuk ${registerData.status} wajib diisi (contoh: nama sekolah/universitas/tempat kerja)`);
            setLoading(false);
            return;
        }

        // Cek apakah username sudah ada (double check)
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', registerData.username.trim())
            .single();

        if (existingUser) {
            setError('Username sudah digunakan. Silakan pilih username lain.');
            setLoading(false);
            return;
        }

        // Upload foto profil ke Supabase Storage
        let fotoUrl = null;
        if (fotoProfil) {
            const fileExt = fotoProfil.name.split('.').pop();
            const fileName = `${Date.now()}-${registerData.username}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('foto-profil')
                .upload(fileName, fotoProfil);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                setError('Gagal upload foto profil: ' + uploadError.message);
                setLoading(false);
                return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('foto-profil')
                .getPublicUrl(fileName);
            fotoUrl = urlData.publicUrl;
        }

        // Insert user baru ke database
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                username: registerData.username.trim(),
                password: registerData.password.trim(),
                nama: registerData.nama.trim(),
                asal: registerData.asal.trim(),
                status: registerData.status,
                keterangan: registerData.keterangan.trim(),
                foto_profil: fotoUrl
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            setError('Gagal registrasi: ' + insertError.message);
            setLoading(false);
            return;
        }

        setSuccess('Registrasi berhasil! Selamat datang di sistem absensi MUMI.');
        console.log('Registrasi berhasil untuk:', newUser.nama);

        // Simpan data user ke localStorage
        localStorage.setItem('loggedUser', newUser.username);
        localStorage.setItem('user', JSON.stringify(newUser));

        // === OTOMATIS SUBSCRIBE & SINKRONISASI DEVICE SAAT REGISTRASI ===
        (async () => {
            try {
                let subObj = null;
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
                    const reg = await navigator.serviceWorker.ready;
                    subObj = await reg.pushManager.getSubscription();
                    if (!subObj) {
                        // Subscribe baru
                        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                        if (vapidPublicKey) {
                            const convertedVapidKey = (() => {
                                const padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
                                const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                                const rawData = window.atob(base64);
                                const outputArray = new Uint8Array(rawData.length);
                                for (let i = 0; i < rawData.length; ++i) {
                                    outputArray[i] = rawData.charCodeAt(i);
                                }
                                return outputArray;
                            })();
                            subObj = await reg.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: convertedVapidKey
                            });
                            localStorage.setItem('pushSubscription', JSON.stringify(subObj));
                        }
                    } else {
                        localStorage.setItem('pushSubscription', JSON.stringify(subObj));
                    }
                }
                // Kirim ke server jika sudah ada
                if (subObj && subObj.endpoint) {
                    const username = newUser.username;
                    const deviceInfo = typeof navigator !== 'undefined' ? navigator.userAgent : '';
                    const keys = subObj.toJSON().keys;
                    const res = await fetch('/api/push-subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            endpoint: subObj.endpoint,
                            keys,
                            username,
                            device_info: deviceInfo
                        })
                    });
                    if (res.ok) {
                        console.log('Device berhasil disimpan ke database push_subscriptions');
                    } else {
                        console.log('Gagal menyimpan device ke database push_subscriptions');
                    }
                }
            } catch (e) {
                console.log('Error sinkronisasi device:', e);
            }
        })();

        // Redirect ke dashboard
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);

        } catch (err: any) {
            console.error('Error register:', err);
            setError('Terjadi kesalahan: ' + err.message);
        }

        setLoading(false);
    };

    const backToLogin = () => {
        setViewMode('login');
        setError('');
        setSuccess('');
        // Reset form registrasi tapi pertahankan username
        const currentUsername = registerData.username;
        setRegisterData({
            username: currentUsername,
            password: '',
            nama: '',
            asal: '',
            status: 'pelajar',
            keterangan: ''
        });
        // Reset foto
        setFotoProfil(null);
        setPreviewFoto(null);
        setRawPreview(null);
        setSelectedFile(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };
    return (<>
<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8 px-2">
<div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
<h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
Selamat Datang di Absensi MUMI
</h2>
<p className="text-center text-gray-600 mb-6">Silakan login atau daftar untuk melanjutkan</p>
                    {/* Login Form */}
                    {viewMode === 'login' && (
                      <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                          <label htmlFor="login_username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="login_username"
                            name="username"
                            type="text"
                            required
                            className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                            placeholder="Masukkan username"
                            value={loginData.username}
                            onChange={handleLoginChange}
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label htmlFor="login_password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="login_password"
                            name="password"
                            type="password"
                            required
                            className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                            placeholder="Masukkan password"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Masuk...
                              </>
                            ) : (
                              'Masuk'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                    {/* Register Form */}
                    {viewMode === 'register' && (
                      <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                          <label htmlFor="reg_username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="reg_username"
                            name="username"
                            type="text"
                            required
                            className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                            placeholder="Masukkan username"
                            value={registerData.username}
                            onChange={handleRegisterChange}
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label htmlFor="reg_password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="reg_password"
                            name="password"
                            type="password"
                            required
                            className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                            placeholder="Masukkan password"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            disabled={loading}
                          />
                        </div>

                    <div>
                    <label htmlFor="reg_nama" className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="reg_nama"
                        name="nama"
                        type="text"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                        placeholder="Nama lengkap sesuai KTP"
                        value={registerData.nama}
                        onChange={handleRegisterChange}
                        disabled={loading}
                    />
                    </div>

                    <div>
                    <label htmlFor="reg_asal" className="block text-sm font-medium text-gray-700 mb-2">
                        Asal Daerah <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="reg_asal"
                        name="asal"
                        type="text"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                        placeholder="Contoh: BP Kulon, Gresik, Jawa Timur"
                        value={registerData.asal}
                        onChange={handleRegisterChange}
                        disabled={loading}
                    />
                    </div>

                    <div>
                    <label htmlFor="reg_status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="reg_status"
                        name="status"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                        value={registerData.status}
                        onChange={handleRegisterChange}
                        disabled={loading}
                    >
                        <option value="pelajar">Pelajar</option>
                        <option value="kuliah">Kuliah</option>
                        <option value="bekerja">Bekerja</option>
                    </select>
                    </div>

                    <div>
                    <label htmlFor="reg_keterangan" className="block text-sm font-medium text-gray-700 mb-2">
                        Keterangan <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="reg_keterangan"
                        name="keterangan"
                        type="text"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                        placeholder={
                        registerData.status === 'pelajar' ? 'Nama sekolah (SMA/SMK)' :
                        registerData.status === 'kuliah' ? 'Nama universitas & jurusan' :
                        'Nama perusahaan/tempat kerja'
                        }
                        value={registerData.keterangan}
                        onChange={handleRegisterChange}
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {registerData.status === 'pelajar' && 'Contoh: SMAN 1 Surabaya'}
                        {registerData.status === 'kuliah' && 'Contoh: UNAIR - Teknik Informatika'}
                        {registerData.status === 'bekerja' && 'Contoh: PT. ABC - Staff IT'}
                    </p>
                    </div>

                    {/* Upload Foto Profil - WAJIB */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto Profil <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                        {/* Preview Foto */}
                        {previewFoto && (
                        <div className="flex justify-center">
                            <div className="relative">
                            <img 
                                src={previewFoto} 
                                alt="Preview" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                setFotoProfil(null);
                                setPreviewFoto(null);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                                disabled={loading}
                            >
                                ✕
                            </button>
                            </div>
                        </div>
                        )}
                        
                        {/* Upload Button */}
                        <div className="flex flex-col items-center">
                        <label 
                            htmlFor="foto-profil-upload"
                            className={`cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all duration-200 ${
                            previewFoto 
                                ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex flex-col items-center space-y-2">
                            <span className="text-4xl">
                                {previewFoto ? '✅' : '📸'}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                                {previewFoto ? 'Ganti Foto' : 'Klik untuk upload foto'}
                            </span>
                            <span className="text-xs text-gray-500">
                                JPG, PNG, atau format gambar lainnya
                            </span>
                            </div>
                        </label>
                        <input
                            id="foto-profil-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFotoProfilChange}
                            className="hidden"
                            disabled={loading}
                        />
                        </div>

                        {/* Info Text */}
                        <p className="text-xs text-center text-gray-600">
                        {fotoProfil 
                            ? '✓ Foto siap diupload' 
                            : '⚠️ Foto profil wajib diupload sebelum mendaftar'
                        }
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                    >
                    {loading ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Mendaftar...
                        </>
                    ) : (
                        'Daftar & Masuk'
                    )}
                    </button>

                    <button
                    type="button"
                    onClick={backToLogin}
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                    Kembali ke Login
                    </button>
                </div>
                </form>
            )}

            {/* Error & Success Messages */}
            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                <span className="text-red-500">❌</span>
                <span className="text-sm">{error}</span>
                </div>
            )}

            {success && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-sm">{success}</span>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
                💡 Petunjuk:
            </h3>
            <div className="text-xs text-blue-700 space-y-1">
                {viewMode === 'login' ? (
                <>
                    <p><strong>Login:</strong> Masukkan username dan password yang sudah terdaftar</p>
                    <p><strong>Username Baru:</strong> Jika username tidak ditemukan, sistem akan beralih ke form registrasi</p>
                </>
                ) : (
                <>
                    <p><strong>Semua Field Wajib Diisi:</strong> Pastikan data terisi dengan benar</p>
                    <p><strong>Foto Profil WAJIB:</strong> Upload foto Anda untuk melengkapi registrasi</p>
                    <p><strong>Keterangan:</strong> Sesuaikan dengan status yang dipilih</p>
                    <p><strong>Setelah Daftar:</strong> Otomatis login dan masuk ke dashboard</p>
                </>
                )}
            </div>
            </div>

            {/* Footer */}
            <div className="text-center">
            <p className="text-xs text-gray-500">
                © 2025 MUMI BP Kulon. Sistem presensi. Product by ence
            </p>
            </div>
        </div>

        {/* Modal Preview & Crop Photo */}
        {showPhotoModal && rawPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Atur Foto Profil
                </h3>
                <p className="text-gray-600 text-sm">
                  Geser untuk memposisikan, scroll/pinch untuk zoom
                </p>
              </div>

              {/* Preview Image with Touch Controls */}
              <div className="flex flex-col items-center space-y-4">
                <div 
                  className="w-72 h-72 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl relative bg-gray-100 touch-none"
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
                      src={rawPreview} 
                      alt="Preview" 
                      className="pointer-events-none select-none"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        maxWidth: 'none',
                        maxHeight: 'none',
                        height: '100%',
                        width: 'auto'
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
                    type="button"
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
                    type="button"
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
                  type="button"
                >
                  🔄 Reset Posisi
                </button>
              </div>



              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelPhoto}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                  type="button"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmPhoto}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                  type="button"
                >
                  <span>✓</span>
                  <span>Gunakan Foto</span>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
    </>);
    }