-- =============================================
-- TRIGGER: Auto Update Status IZIN -> TIDAK_HADIR
-- Ketika foto_izin dihapus oleh admin
-- =============================================

-- Function untuk handle perubahan foto_izin
CREATE OR REPLACE FUNCTION handle_foto_izin_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika foto_izin dihapus (dari ada menjadi NULL) dan status adalah IZIN
  IF OLD.foto_izin IS NOT NULL AND NEW.foto_izin IS NULL AND OLD.status = 'IZIN' THEN
    -- Ubah status menjadi TIDAK_HADIR
    NEW.status := 'TIDAK_HADIR';
    -- Hapus keterangan izin
    NEW.keterangan := 'Foto izin dihapus oleh admin - Status diubah menjadi Tidak Hadir';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS trigger_foto_izin_deleted ON absensi;

-- Buat trigger yang akan dijalankan sebelum update
CREATE TRIGGER trigger_foto_izin_deleted
  BEFORE UPDATE ON absensi
  FOR EACH ROW
  EXECUTE FUNCTION handle_foto_izin_deleted();

-- =============================================
-- CARA PENGGUNAAN:
-- 1. Copy semua kode SQL di atas
-- 2. Buka Supabase Dashboard -> SQL Editor
-- 3. Paste dan Run query ini
-- 4. Setelah itu, setiap kali admin menghapus foto_izin
--    dari record yang statusnya IZIN, otomatis akan
--    berubah menjadi TIDAK_HADIR
-- =============================================
