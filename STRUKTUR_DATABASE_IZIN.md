# 📊 STRUKTUR DATABASE & SISTEM IZIN

## 🗄️ Struktur Tabel Database

### 1. Tabel `absensi` (Tabel Utama untuk Semua Kehadiran)

```sql
CREATE TABLE absensi (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  nama TEXT NOT NULL,
  tanggal DATE NOT NULL,
  status TEXT NOT NULL,  -- 'HADIR', 'IZIN', atau 'TIDAK_HADIR'
  foto_profil TEXT,
  keterangan TEXT,       -- Alasan izin (hanya untuk status IZIN)
  foto_izin TEXT,        -- URL foto bukti izin (hanya untuk status IZIN)
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Penjelasan Kolom:**
- `id`: ID unik untuk setiap record
- `username`: Username user dari tabel users
- `nama`: Nama lengkap user
- `tanggal`: Tanggal absensi (YYYY-MM-DD)
- `status`: Status kehadiran
  * `HADIR` = User hadir dengan kode presensi
  * `IZIN` = User mengajukan izin dengan foto & alasan
  * `TIDAK_HADIR` = User tidak hadir (dicatat otomatis)
- `foto_profil`: URL foto profil user (dari tabel users)
- `keterangan`: Text alasan izin (NULL jika HADIR/TIDAK_HADIR)
- `foto_izin`: URL foto bukti izin di storage (NULL jika HADIR/TIDAK_HADIR)
- `created_at`: Timestamp kapan record dibuat

### 2. Tabel `users` (Data User)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  password TEXT NOT NULL,
  foto_profil TEXT,
  asal TEXT,
  jabatan TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);
```

### 3. Tabel `jadwal_guru` (Jadwal Harian)

```sql
CREATE TABLE jadwal_guru (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  kode_absensi TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 ALUR KERJA SISTEM IZIN

### A. User Mengajukan Izin

1. **User klik "Ajukan Izin Tidak Hadir"**
   - Modal `izinhadir.tsx` terbuka

2. **User mengisi form izin:**
   - Buka kamera (environment/back camera default)
   - Ambil foto bukti (mandatory)
   - Tulis alasan izin (mandatory)

3. **Data yang disimpan:**
   ```javascript
   {
     username: "user123",
     nama: "JOHN DOE",
     tanggal: "2025-12-01",
     status: "IZIN",
     foto_profil: "url_foto_profil",
     keterangan: "Sakit demam",
     foto_izin: "url_foto_bukti_dari_storage",
     created_at: "2025-12-01 08:30:00"
   }
   ```

4. **Foto izin disimpan di:**
   - Supabase Storage bucket: `izin_photos`
   - Format nama file: `{username}_{timestamp}.jpg`
   - Public access: Yes
   - URL: `https://xxx.supabase.co/storage/v1/object/public/izin_photos/{filename}`

---

## 📈 PERHITUNGAN STATISTIK

### Rekap Bulanan (Monthly Recap)

```javascript
// Untuk setiap user:
const jumlahHadir = records.filter(r => r.status === "HADIR").length;
const jumlahIzin = records.filter(r => r.status === "IZIN").length;
const jumlahTidakHadir = records.filter(r => r.status === "TIDAK_HADIR").length;

// Total absensi tercatat
const totalAbsensi = jumlahHadir + jumlahIzin + jumlahTidakHadir;

// Persentase kehadiran (izin TIDAK dihitung sebagai hadir)
const persentaseHadir = (jumlahHadir / totalAbsensi) * 100;
```

**Contoh:**
```
User: JOHN DOE
- Hadir: 15 hari
- Izin: 3 hari
- Tidak Hadir: 2 hari
- Total: 20 hari
- Persentase: (15/20) * 100 = 75%
```

---

## 📱 TAMPILAN DATA IZIN

### 1. User View (app/absensi/page.tsx)

**Section "Izin Hari Ini":**
- Menampilkan semua user yang izin hari ini
- Data yang ditampilkan:
  * Foto profil
  * Nama (uppercase)
  * Username (@username)
  * Waktu izin (HH:mm)
  * Alasan izin (dalam box orange)
  * Foto bukti izin (thumbnail, klik untuk zoom)

**Section "Rekap Kehadiran Bulanan":**
- Tabel dengan kolom:
  * Nama
  * ✅ Hadir (hijau)
  * 📝 Izin (orange)
  * ❌ Tidak Hadir (merah)
  * 📈 Persentase

### 2. Admin View (app/admin/kelolapresensi/)

#### a. KelolaIzin.tsx
- Filter by tanggal
- Card per izin dengan:
  * Foto profil
  * Nama & username
  * Waktu izin
  * Alasan izin
  * Foto bukti (thumbnail & zoom modal)
  * Button hapus
