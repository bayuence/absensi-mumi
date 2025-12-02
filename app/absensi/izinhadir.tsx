"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import moment from "moment-timezone";

// Set timezone to Jakarta
moment.tz.setDefault("Asia/Jakarta");
moment.locale("id");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface IzinHadirProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function IzinHadir({ onClose, onSuccess }: IzinHadirProps) {
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Safari-friendly constraints dengan resolusi lebih kecil untuk performa
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 960 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      setFacingMode(mode);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        
        // Wait for metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.log("Play error:", err);
          });
        };
      }
      setIsCameraOpen(true);
    } catch (error: any) {
      console.error("Camera error:", error);
      let errorMsg = "Gagal membuka kamera. ";
      if (error.name === 'NotAllowedError') {
        errorMsg += "Izin kamera ditolak. Mohon berikan izin akses kamera.";
      } else if (error.name === 'NotFoundError') {
        errorMsg += "Kamera tidak ditemukan.";
      } else if (error.name === 'NotReadableError') {
        errorMsg += "Kamera sedang digunakan aplikasi lain.";
      } else {
        errorMsg += "Pastikan Anda memberikan izin akses kamera.";
      }
      alert(errorMsg);
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    openCamera(newMode);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // Resize untuk mencapai target 100KB (mulai dengan max 600px width)
      let targetWidth = videoWidth;
      let targetHeight = videoHeight;
      
      // Resize bertahap untuk kualitas optimal
      if (targetWidth > 600) {
        const ratio = 600 / targetWidth;
        targetWidth = 600;
        targetHeight = videoHeight * ratio;
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw dengan smoothing untuk kualitas lebih baik
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
        
        // Compress bertahap sampai mencapai ~100KB
        let quality = 0.8;
        let imageData = canvas.toDataURL("image/jpeg", quality);
        
        // Iterasi untuk mencapai ukuran mendekati 100KB
        while (imageData.length > 137000 && quality > 0.3) { // 137000 ≈ 100KB base64
          quality -= 0.05;
          imageData = canvas.toDataURL("image/jpeg", quality);
        }
        
        console.log("Compressed image size:", Math.round(imageData.length * 0.75 / 1024), "KB, quality:", quality.toFixed(2));
        
        setCapturedImage(imageData);
        closeCamera();
      }
    } else {
      alert("Video belum siap. Tunggu sebentar dan coba lagi.");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    openCamera();
  };

  const handleSubmit = async () => {
    if (!alasan.trim()) {
      alert("Mohon isi alasan izin!");
      return;
    }

    if (!capturedImage) {
      alert("Mohon ambil foto terlebih dahulu!");
      return;
    }

    setLoading(true);

    try {
      const logged = localStorage.getItem("loggedUser");
      if (!logged) {
        alert("Silakan login terlebih dahulu!");
        setLoading(false);
        return;
      }

      // Get user data from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", logged)
        .single();

      if (userError || !userData) {
        console.error("User fetch error:", userError);
        alert("Gagal mengambil data user!");
        setLoading(false);
        return;
      }

      const today = moment().format("YYYY-MM-DD");

      // ========== AMBIL KODE ABSENSI DARI JADWAL ==========
      // (Validasi jadwal sudah dilakukan sebelum modal dibuka)
      const { data: jadwalData, error: jadwalError } = await supabase
        .from("jadwal_guru")
        .select("*")
        .eq("tanggal", today)
        .eq("guru", userData.nama)
        .maybeSingle();

      if (jadwalError || !jadwalData) {
        console.error("Jadwal fetch error:", jadwalError);
        alert("Gagal mengambil data jadwal. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      // Ambil kode absensi dari jadwal
      const kodeAbsensi = jadwalData.kode_absensi;
      console.log("Kode absensi dari jadwal:", kodeAbsensi);

      // Check if user already submitted attendance today
      const { data: existingData } = await supabase
        .from("absensi")
        .select("*")
        .eq("username", userData.username)
        .eq("tanggal", today)
        .maybeSingle();

      if (existingData) {
        alert("Anda sudah melakukan presensi/izin hari ini!");
        setLoading(false);
        return;
      }

      // Convert base64 to blob dengan error handling
      let blob: Blob;
      try {
        const base64Response = await fetch(capturedImage);
        blob = await base64Response.blob();
        
        console.log("Blob size:", Math.round(blob.size / 1024), "KB");
        
        // Validate blob size (max 2MB untuk safety)
        if (blob.size > 2 * 1024 * 1024) {
          throw new Error("Ukuran foto terlalu besar. Maksimal 2MB.");
        }
      } catch (blobError) {
        console.error("Blob conversion error:", blobError);
        alert("Gagal memproses foto. Silakan coba ambil foto ulang.");
        setLoading(false);
        return;
      }
      
      // Upload foto to Supabase Storage
      const fileName = `izin_${userData.username}_${today}_${Date.now()}.jpg`;
      
      console.log("Uploading file:", fileName, "Size:", blob.size);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("izin_photos")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`Upload gagal: ${uploadError.message}. Pastikan storage bucket 'izin_photos' sudah dibuat dan public.`);
        setLoading(false);
        return;
      }

      console.log("Upload success:", uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("izin_photos")
        .getPublicUrl(fileName);

      console.log("Public URL:", publicUrl);

      // Insert izin data to absensi table dengan KODE ABSENSI dari jadwal
      console.log("Inserting to absensi table...");
      
      const insertData = {
        nama: userData.nama,
        username: userData.username,
        tanggal: today,
        status: "IZIN",
        kode_absensi: kodeAbsensi, // Kode dari jadwal_guru
        foto_profil: userData.foto_profil || null,
        keterangan: alasan.trim(),
        foto_izin: publicUrl,
        created_at: moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
      };

      console.log("Insert data:", insertData);

      const { data: insertResult, error: insertError } = await supabase
        .from("absensi")
        .insert(insertData)
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        
        // Cleanup uploaded file if insert fails
        await supabase.storage
          .from("izin_photos")
          .remove([fileName]);
        
        alert(`Insert gagal: ${insertError.message}. Pastikan tabel 'absensi' memiliki kolom 'keterangan' dan 'foto_izin'.`);
        setLoading(false);
        return;
      }

      console.log("Insert success!", insertResult);

      alert(`✅ Izin tidak hadir berhasil dicatat!\nKode Absensi: ${kodeAbsensi}\n\n⚠️ Foto hanya dapat dilihat oleh admin.\n\n⚠️ PENTING: Jika admin menghapus foto izin Anda, status akan berubah menjadi TIDAK HADIR.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Full error:", error);
      alert("❌ Gagal mencatat izin: " + (error?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Izin Tidak Hadir</h2>
            <p className="text-sm text-slate-600">Foto & alasan wajib diisi</p>
          </div>
        </div>

        {/* Camera Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Foto Diri <span className="text-red-500">*</span>
          </label>
          
          {!isCameraOpen && !capturedImage && (
            <button
              onClick={() => openCamera()}
              className="w-full py-4 px-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              <span className="text-4xl">📷</span>
              <span className="text-slate-600 font-medium">Buka Kamera</span>
            </button>
          )}

          {isCameraOpen && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '3/4' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Switch Camera Button */}
                <button
                  onClick={switchCamera}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-lg transition-all shadow-lg"
                  title="Ganti Kamera"
                >
                  <span className="text-xl">🔄</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>📸</span>
                  <span>Ambil Foto</span>
                </button>
                <button
                  onClick={closeCamera}
                  className="px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-all active:scale-95"
                >
                  ❌
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border-2 border-green-300" style={{ aspectRatio: '3/4' }}>
                <img 
                  src={capturedImage} 
                  alt="Foto Izin" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  ✓ Foto Diambil
                </div>
              </div>
              <button
                onClick={retakePhoto}
                className="w-full py-2 px-4 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>🔄</span>
                <span>Ambil Ulang</span>
              </button>
            </div>
          )}
        </div>

        {/* Alasan Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Alasan Izin <span className="text-red-500">*</span>
          </label>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={4}
            className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all resize-none"
            placeholder="Contoh: Sakit, keperluan keluarga, dsb..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !capturedImage || !alasan.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Kirim Izin</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              closeCamera();
              onClose();
            }}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <span>❌</span>
            <span>Batal</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-400 text-lg flex-shrink-0">ℹ️</div>
            <div>
              <p className="text-blue-700 text-xs">
                • Foto wajib diambil langsung menggunakan kamera<br/>
                • Klik 🔄 untuk ganti kamera depan/belakang<br/>
                • Foto otomatis dioptimasi ~100KB untuk hemat data<br/>
                • Alasan izin wajib diisi dengan jelas<br/>
                • <strong>Foto hanya dapat dilihat oleh admin</strong><br/>
                • Untuk Safari/iOS: Izinkan akses kamera di pengaturan browser
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
