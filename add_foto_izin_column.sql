-- Tambahkan kolom foto_izin ke tabel absensi
ALTER TABLE absensi 
ADD COLUMN IF NOT EXISTS foto_izin TEXT;

-- Ubah status IZIN menjadi uppercase di data yang sudah ada
UPDATE absensi 
SET status = 'IZIN' 
WHERE LOWER(status) = 'izin';

-- Buat bucket untuk menyimpan foto izin (jalankan di Supabase Dashboard)
-- Storage > Create Bucket > 
-- Name: izin_photos
-- Public: Yes (centang)
-- Allowed MIME types: image/jpeg, image/jpg, image/png
-- Max file size: 5MB

-- Policy untuk upload (jalankan di SQL Editor setelah bucket dibuat)
CREATE POLICY "Enable upload for authenticated users"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'izin_photos');

-- Policy untuk read (agar foto bisa diakses)
CREATE POLICY "Enable read for all users"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'izin_photos');

-- Policy untuk delete (untuk admin)
CREATE POLICY "Enable delete for authenticated users"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'izin_photos');