- Stats: Total izin per hari

#### b. RekapPresensi.tsx
- Tabel rekap bulanan
- Kolom: Nama, Hadir, Izin, Absen, %
- Data dari tabel `absensi` dengan filter status
- Persentase dihitung termasuk izin

#### c. page.tsx (Daftar Kehadiran)
- Hanya menampilkan user dengan status `HADIR`
- Izin dan Tidak Hadir punya section terpisah

---

## 📤 EXPORT PDF

File: `app/absensi/exportPDF.ts`

**Data yang di-export:**
```typescript
interface RekapData {
  nama: string;
  jumlahHadir: number;
  jumlahIzin: number;      // ✅ Include
  jumlahTidakHadir: number;
  persentaseHadir: number;
}
```

**Tabel PDF:**
1. Top 5 Kehadiran Tertinggi
   - Columns: Nama | Hadir | Izin | Tidak Hadir | Persentase

2. Rekap Lengkap
   - Columns: No | Nama | Hadir | Izin | Tidak Hadir | Persentase

---

## 🔐 STORAGE POLICIES (Supabase)

### Bucket: `izin_photos`

```sql
-- Allow INSERT for authenticated users
CREATE POLICY "Allow insert for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'izin_photos');

-- Allow SELECT for everyone (public read)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'izin_photos');

-- Allow DELETE for authenticated users (admin only in practice)
CREATE POLICY "Allow delete for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'izin_photos');
```

---

## 🎯 KONSISTENSI DATA

### Data Flow Complete:

1. **Input (User):**
   - Form Presensi → status `HADIR`
   - Form Izin → status `IZIN` + keterangan + foto_izin

2. **Processing (System):**
   - Auto record → status `TIDAK_HADIR` (untuk yang tidak hadir)

3. **Display (Views):**
   - User: Lihat izin hari ini, rekap bulanan dengan izin
   - Admin: Kelola izin, kelola kehadiran, rekap lengkap

4. **Export (PDF):**
   - Semua data termasuk izin

5. **Storage:**
   - Semua di tabel `absensi` (satu tabel untuk semua status)
   - Foto izin di Supabase Storage bucket `izin_photos`

---

## ✅ CHECKLIST FITUR IZIN

- [x] Form izin dengan kamera + reason
- [x] Upload foto ke Supabase Storage
- [x] Simpan data izin ke tabel absensi
- [x] Tampil "Izin Hari Ini" di user view
- [x] Include izin di rekap bulanan
- [x] Update perhitungan persentase (izin included)
- [x] Export PDF dengan kolom izin
- [x] Admin panel KelolaIzin (view, delete)
- [x] Admin rekap bulanan dengan kolom izin
- [x] Mobile responsive semua komponen
- [x] Photo zoom modal untuk bukti izin

---

## 📝 CATATAN PENTING

1. **Satu Tabel untuk Semua:**
   - Tidak ada tabel terpisah untuk izin
   - Semua ada di tabel `absensi`
   - Bedakan dengan kolom `status`

2. **Foto Izin:**
   - Mandatory saat izin
   - Disimpan di Supabase Storage
   - Public access untuk viewing
   - URL disimpan di kolom `foto_izin`

3. **Persentase:**
   - Formula: `hadir / (hadir + izin + tidak_hadir) * 100`
   - Izin TIDAK dihitung sebagai kehadiran
   - Izin mengurangi persentase kehadiran

4. **Konsistensi:**
   - Semua query menggunakan tabel `absensi`
   - Filter by `status` untuk pisahkan data
   - Nama kolom konsisten di seluruh aplikasi

---

## 🔍 Query Examples

### Get Izin Hari Ini
```javascript
const { data } = await supabase
  .from("absensi")
  .select("*")
  .eq("tanggal", "2025-12-01")
  .eq("status", "IZIN");
```

### Get Rekap Bulanan
```javascript
const { data } = await supabase
  .from("absensi")
  .select("*")
  .gte("tanggal", "2025-12-01")
  .lte("tanggal", "2025-12-31");

// Then filter by status in code:
const hadir = data.filter(a => a.status === "HADIR");
const izin = data.filter(a => a.status === "IZIN");
const tidakHadir = data.filter(a => a.status === "TIDAK_HADIR");
```

### Delete Izin Record
```javascript
const { error } = await supabase
  .from("absensi")
  .delete()
  .eq("id", izinId);
```

---

**Struktur ini memastikan:**
✅ Data izin tersimpan dengan baik (text + foto)
✅ Statistik akurat (hadir, izin, tidak hadir terpisah)
✅ Tidak ada data duplikat atau tabel redundan
✅ Mudah di-maintain dan di-query
