# 🗂️ Setup Supabase Storage untuk Izin

## ❌ Error: "Bucket not found"

Error ini terjadi karena bucket `izin_photos` belum dibuat di Supabase Storage.

---

## ✅ Cara Membuat Bucket `izin_photos`

### Opsi 1: Via Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Buka Storage**
   - Di sidebar kiri, klik **Storage**
   - Klik tombol **"New bucket"**

3. **Buat Bucket Baru**
   - Bucket name: `izin_photos`
   - Public bucket: **✅ CENTANG** (harus public agar foto bisa dilihat)
   - Klik **"Create bucket"**

4. **✅ Selesai!** Bucket sudah siap digunakan

---

### Opsi 2: Via SQL Editor

Jika ingin membuat via SQL:

1. **Buka SQL Editor** di Supabase Dashboard

2. **Jalankan SQL ini:**

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'izin_photos',
  'izin_photos',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
);
```

3. **Setup Policies untuk Security:**

```sql
-- Policy 1: Allow INSERT for authenticated users
CREATE POLICY "Allow authenticated users to upload izin photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'izin_photos'
);

-- Policy 2: Allow SELECT for everyone (public read)
CREATE POLICY "Allow public read access to izin photos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'izin_photos'
);

-- Policy 3: Allow DELETE for authenticated users
CREATE POLICY "Allow authenticated users to delete izin photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'izin_photos'
);

-- Policy 4: Allow UPDATE for authenticated users
CREATE POLICY "Allow authenticated users to update izin photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'izin_photos'
)
WITH CHECK (
  bucket_id = 'izin_photos'
);
```

---

## 🔍 Cara Verifikasi Bucket Sudah Dibuat

### Via Dashboard:
1. Buka **Storage** di sidebar
2. Cek apakah `izin_photos` muncul di list buckets
3. Klik bucket tersebut
4. Status harus: **Public** ✅

### Via SQL Query:
```sql
SELECT * FROM storage.buckets WHERE name = 'izin_photos';
```

**Expected result:**
```
id            | name         | public
--------------+--------------+--------
izin_photos   | izin_photos  | true
```

---

## 📝 Struktur File yang Akan Disimpan

Setiap foto izin akan disimpan dengan format:

```
Format: {username}_{timestamp}.jpg
Contoh: user123_1701432000000.jpg
Path lengkap: izin_photos/user123_1701432000000.jpg
URL: https://xxx.supabase.co/storage/v1/object/public/izin_photos/user123_1701432000000.jpg
```

---

## 🔐 Security Policies Explained

### 1. INSERT Policy (Upload)
- Hanya user yang **authenticated** (login) yang bisa upload
- Upload hanya ke bucket `izin_photos`
- Mencegah anonymous upload

### 2. SELECT Policy (Read)
- **Public** - Semua orang bisa lihat foto
- Diperlukan agar foto izin bisa ditampilkan di UI
- Admin dan user bisa lihat foto bukti izin

### 3. DELETE Policy (Hapus)
- Hanya user **authenticated** yang bisa hapus
- Untuk admin menghapus data izin beserta fotonya

### 4. UPDATE Policy (Update)
- Hanya user **authenticated** yang bisa update
- Jarang digunakan, tapi untuk kelengkapan

---

## 🧪 Test Bucket Setelah Dibuat

### Test Upload via Supabase Client:

```javascript
// Test di browser console atau JS file
const { data, error } = await supabase
  .storage
  .from('izin_photos')
  .upload('test.jpg', fileBlob);

console.log('Upload result:', data, error);
```

### Test Public URL:

```javascript
const { data } = supabase
  .storage
  .from('izin_photos')
  .getPublicUrl('test.jpg');

console.log('Public URL:', data.publicUrl);
```

---

## ⚠️ Troubleshooting

### Error: "Bucket not found"
**Solusi:** Pastikan bucket `izin_photos` sudah dibuat dengan nama persis sama (case-sensitive)

### Error: "new row violates row-level security policy"
**Solusi:** Jalankan SQL policies di atas, terutama INSERT policy

### Error: "Permission denied"
**Solusi:** 
- Pastikan bucket di-set **public**
- Jalankan SELECT policy untuk public access

### Foto tidak tampil di UI
**Solusi:**
- Cek public URL apakah valid
- Pastikan bucket **public** = true
- Cek SELECT policy sudah dijalankan

---

## 📊 Monitoring Storage Usage

### Cek Jumlah File:
```sql
SELECT COUNT(*) as total_files
FROM storage.objects
WHERE bucket_id = 'izin_photos';
```

### Cek Total Size:
```sql
SELECT 
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint as total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1048576.0, 2) as total_mb
FROM storage.objects
WHERE bucket_id = 'izin_photos';
```

### List Recent Uploads:
```sql
SELECT 
  name,
  created_at,
  metadata->>'size' as size_bytes
FROM storage.objects
WHERE bucket_id = 'izin_photos'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Next Steps

Setelah bucket dibuat:

1. ✅ Bucket `izin_photos` created
2. ✅ Public access enabled
3. ✅ Policies setup
4. ✅ Test upload
5. ✅ Coba ajukan izin dari aplikasi
6. ✅ Verifikasi foto tersimpan
7. ✅ Verifikasi foto tampil di UI

---

## 📱 Cara Test dari Aplikasi

1. Login ke aplikasi
2. Klik **"Ajukan Izin Tidak Hadir"**
3. Ambil foto dengan kamera
4. Isi alasan izin
5. Klik **"Kirim Izin"**
6. Cek di **"Izin Hari Ini"** apakah foto muncul
7. Cek di **Supabase Storage** apakah file ada

---

## ✅ Checklist Final

- [ ] Bucket `izin_photos` created
- [ ] Public bucket: **✅ YES**
- [ ] INSERT policy created
- [ ] SELECT policy created (public)
- [ ] DELETE policy created
- [ ] Test upload berhasil
- [ ] Test public URL accessible
- [ ] Foto izin tampil di aplikasi

---

**Setelah semua checklist ✅, aplikasi izin akan berfungsi sempurna!** 🚀
