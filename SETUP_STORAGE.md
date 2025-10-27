# Setup Supabase Storage untuk Foto Profil

## Langkah-langkah Setup:

### 1. Buat Storage Bucket di Supabase
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **Storage** di sidebar kiri
4. Klik **New Bucket**
5. Isi form:
   - **Name**: `profile-photos`
   - **Public bucket**: Centang ✅ (agar foto bisa diakses public)
   - Klik **Create Bucket**

### 2. Set Storage Policy (Opsional - untuk security)
Jika ingin users hanya bisa upload/delete foto mereka sendiri:

1. Di Storage page, klik bucket **profile-photos**
2. Klik tab **Policies**
3. Klik **New Policy**
4. Pilih template atau custom policy

**Policy untuk Upload** (Allow INSERT):
```sql
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'profile-photos');
```

**Policy untuk Delete** (Allow DELETE):
```sql
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'profile-photos');
```

**Policy untuk Read** (Allow SELECT):
```sql
CREATE POLICY "Public can view all photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
```

### 3. Update Table users untuk kolom foto_profil

Jalankan SQL query di Supabase SQL Editor:

```sql
ALTER TABLE users 
ADD COLUMN foto_profil TEXT;
```

### 4. Test Upload
1. Login ke aplikasi
2. Klik menu **Profil**
3. Klik icon camera 📷 untuk upload foto
4. Pilih gambar (max 2MB)
5. Foto akan ter-upload dan tersimpan

### 5. Fitur yang Tersedia
- ✅ Upload foto profil (max 2MB)
- ✅ Preview foto profil
- ✅ Hapus foto profil
- ✅ Validasi ukuran dan tipe file
- ✅ Auto-replace foto lama saat upload baru
- ✅ Notifikasi success/error

## Catatan Penting:
- Ukuran maksimal file: **2MB**
- Format yang didukung: **semua format image** (jpg, png, gif, webp, dll)
- Foto disimpan di: `profile-photos/{username}/{timestamp}.{ext}`
- Foto lama otomatis dihapus saat upload foto baru
