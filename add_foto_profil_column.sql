-- SQL untuk menambahkan kolom foto_profil ke tabel users
-- Jalankan query ini di Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN foto_profil TEXT;

-- Verifikasi kolom sudah ditambahkan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';
