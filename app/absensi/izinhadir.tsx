"use client";

import { useState, useRef } from "react";
import supabase from "@/lib/supabaseClient";
import moment from "moment-timezone";

// Set timezone to Jakarta
moment.tz.setDefault("Asia/Jakarta");
moment.locale("id");



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

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 1920 }
        } 
      });
      
      streamRef.current = stream;
      setFacingMode(mode);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.log("Auto-play prevented");
        }
      }
      setIsCameraOpen(true);
    } catch (error) {
      alert("Gagal membuka kamera. Pastikan Anda memberikan izin akses kamera.");
      console.error("Camera error:", error);
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
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
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
      const currentUser = localStorage.getItem("user");
      if (!currentUser) {
        alert("Silakan login terlebih dahulu!");
        setLoading(false);
        return;
      }

      const user = JSON.parse(currentUser);
      const today = new Date().toISOString().split("T")[0];

      // Check if user already submitted attendance today
      const { data: existingData } = await supabase
        .from("absensi")
        .select("*")
        .eq("username", user.username && user.username.trim())
        .eq("tanggal", today)
        .maybeSingle();

      if (existingData) {
        alert("Anda sudah melakukan presensi/izin hari ini!");
        setLoading(false);
        return;
      }

      // Convert base64 to blob
      const base64Response = await fetch(capturedImage);
      const blob = await base64Response.blob();
      
      // Upload foto to Supabase Storage
      const fileName = `izin_${user.username}_${today}_${Date.now()}.jpg`;
      
      console.log("Uploading file:", fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("izin_photos")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600"
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload gagal: ${uploadError.message}`);
      }

      console.log("Upload success:", uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("izin_photos")
        .getPublicUrl(fileName);

      console.log("Public URL:", publicUrl);

      // Insert izin data to absensi table
      console.log("Inserting to absensi table...");
      
      const { error: insertError } = await supabase.from("absensi").insert({
        nama: user.nama,
        username: user.username,
        tanggal: today,
        status: "IZIN",
        foto_profil: user.foto_profil || null,
        keterangan: alasan,
        foto_izin: publicUrl,
        created_at: moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Insert gagal: ${insertError.message}`);
      }

      console.log("Insert success!");

      alert("Izin tidak hadir berhasil dicatat!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Full error object:", error);
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error);
      alert("Gagal mencatat izin: " + errorMessage);
    }

    setLoading(false);
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
            <p className="text-sm text-slate-600">Ambil foto dan isi alasan izin</p>
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
                • Klik 🔄 di video untuk ganti kamera depan/belakang<br/>
                • Pastikan foto terlihat jelas<br/>
                • Alasan izin wajib diisi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
