-- Menambahkan kolom is_admin ke tabel users
-- Jalankan SQL ini di Supabase SQL Editor

-- 1. Tambah kolom is_admin (default false)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Set user pertama atau user tertentu sebagai admin
-- Ganti 'username_admin_pertama' dengan username yang ingin dijadikan admin
-- UPDATE users SET is_admin = true WHERE username = 'username_admin_pertama';

-- 3. Atau set berdasarkan ID
-- UPDATE users SET is_admin = true WHERE id = 1;

-- 4. Cek hasilnya
-- SELECT username, nama, is_admin FROM users;
