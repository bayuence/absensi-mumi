-- =============================================
-- AUTOMATIC RECORD: TIDAK HADIR
-- Untuk guru yang tidak input kode & tidak izin
-- Setelah lewat 24 jam (tanggal berganti)
-- =============================================

-- Function untuk auto record TIDAK HADIR
CREATE OR REPLACE FUNCTION auto_record_tidak_hadir()
RETURNS void AS $$
DECLARE
  jadwal_record RECORD;
  guru_username VARCHAR;
  existing_record RECORD;
BEGIN
  -- Loop semua jadwal yang sudah lewat (tanggal < hari ini)
  FOR jadwal_record IN 
    SELECT DISTINCT tanggal, kode_absensi, guru
    FROM jadwal_guru
    WHERE tanggal < CURRENT_DATE
  LOOP
    -- Cari username guru dari nama
    SELECT username INTO guru_username
    FROM users
    WHERE nama = jadwal_record.guru
    LIMIT 1;
    
    -- Skip jika user tidak ditemukan
    IF guru_username IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Cek apakah sudah ada record absensi untuk guru ini di tanggal tersebut
    SELECT * INTO existing_record
    FROM absensi
    WHERE username = guru_username
      AND tanggal = jadwal_record.tanggal
    LIMIT 1;
    
    -- Jika belum ada record sama sekali, buat record TIDAK_HADIR
    IF existing_record IS NULL THEN
      INSERT INTO absensi (
        username,
        nama,
        tanggal,
        status,
        kode_absensi,
        foto_profil,
        keterangan,
        created_at
      )
      SELECT 
        u.username,
        u.nama,
        jadwal_record.tanggal,
        'TIDAK_HADIR',
        jadwal_record.kode_absensi,
        u.foto_profil,
        'Tidak input kode absensi dan tidak izin - Auto recorded setelah 24 jam',
        NOW()
      FROM users u
      WHERE u.username = guru_username;
      
      RAISE NOTICE 'Created TIDAK_HADIR record for % on %', guru_username, jadwal_record.tanggal;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Auto record TIDAK_HADIR completed';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CARA 1: PANGGIL MANUAL (untuk testing)
-- =============================================
-- SELECT auto_record_tidak_hadir();

-- =============================================
-- CARA 2: SCHEDULE dengan pg_cron (OTOMATIS)
-- Jalan setiap hari jam 00:30 (30 menit setelah tengah malam)
-- =============================================

-- Install pg_cron extension (jika belum)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Hapus cron job lama jika ada (dengan handling error)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-record-tidak-hadir');
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'Job not found, skipping unschedule';
END $$;

-- Buat cron job baru - jalan setiap hari jam 00:30
SELECT cron.schedule(
  'auto-record-tidak-hadir',           -- nama job
  '30 0 * * *',                         -- setiap hari jam 00:30 (cron format)
  'SELECT auto_record_tidak_hadir();'   -- query yang dijalankan
);

-- =============================================
-- VERIFIKASI CRON JOB
-- =============================================
-- Cek apakah cron job sudah terdaftar:
-- SELECT * FROM cron.job;

-- Cek history eksekusi cron:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- =============================================
-- CARA PENGGUNAAN:
-- =============================================
-- 1. Copy semua kode SQL di atas
-- 2. Buka Supabase Dashboard -> SQL Editor
-- 3. Paste dan Run query ini
-- 4. Sistem akan otomatis jalan setiap hari jam 00:30
-- 5. Semua guru yang tidak input kode & tidak izin
--    akan otomatis dicatat sebagai TIDAK_HADIR
--
-- TESTING MANUAL:
-- SELECT auto_record_tidak_hadir();
--
-- CEK HASIL:
-- SELECT * FROM absensi WHERE status = 'TIDAK_HADIR' 
-- AND keterangan LIKE '%Auto recorded%';
-- =============================================

-- =============================================
-- ALTERNATIF: Jika pg_cron tidak tersedia
-- =============================================
-- Gunakan Supabase Edge Functions atau panggil
-- dari aplikasi Next.js dengan API route yang
-- dijadwalkan via Vercel Cron atau external cron service
-- =============================================
