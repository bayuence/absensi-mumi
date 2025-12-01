-- ============================================
-- SQL untuk Menambahkan Kolom Izin ke Tabel Absensi
-- ============================================
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom keterangan (untuk alasan izin)
ALTER TABLE absensi 
ADD COLUMN IF NOT EXISTS keterangan TEXT;

-- 2. Tambah kolom foto_izin (untuk URL foto bukti izin)
ALTER TABLE absensi 
ADD COLUMN IF NOT EXISTS foto_izin TEXT;

-- 3. Tambah kolom created_at (untuk timestamp)
ALTER TABLE absensi 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 4. Update existing records to have created_at
UPDATE absensi 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- ============================================
-- Verifikasi Kolom Sudah Ditambahkan
-- ============================================

-- Cek struktur tabel absensi
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'absensi'
ORDER BY ordinal_position;

-- Expected output harus include:
-- column_name    | data_type | is_nullable
-- ---------------+-----------+-------------
-- id             | bigint    | NO
-- username       | text      | YES
-- nama           | text      | YES
-- tanggal        | date      | YES
-- status         | text      | YES
-- foto_profil    | text      | YES
-- keterangan     | text      | YES  <-- NEW
-- foto_izin      | text      | YES  <-- NEW
-- created_at     | timestamp | YES

-- ============================================
-- Test Insert Data Izin
-- ============================================

-- Test insert izin (opsional, untuk testing)
-- INSERT INTO absensi (
--   username, 
--   nama, 
--   tanggal, 
--   status, 
--   keterangan, 
--   foto_izin,
--   foto_profil
-- ) VALUES (
--   'testuser',
--   'TEST USER',
--   CURRENT_DATE,
--   'IZIN',
--   'Sakit demam',
--   'https://example.com/photo.jpg',
--   'https://example.com/profile.jpg'
-- );

-- ============================================
-- Selesai!
-- ============================================
-- Setelah menjalankan SQL ini:
-- 1. Kolom keterangan sudah ada ✅
-- 2. Kolom foto_izin sudah ada ✅
-- 3. Aplikasi izin akan berfungsi ✅
-- ============================================
