    'use client';

    import { useState } from 'react';
    import { createClient } from '@supabase/supabase-js';
    import { useRouter } from 'next/navigation';

    // Gunakan environment variables
    const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    type ViewMode = 'login' | 'register';

    export default function LoginPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('login');
    
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
            setError('Username sudah digunakan');
            setLoading(false);
            return;
        }

        // Buat user baru dengan data lengkap sesuai tabel users
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
            {
                username: registerData.username.trim(),
                password: registerData.password.trim(),
                nama: registerData.nama.trim(),
                asal: registerData.asal.trim(),
                status: registerData.status,
                keterangan: registerData.keterangan.trim()
            }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            setError('Gagal mendaftar: ' + insertError.message);
            setLoading(false);
            return;
        }

        setSuccess('Pendaftaran berhasil! Mengarahkan ke dashboard...');
        console.log('User berhasil didaftarkan:', newUser);
        
        // Simpan data user lengkap ke localStorage (is_admin default false dari database)
        localStorage.setItem('loggedUser', newUser.username);
        localStorage.setItem('user', JSON.stringify(newUser));
        
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
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-gray-200">
                <img 
                src="/logo-ldii.png" 
                alt="Logo LDII" 
                className="w-16 h-16 object-contain"
                />
            </div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MUMI BP Kulon
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                {viewMode === 'login' 
                ? 'Masuk ke Sistem Absensi Digital' 
                : 'Lengkapi data untuk mendaftar'
                }
            </p>
            </div>
            
            {/* Form Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {viewMode === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                    <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                    </label>
                    <input
                        id="username"
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
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <input
                        id="password"
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
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                    {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses...
                    </>
                    ) : (
                    'Masuk'
                    )}
                </button>
                </form>
            ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegister} className="space-y-6">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Registrasi Akun Baru</h3>
                    <p className="text-sm text-gray-600">Lengkapi semua data di bawah ini</p>
                </div>

                <div className="space-y-4">
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
                        placeholder="Username unik"
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
            </div>

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
        </div>
    );
    }