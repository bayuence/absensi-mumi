
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import "moment/locale/id";

// Fungsi untuk sanitasi karakter non-ASCII
function sanitizeText(text: string): string {
  if (!text) return "";
  return text.replace(/[^\x20-\x7E]/g, "");
}

interface RekapHariIniData {
  nama: string;
  asal?: string;
  status?: string;
  keterangan_status?: string;
  status_presensi: "HADIR" | "IZIN" | "TIDAK_HADIR";
  waktu_presensi?: string;
  keterangan_izin?: string;
}

export const exportRekapHariIniToPDF = (
  rekapData: RekapHariIniData[],
  selectedDate: string,
  stats: {
    total: number;
    hadir: number;
    izin: number;
    tidakHadir: number;
  }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Format tanggal
  const tanggalFormatted = moment(selectedDate).locale('id').format('DD MMMM YYYY');
  const tanggalUntukNomor = moment(selectedDate).locale('id').format('DD-MM-YYYY');
  
  // === NOMOR DOKUMEN (Kanan Atas) ===
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  const nomorDokumen = `Nomor: ${moment(selectedDate).format('DD')}/${moment(selectedDate).format('MM')}/${moment(selectedDate).format('YYYY')}`;
  doc.text(nomorDokumen, pageWidth - 15, 12, { align: 'right' });
  
  try {
    // Logo LDII di kiri atas (berwarna)
    const logoLDII = "/logo-ldii.png";
    doc.addImage(logoLDII, "PNG", 15, 10, 30, 30);
  } catch (error) {
    console.log("Logo tidak dapat dimuat");
  }
  
  // === KOP SURAT ===
  doc.setFont("times", "bold");
  
  // LEMBAGA DAKWAH ISLAM INDONESIA (LDII)
  doc.setFontSize(16);
  doc.setTextColor(0, 146, 63); // Hijau LDII #00923F
  let text = "LEMBAGA DAKWAH ISLAM INDONESIA (LDII)";
  let textWidth = doc.getTextWidth(text);
  let startX = 50;
  let centerX = startX + ((pageWidth - 15 - startX) / 2);
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
  
  // Garis pemisah ganda
  doc.setLineWidth(0.8);
  doc.setDrawColor(0, 146, 63); // Hijau LDII
  doc.line(15, 45, pageWidth - 15, 45);
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(255, 215, 0); // Emas LDII
  doc.line(15, 46.5, pageWidth - 15, 46.5);
  
  // === JUDUL DOKUMEN ===
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  
  text = `REKAP KEHADIRAN HARIAN`;
  textWidth = doc.getTextWidth(text);
  doc.text(text, (pageWidth - textWidth) / 2, 55);
  
  text = `${tanggalFormatted}`;
  textWidth = doc.getTextWidth(text);
  doc.setFontSize(12);
  doc.text(text, (pageWidth - textWidth) / 2, 62);
  
  // === STATISTIK RINGKAS ===
  let currentY = 72;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const statsText = `Total Anggota: ${stats.total} | Hadir: ${stats.hadir} | Izin: ${stats.izin} | Tidak Hadir: ${stats.tidakHadir}`;
  const statsWidth = doc.getTextWidth(statsText);
  doc.text(statsText, (pageWidth - statsWidth) / 2, currentY);
  
  // Garis pemisah
  doc.setLineWidth(0.5);
  doc.setDrawColor(144, 238, 144);
  doc.line(15, currentY + 5, pageWidth - 15, currentY + 5);
  currentY += 12;
  
  // === TABEL REKAP HARIAN ===
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("Daftar Kehadiran:", 15, currentY);
  currentY += 5;
  
  // Siapkan data untuk tabel
  const tableBody = rekapData.map((item, index) => [
    (index + 1).toString(),
    sanitizeText(item.nama).toUpperCase(),
    sanitizeText(item.asal || "-"),
    sanitizeText(item.status || "-") + (item.keterangan_status && item.keterangan_status !== "-" ? ` • ${sanitizeText(item.keterangan_status)}` : ""),
    getStatusDisplay(item.status_presensi),
    sanitizeText(getKeteranganDisplay(item))
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama', 'Asal', 'Status / Keterangan', 'Status Presensi', 'Waktu / Izin']],
    body: tableBody,
    styles: {
      font: "times",
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [0, 146, 63], // Hijau LDII
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10
    },
    bodyStyles: {
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },   // No
      1: { halign: 'left', cellWidth: 40 },     // Nama
      2: { halign: 'left', cellWidth: 35 },     // Asal
      3: { halign: 'left', cellWidth: 35 },     // Status
      4: { halign: 'center', cellWidth: 25 },   // Status Presensi
      5: { halign: 'left', cellWidth: 35 }      // Waktu/Izin
    },
    didParseCell: function(data) {
      // Warna status presensi
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.text[0];
        if (status.includes('HADIR') && !status.includes('TIDAK')) {
          data.cell.styles.textColor = [34, 197, 94]; // Hijau
          data.cell.styles.fontStyle = 'bold';
        } else if (status.includes('IZIN')) {
          data.cell.styles.textColor = [251, 146, 60]; // Orange
          data.cell.styles.fontStyle = 'bold';
        } else if (status.includes('TIDAK HADIR')) {
          data.cell.styles.textColor = [239, 68, 68]; // Merah
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // === RINGKASAN ANALISIS ===
  let footerY = (doc as any).lastAutoTable.finalY + 15;
  const pageHeight = doc.internal.pageSize.height;
  
  // Cek apakah perlu halaman baru
  if (footerY > pageHeight - 100) {
    doc.addPage();
    footerY = 15;
  }
  
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("Ringkasan Kehadiran:", 15, footerY);
  footerY += 8;
  
  // Stats cards
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  
  const statsCards: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: "Total Anggota", value: stats.total.toString(), color: [59, 130, 246] },
    { label: "Hadir", value: stats.hadir.toString(), color: [34, 197, 94] },
    { label: "Izin", value: stats.izin.toString(), color: [251, 146, 60] },
    { label: "Tidak Hadir", value: stats.tidakHadir.toString(), color: [239, 68, 68] }
  ];
  
  let cardX = 15;
  const cardWidth = (pageWidth - 30) / 4 - 3;
  
  statsCards.forEach((card) => {
    // Card background
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(cardX, footerY, cardWidth, 15, 'F');
    
    // Card text
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(card.value, cardX + cardWidth / 2, footerY + 6, { align: 'center' });
    
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text(card.label, cardX + cardWidth / 2, footerY + 11, { align: 'center' });
    
    cardX += cardWidth + 3;
  });
  
  footerY += 20;
  
  // Cek lagi apakah perlu halaman baru untuk narasi
  if (footerY > pageHeight - 80) {
    doc.addPage();
    footerY = 15;
  }
  
  // === KALIMAT PENUTUP ===
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  
  const penutup = `Laporan kehadiran ini diterbitkan untuk keperluan evaluasi dan dokumentasi kegiatan Remaja LDII BPKULON pada tanggal ${tanggalFormatted}. Berdasarkan hasil pencatatan kehadiran, diperoleh data bahwa dari total ${stats.total} anggota, sebanyak ${stats.hadir} anggota hadir, ${stats.izin} anggota dengan status izin, dan ${stats.tidakHadir} anggota tidak hadir pada hari tersebut. Semoga laporan ini dapat menjadi bahan evaluasi untuk meningkatkan partisipasi dan dedikasi anggota dalam setiap kegiatan yang diselenggarakan oleh organisasi.`;
  const splitPenutup = doc.splitTextToSize(penutup, pageWidth - 30);
  doc.text(splitPenutup, 15, footerY);
  footerY += (splitPenutup.length * 5) + 8;
  
  // === BAGIAN PENGESAHAN ===
  const pengesahanY = footerY;
  
  // Tanggal dan tempat (rata kanan)
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  
  const now = new Date();
  const dayName = moment().locale('id').format('dddd');
  const tanggalSekarang = moment().locale('id').format('DD MMMM YYYY');
  const tanggalPengesahan = `Gresik, ${tanggalSekarang}`;
  doc.text(tanggalPengesahan, pageWidth - 15, pengesahanY, { align: 'right' });
  doc.text("Kepengurusan Remaja LDII BPKULON", pageWidth - 15, pengesahanY + 6, { align: 'right' });
  
  // Mengetahui (di tengah)
  doc.text("Mengetahui,", pageWidth / 2, pengesahanY + 12, { align: 'center' });
  
  // Kolom Ketua dan Sekretaris
  const col1X = 50;
  const col2X = pageWidth - 50;
  const signatureY = pengesahanY + 18;
  
  // Ketua
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("Ketua,", col1X, signatureY, { align: 'center' });
  doc.text("Sekretaris,", col2X, signatureY, { align: 'center' });
  
  // Ruang untuk tanda tangan
  const nameY = signatureY + 25;
  doc.setFont("times", "normal");
  doc.text("(..........................)", col1X, nameY, { align: 'center' });
  doc.text("(..........................)", col2X, nameY, { align: 'center' });
  
  // === NOMOR HALAMAN DI FOOTER ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeightFinal = doc.internal.pageSize.height;
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeightFinal - 10, { align: 'center' });
    
    // === INFORMASI WAKTU CETAK ===
    doc.setFont("times", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const printTime = `Dicetak pada: ${dayName}, ${tanggalSekarang} pukul ${hours}.${minutes}`;
    const printTimeWidth = doc.getTextWidth(printTime);
    doc.text(printTime, (pageWidth - printTimeWidth) / 2, pageHeightFinal - 15);
  }
  
  // Save PDF
  const fileName = `Rekap-Kehadiran-Harian-${tanggalUntukNomor}.pdf`;
  doc.save(fileName);
};

// Helper function untuk menampilkan status presensi
const getStatusDisplay = (status: "HADIR" | "IZIN" | "TIDAK_HADIR"): string => {
  switch (status) {
    case "HADIR":
      return "HADIR";
    case "IZIN":
      return "IZIN";
    case "TIDAK_HADIR":
      return "TIDAK HADIR";
    default:
      return status;
  }
};

// Helper function untuk menampilkan keterangan
const getKeteranganDisplay = (item: RekapHariIniData): string => {
  if (item.status_presensi === "HADIR") {
    return item.waktu_presensi ? `${item.waktu_presensi}` : "-";
  } else if (item.status_presensi === "IZIN") {
    return item.keterangan_izin || "-";
  } else {
    return "-";
  }
};
