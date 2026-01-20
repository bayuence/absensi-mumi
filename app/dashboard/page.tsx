"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import ProfileModal from "./ProfileModal";
import moment from "moment";
import "moment/locale/id";



export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
    const [nextSchedule, setNextSchedule] = useState<any[]>([]);
    const [pengumuman, setPengumuman] = useState<any>(null);
    const [materiTerakhir, setMateriTerakhir] = useState<any>(null);
    const [userList, setUserList] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    const today = moment().format("YYYY-MM-DD");

    // Handler untuk subscribe push notification (langsung pakai browser native prompt)
    const subscribeNotification = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const username = localStorage.getItem('loggedUser');
                if (!username) return;

                // Cek apakah sudah pernah subscribe
                const reg = await navigator.serviceWorker.ready;
                let subObj = await reg.pushManager.getSubscription();

                // Jika belum ada subscription, browser akan otomatis minta izin
                if (!subObj) {
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
                        // Ini akan memunculkan prompt native dari browser
                        subObj = await reg.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey
                        });
                        localStorage.setItem('pushSubscription', JSON.stringify(subObj));
                    }
                }

                // Kirim ke server
                if (subObj && subObj.endpoint) {
                    const deviceInfo = navigator.userAgent;
                    const keys = subObj.toJSON().keys;
                    await fetch('/api/push-subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            endpoint: subObj.endpoint,
                            keys,
                            username,
                            device_info: deviceInfo
                        })
                    });
                    console.log('✅ Device berhasil didaftarkan untuk notifikasi');
                }
            } catch (e) {
                console.log('Push notification setup:', e);
            }
        }
    };

    useEffect(() => {

        // Cek login, jika tidak ada, redirect ke login
        if (typeof window !== 'undefined') {
            const username = localStorage.getItem('loggedUser');
            if (!username) {
                window.location.href = '/login';
                return;
            }
        }

        const fetchData = async () => {
            try {
                // Ambil user login dengan pengecekan aman
                let username = null;
                if (typeof window !== 'undefined') {
                    try {
                        username = localStorage.getItem("loggedUser");
                    } catch (e) {
                        setError("❌ Gagal membaca data login dari perangkat.");
                        return;
                    }
                }
                if (!username || typeof username !== "string" || username.trim() === "") {
                    setError("❌ Pengguna belum login.");
                    return;
                }

                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("*")
                    .eq("username", username.trim())
                    .single();

                if (userError || !userData) {
                    setError("❌ Gagal memuat data pengguna.");
                    return;
                }
                setUser(userData);

                // Ambil semua user
                const { data: allUsers } = await supabase.from("users").select("*");
                setUserList(allUsers || []);

                // Ambil jadwal hari ini
                const { data: todayData } = await supabase
                    .from("jadwal_guru")
                    .select("*")
                    .eq("tanggal", today);
                setTodaySchedule(todayData || []);

                // Ambil jadwal setelah hari ini
                const { data: nextData } = await supabase
                    .from("jadwal_guru")
                    .select("*")
                    .gt("tanggal", today)
                    .order("tanggal", { ascending: true })
                    .limit(1);
                setNextSchedule(nextData || []);

                // Ambil pengumuman terbaru
                const { data: pengumumanData, error: pengumumanError } = await supabase
                    .from("pengumuman")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(1);
                if (!pengumumanError && pengumumanData && pengumumanData.length > 0) {
                    setPengumuman(pengumumanData[0]);
                } else {
                    setPengumuman(null);
                }

                // Ambil materi terakhir
                const { data: materiData, error: materiError } = await supabase
                    .from("materi")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(1);
                if (!materiError && materiData && materiData.length > 0) {
                    setMateriTerakhir(materiData[0]);
                } else {
                    setMateriTerakhir(null);
                }

            } catch (err) {
                console.error("Gagal mengambil data:", err);
                setError("❌ Terjadi kesalahan saat memuat data.");
            }
        };

        fetchData();

        // Auto subscribe notification (hanya muncul prompt native dari browser)
        // Delay sedikit agar user sempat melihat dashboard dulu
        const notifTimeout = setTimeout(() => {
            subscribeNotification();
        }, 2000);

        return () => clearTimeout(notifTimeout);
    }, []);



    const sortedUsers = [...userList].sort((a, b) =>
        a.nama.localeCompare(b.nama)
    );

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Welcome */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
                        <div className="relative">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-200">
                                    <img
                                        src="/logo-ldii.png"
                                        alt="Logo LDII"
                                        className="w-10 h-10 object-contain"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Selamat Datang di MUMI BP Kulon
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {moment().locale('id').format('dddd, DD MMMM YYYY')}
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                                Website untuk pengajian MUMI BP Kulon. Kami pengurus akan
                                lebih mudah mengontrol kehadiran. Semoga ngajinya tertib dan selalu
                                bersemangat, tidak bolos! 💪
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 text-sm">⚠️</span>
                            </div>
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Main Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Materi Terakhir */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="text-white text-xl">📘</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Materi Terakhir</h2>
                                </div>
                            </div>
                            <div className="p-6">
                                {materiTerakhir ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                            <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">📅</span>
                                            <span>{materiTerakhir.tanggal}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">👤</span>
                                            <span className="font-medium">
                                                Guru: {Array.isArray(materiTerakhir.guru)
                                                    ? materiTerakhir.guru.join(", ")
                                                    : materiTerakhir.guru}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-gray-800 leading-relaxed">{materiTerakhir.isi}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-gray-400 text-2xl">📚</span>
                                        </div>
                                        <p className="text-gray-500">Belum ada materi terbaru</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Jadwal */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="text-white text-xl">📅</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Jadwal Pengajian</h2>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Jadwal Hari Ini */}
                                <div>
                                    <h3 className="font-semibold text-purple-700 mb-3 flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        <span>Hari Ini</span>
                                    </h3>
                                    {todaySchedule.length === 0 ? (
                                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                                            <p className="text-gray-500 text-sm">Belum ada jadwal untuk hari ini</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {todaySchedule.map((item: any) => (
                                                <div key={item.id} className="bg-purple-50 rounded-lg p-3 flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <span className="text-purple-600 text-sm">👤</span>
                                                    </div>
                                                    <span className="text-purple-800 font-medium">{item.guru}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Jadwal Selanjutnya */}
                                <div>
                                    <h3 className="font-semibold text-indigo-700 mb-3 flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                        <span>Jadwal Selanjutnya</span>
                                    </h3>
                                    {nextSchedule.length === 0 ? (
                                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                                            <p className="text-gray-500 text-sm">Belum ada jadwal berikutnya</p>
                                        </div>
                                    ) : (
                                        <div className="bg-indigo-50 rounded-lg p-4">
                                            <p className="text-sm text-indigo-600 mb-2">{nextSchedule[0].tanggal}</p>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 text-sm">👤</span>
                                                </div>
                                                <span className="text-indigo-800 font-medium">{nextSchedule[0].guru}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pengumuman */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8 hover:shadow-xl transition-all duration-300">
                        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-white text-xl">📢</span>
                                </div>
                                <h2 className="text-xl font-bold text-white">Pengumuman</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            {pengumuman ? (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">📅</span>
                                        <span>{pengumuman.tanggal}</span>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-4 border-l-4 border-rose-400">
                                        <p className="text-gray-800 leading-relaxed">{pengumuman.isi}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-gray-400 text-2xl">📢</span>
                                    </div>
                                    <p className="text-gray-500">Belum ada pengumuman terbaru</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Daftar Anggota */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="text-white text-xl">👥</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Daftar Anggota</h2>
                                </div>
                                <div className="bg-white/20 rounded-lg px-3 py-1">
                                    <span className="text-white text-sm font-medium">{sortedUsers.length} Anggota</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedUsers.map((u, index: number) => (
                                    <div
                                        key={u.username}
                                        onClick={() => {
                                            setSelectedUser(u);
                                            setShowModal(true);
                                        }}
                                        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {u.foto_profil ? (
                                                    <img
                                                        src={u.foto_profil}
                                                        alt={u.nama}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-white font-bold text-sm">
                                                        {u.nama.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{u.nama}</h3>
                                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                                    <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                                        <span className="text-green-600 text-xs">📍</span>
                                                    </span>
                                                    {u.asal}
                                                </p>
                                                <div className="flex items-center mt-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${u.status === 'aktif'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {u.status}
                                                    </span>
                                                    {u.keterangan && (
                                                        <span className="ml-2 text-xs text-gray-500 truncate">
                                                            {u.keterangan}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Beautiful Footer */}
            <footer className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-400/20 via-transparent to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8">
                        {/* Logo dan Title */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-gray-200">
                                <img
                                    src="/logo-ldii.png"
                                    alt="Logo LDII"
                                    className="w-14 h-14 object-contain"
                                />
                            </div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                MUMI BP Kulon
                            </h3>
                        </div>

                        {/* Doa dan Harapan */}
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                                <div className="flex items-center justify-center space-x-3 mb-6">
                                    <span className="text-2xl">🤲</span>
                                    <h4 className="text-xl font-semibold text-purple-200">Doa & Harapan</h4>
                                    <span className="text-2xl">🤲</span>
                                </div>
                                <p className="text-gray-300 leading-relaxed text-lg italic">
                                    "Semoga platform digital ini menjadi wasilah yang baik dalam mempererat ukhuwah dan
                                    meningkatkan semangat menuntut ilmu para jamaah Muda-Mudi BP Kulon. Barokallahu fiikum,
                                    semoga setiap langkah dalam mencari ilmu menjadi ladang pahala dan amal jariyah yang
                                    mengalir terus menerus hingga akhirat.
                                    Demikian atas perhatian dan kerjasamanya kami syukuri.

                                    اَلْحَمْدُ لِلّٰـهِ جَزَّا كُمُ اللّٰــہ خَيْـــــــرًا



                                    "
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                                    <div className="text-center">
                                        <span className="text-3xl mb-3 block">📚</span>
                                        <h5 className="font-semibold text-blue-200 mb-2">Ilmu Bermanfaat</h5>
                                        <p className="text-sm text-gray-400">Semoga menjadi sarana pembelajaran yang barokah</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                                    <div className="text-center">
                                        <span className="text-3xl mb-3 block">🤝</span>
                                        <h5 className="font-semibold text-purple-200 mb-2">Ukhuwah Islamiyah</h5>
                                        <p className="text-sm text-gray-400">Mempererat tali persaudaraan sesama jamaah</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                                    <div className="text-center">
                                        <span className="text-3xl mb-3 block">⭐</span>
                                        <h5 className="font-semibold text-green-200 mb-2">Amal Jariyah</h5>
                                        <p className="text-sm text-gray-400">Pahala yang terus mengalir tanpa henti</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Developer Credit */}
                        <div className="border-t border-white/10 pt-8">
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10">
                                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-white font-bold text-lg">B</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-semibold">Dikembangkan oleh</p>
                                            <p className="text-blue-300 font-bold text-lg">bayuence</p>
                                        </div>
                                    </div>
                                    <div className="h-12 w-px bg-white/20 hidden sm:block"></div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-sm text-gray-300">Modern • Interactive • Responsive</p>
                                        <p className="text-xs text-gray-400 mt-1">Built with Next.js & Tailwind CSS</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Copyright */}
                        <div className="pt-6 border-t border-white/10">
                            <p className="text-gray-400 text-sm">
                                © 2025 MUMI BP Kulon. Dibuat dengan penuh keikhlasan untuk kemajuan umat.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Profile Modal */}
            {showModal && selectedUser && (
                <ProfileModal
                    user={selectedUser}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
