import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RekapData {
  nama: string;
  jumlahHadir: number;
  jumlahIzin: number;
  jumlahTidakHadir: number;
  persentaseHadir: number;
}

export const exportRekapToPDF = (
  rekap: RekapData[],
  bulanNama: string,
  tahun: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // === ANALISIS DATA: Tertinggi & Terendah ===
  const sorted = [...rekap].sort((a, b) => b.persentaseHadir - a.persentaseHadir);
  const tertinggi = sorted[0];
  const terendah = sorted.slice(-3).reverse(); // 3 terendah
  
  // Load logo LDII
  const logoLDII = "/logo-ldii.png";
  
  // === NOMOR DOKUMEN (Kanan Atas) ===
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const bulanAngka = String(new Date().getMonth() + 1).padStart(2, '0');
  const nomorDokumen = `Nomor: ${String(rekap.length).padStart(3, '0')}/LDII-BPK/${bulanAngka}/${tahun}`;
  doc.text(nomorDokumen, pageWidth - 15, 12, { align: 'right' });
  
  try {
    // Logo LDII di kiri atas (berwarna)
    doc.addImage(logoLDII, "PNG", 15, 10, 30, 30);
  } catch (error) {
    console.log("Logo tidak dapat dimuat");
  }
  
  // === KOP SURAT ===
  // Set font untuk kop surat
  doc.setFont("times", "bold");
  
  // LEMBAGA DAKWAH ISLAM INDONESIA (LDII) - dimulai setelah logo + jarak 50
  doc.setFontSize(16);
  doc.setTextColor(0, 146, 63); // Hijau LDII #00923F
  let text = "LEMBAGA DAKWAH ISLAM INDONESIA (LDII)";
  let textWidth = doc.getTextWidth(text);
  let startX = 50; // Mulai setelah logo + margin 5
  let centerX = startX + ((pageWidth - 15 - startX) / 2); // Center dari sisa area
  doc.text(text, centerX - (textWidth / 2), 18);
  
  // KEPENGURUSAN REMAJA LDII BPKULON
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  text = "KEPENGURUSAN REMAJA LDII BPKULON";
  textWidth = doc.getTextWidth(text);
  doc.text(text, centerX - (textWidth / 2), 26);
  
  // Alamat
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  text = "Jl. Ikan Baronang No.28, Pekauman, Kec. Gresik, Kabupaten Gresik, Jawa Timur 61111";
  textWidth = doc.getTextWidth(text);
  doc.text(text, centerX - (textWidth / 2), 34);
  
  // Garis pemisah ganda (tebal-tipis) - turun lebih bawah agar tidak menyentuh logo
  doc.setLineWidth(0.8);
  doc.setDrawColor(0, 146, 63); // Hijau LDII
  doc.line(15, 45, pageWidth - 15, 45);
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(255, 215, 0); // Emas LDII #FFD700
  doc.line(15, 46.5, pageWidth - 15, 46.5);
  
  // === JUDUL DOKUMEN ===
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  
  text = `REKAP KEHADIRAN BULAN ${bulanNama.toUpperCase()} ${tahun}`;
  textWidth = doc.getTextWidth(text);
  doc.text(text, (pageWidth - textWidth) / 2, 55);
  
  // Keterangan sumber resmi (italic, lebih kecil)
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  text = "Dokumen ini diterbitkan secara resmi oleh Kepengurusan Remaja LDII BPKULON.";
  textWidth = doc.getTextWidth(text);
  doc.text(text, (pageWidth - textWidth) / 2, 62);
  
  // === KALIMAT NARATIF PEMBUKA ===
  let currentY = 70;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const naratif = `Berdasarkan hasil pencatatan kehadiran kegiatan bulan ${bulanNama} ${tahun}, berikut disampaikan rekapitulasi tingkat kehadiran anggota Remaja LDII BPKULON.`;
  const splitNaratif = doc.splitTextToSize(naratif, pageWidth - 30);
  doc.text(splitNaratif, 15, currentY);
  currentY += (splitNaratif.length * 5) + 5;
  
  // === RINGKASAN: Tertinggi ===
  // Judul Ringkasan
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Ringkasan Rekap:", 15, currentY);
  currentY += 8;
  
  // Tabel Tingkat Kehadiran Tertinggi
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("• Tingkat Kehadiran Tertinggi (1 orang)", 15, currentY);
  currentY += 5;
  
  autoTable(doc, {
    startY: currentY,
    head: [['Nama', 'Hadir', 'Izin', 'Tidak Hadir', 'Persentase']],
    body: [[
      tertinggi.nama,
      tertinggi.jumlahHadir.toString(),
      tertinggi.jumlahIzin.toString(),
      tertinggi.jumlahTidakHadir.toString(),
      `${tertinggi.persentaseHadir}%`
    ]],
    styles: {
      font: "times",
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [34, 197, 94], // Hijau
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 30 }
    }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 12;
  
  // Garis pemisah hijau muda sebelum tabel lengkap
  doc.setLineWidth(0.5);
  doc.setDrawColor(144, 238, 144); // Hijau muda (LightGreen)
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 5;
  
  // Judul Tabel Lengkap
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("Daftar Lengkap Rekap Kehadiran:", 15, currentY);
  currentY += 5;
  
  // === TABEL REKAP LENGKAP ===
  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama', 'Hadir', 'Izin', 'Tidak Hadir', 'Persentase']],
    body: rekap.map((item, index) => [
      (index + 1).toString(),
      item.nama,
      item.jumlahHadir.toString(),
      item.jumlahIzin.toString(),
      item.jumlahTidakHadir.toString(),
      `${item.persentaseHadir}%`
    ]),
    styles: {
      font: "times",
      fontSize: 10,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [0, 146, 63], // Hijau LDII
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 11
    },
    bodyStyles: {
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 }, // No
      1: { halign: 'left', cellWidth: 68 },   // Nama
      2: { halign: 'center', cellWidth: 20 }, // Hadir
      3: { halign: 'center', cellWidth: 20 }, // Izin
      4: { halign: 'center', cellWidth: 30 }, // Tidak Hadir
      5: { halign: 'center', cellWidth: 30 }  // Persentase
    },
    didParseCell: function(data) {
      // Warna persentase berdasarkan nilai
      if (data.column.index === 5 && data.section === 'body') {
        const persentase = parseInt(data.cell.text[0]);
        if (persentase >= 80) {
          data.cell.styles.textColor = [34, 197, 94]; // Hijau
          data.cell.styles.fontStyle = 'bold';
        } else if (persentase >= 60) {
          data.cell.styles.textColor = [251, 146, 60]; // Orange
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [239, 68, 68]; // Merah
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // === FOOTER ===
  const finalY = (doc as any).lastAutoTable.finalY || 68;
  const pageHeight = doc.internal.pageSize.height;
  
  // Ringkasan Temuan
  let footerY = finalY + 10;
  
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Kalimat apresiasi untuk kehadiran tertinggi
  const apresiasi = `Berdasarkan hasil rekap presensi bulan ${bulanNama} ${tahun}, kami mengucapkan apresiasi dan penghargaan kepada ${tertinggi.nama} yang telah menunjukkan dedikasi tinggi dengan persentase kehadiran ${tertinggi.persentaseHadir}%. Semoga dapat menjadi teladan bagi anggota lainnya dalam meningkatkan kehadiran dan partisipasi aktif di Remaja LDII BPKULON.`;
  
  const splitRingkasan = doc.splitTextToSize(apresiasi, pageWidth - 30);
  doc.text(splitRingkasan, 15, footerY);
  footerY += (splitRingkasan.length * 5) + 8;
  
  // === KALIMAT PENUTUP RESMI ===
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const penutup = `Demikian laporan kehadiran ini dibuat sebagai bentuk evaluasi dan dokumentasi kegiatan remaja LDII BPKULON selama bulan ${bulanNama} ${tahun}.`;
  const splitPenutup = doc.splitTextToSize(penutup, pageWidth - 30);
  doc.text(splitPenutup, 15, footerY);
  footerY += (splitPenutup.length * 5) + 8;
  
  // Catatan footer (di bawah penutup)
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const footerNote = "Dokumen ini dibuat secara otomatis oleh sistem presensi LDII BPKULON.";
  const footerWidth = doc.getTextWidth(footerNote);
  doc.text(footerNote, (pageWidth - footerWidth) / 2, footerY);
  
  // === BAGIAN PENGESAHAN ===
  const pengesahanY = footerY + 10;
  
  // Tanggal dan tempat (rata kanan)
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const lastDay = new Date(tahun, new Date().getMonth() + 1, 0).getDate();
  const tanggalPengesahan = `Gresik, ${lastDay} ${bulanNama} ${tahun}`;
  doc.text(tanggalPengesahan, pageWidth - 15, pengesahanY, { align: 'right' });
  doc.text("Kepengurusan Remaja LDII BPKULON", pageWidth - 15, pengesahanY + 6, { align: 'right' });
  
  // Mengetahui (di tengah)
  doc.text("Mengetahui,", pageWidth / 2, pengesahanY + 12, { align: 'center' });
  
  // Kolom Ketua dan Sekretaris (sejajar horizontal)
  const col1X = 50;  // Posisi Ketua
  const col2X = pageWidth - 50;  // Posisi Sekretaris
  const signatureY = pengesahanY + 18;
  
  // Ketua (kiri)
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("Ketua,", col1X, signatureY, { align: 'center' });
  
  // Sekretaris (kanan) - DI BARIS YANG SAMA
  doc.text("Sekretaris,", col2X, signatureY, { align: 'center' });
  
  // Ruang untuk tanda tangan
  const nameY = signatureY + 25;
  
  // Nama Ketua (dalam kurung)
  doc.setFont("times", "normal");
  doc.text("(..........................)", col1X, nameY, { align: 'center' });
  
  // Nama Sekretaris (dalam kurung) - DI BARIS YANG SAMA
  doc.text("(..........................)", col2X, nameY, { align: 'center' });
  
  // === NOMOR HALAMAN DI FOOTER ===
  const totalPages = 1; // Bisa di-update jika multi-page
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Halaman 1 dari ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // === INFORMASI WAKTU CETAK (di atas nomor halaman) ===
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  // Format tanggal dan waktu dalam bahasa Indonesia
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const printTime = `Dicetak pada: ${dayName}, ${date} ${monthName} ${year} pukul ${hours}.${minutes}`;
  const printTimeWidth = doc.getTextWidth(printTime);
  doc.text(printTime, (pageWidth - printTimeWidth) / 2, pageHeight - 15);
  
  // Save PDF
  const fileName = `Rekap-Kehadiran-${bulanNama}-${tahun}-LDII-BPKULON.pdf`;
  doc.save(fileName);
};
