# 📚 Panduan Sistem Admin Baru

## 🎯 Ringkasan Perubahan

Sistem admin telah diubah dari **hardcoded credentials** (username: admin, password: admin123) menjadi sistem yang **lebih fleksibel dan aman** menggunakan kolom `is_admin` di database.

## 🔄 Perubahan Utama

### ✅ Sebelum:
- Hanya user dengan username "admin" dan password "admin123" yang bisa akses menu admin
- Tidak fleksibel untuk menambah admin baru

### ✅ Sekarang:
- Setiap user bisa dijadikan admin melalui halaman **Kontrol Admin**
- Menu Admin muncul otomatis di Navbar ketika user login sebagai admin
- Lebih aman dan fleksibel

## 📋 Langkah-langkah Setup

### 1. Jalankan SQL Migration
Buka **Supabase Dashboard** → **SQL Editor**, lalu jalankan file:
```sql
-- File: add_is_admin_column.sql

-- 1. Tambah kolom is_admin (default false)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Set user pertama sebagai admin (GANTI USERNAME DI SINI!)
UPDATE users SET is_admin = true WHERE username = 'username_anda';

-- 3. Cek hasilnya
SELECT username, nama, is_admin FROM users;
```

**⚠️ PENTING:** Ganti `'username_anda'` dengan username yang ingin dijadikan admin pertama!

### 2. Verifikasi Perubahan
Setelah menjalankan SQL, cek di Supabase:
- Buka **Table Editor** → **users**
- Pastikan kolom `is_admin` sudah ada
- Pastikan minimal 1 user memiliki `is_admin = true`

### 3. Login Ulang
- Logout dari sistem
- Login kembali dengan user yang sudah dijadikan admin
- Menu **Admin** dan **Kontrol Admin** akan muncul di Navbar

## 🎮 Cara Menggunakan

### Mengakses Kontrol Admin
1. Login sebagai admin
2. Di Navbar, klik menu **👑 Kontrol Admin**
3. Anda akan melihat halaman untuk mengelola admin

### Menjadikan User Sebagai Admin
1. Di halaman Kontrol Admin, lihat daftar semua user
2. Gunakan **Search** untuk mencari user tertentu
3. Gunakan **Filter** untuk melihat admin/non-admin
4. Klik tombol **👑 Jadikan Admin** pada user yang ingin dijadikan admin
5. User tersebut akan langsung memiliki akses admin saat login berikutnya

### Mencabut Hak Admin
1. Di halaman Kontrol Admin, filter dengan "Admin"
2. Klik tombol **❌ Cabut Admin** pada user yang ingin dicabut hak adminnya
3. User tersebut akan kehilangan akses admin saat login berikutnya

## 📊 Statistik di Halaman Kontrol Admin

Dashboard menampilkan:
- **Total Pengguna**: Jumlah seluruh user terdaftar
- **Administrator**: Jumlah user dengan hak admin
- **User Biasa**: Jumlah user tanpa hak admin

## 🔒 Keamanan

### Proteksi Halaman Admin
Semua halaman admin sekarang dilindungi dengan pengecekan:
1. Apakah user sudah login?
2. Apakah user memiliki `is_admin = true`?

Jika tidak memenuhi, user akan diarahkan kembali ke dashboard.

### Halaman yang Diproteksi:
- ✅ `/admin` - Halaman admin utama
- ✅ `/admin/kontroladmin.tsx` - Halaman kontrol admin

## 💡 Tips Penting

### ⚠️ Peringatan
1. **Minimal 1 Admin**: Pastikan selalu ada minimal 1 user dengan status admin
2. **Hati-hati Mencabut Admin**: Jangan cabut hak admin dari semua user, atau tidak ada yang bisa mengakses sistem admin
3. **Logout & Login Ulang**: Perubahan status admin berlaku setelah user logout dan login kembali

### 🎯 Best Practices
- Berikan hak admin hanya kepada user yang dipercaya
- Gunakan fitur search dan filter untuk mengelola banyak user
- Cek statistik secara berkala untuk memastikan jumlah admin sesuai

## 🐛 Troubleshooting

### Menu Admin Tidak Muncul
**Penyebab:** User belum memiliki status `is_admin = true`
**Solusi:** 
1. Cek di Supabase apakah kolom `is_admin` sudah ada
2. Pastikan user memiliki nilai `is_admin = true`
3. Logout dan login ulang

### Tidak Bisa Akses Halaman Admin
**Penyebab:** User bukan admin atau belum login
**Solusi:**
1. Pastikan sudah login
2. Minta admin lain untuk memberikan hak admin
3. Atau jalankan SQL manual di Supabase:
   ```sql
   UPDATE users SET is_admin = true WHERE username = 'username_anda';
   ```

### Halaman Kontrol Admin Error
**Penyebab:** Kolom `is_admin` belum ditambahkan di database
**Solusi:** Jalankan SQL migration dari file `add_is_admin_column.sql`

## 📁 File yang Diubah/Ditambahkan

### ✨ File Baru:
1. `add_is_admin_column.sql` - SQL migration untuk kolom is_admin
2. `app/admin/kontroladmin.tsx` - Halaman kontrol admin

### 🔧 File yang Dimodifikasi:
1. `lib/database.types.ts` - Tambah field `is_admin` dan `password` di User interface
2. `app/login/page.tsx` - Simpan data user lengkap termasuk is_admin ke localStorage
3. `components/Navbar.tsx` - Tampilkan menu admin berdasarkan is_admin, bukan hardcoded username
4. `app/admin/page.tsx` - Tambah proteksi akses admin

## 📞 Support

Jika ada masalah atau pertanyaan, pastikan:
1. ✅ SQL migration sudah dijalankan
2. ✅ Minimal 1 user sudah memiliki `is_admin = true`
3. ✅ User sudah logout dan login ulang setelah perubahan

---

**Product by:** ence  
**Tanggal:** 1 Desember 2025  
**Sistem:** MUMI BP Kulon - Sistem Absensi Digital
