"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";
import "moment/locale/id";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ExportPDFMenu() {
  const [bulan, setBulan] = useState(new Date().getMonth());
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"rekap" | "izin" | "lengkap">("lengkap");

  const bulanNama = moment().month(bulan).format("MMMM");

  const exportTypes = [
    {
      type: "lengkap" as const,
      icon: "📋",
      title: "Laporan Lengkap",
      desc: "Rekap kehadiran + daftar izin dengan foto",
      color: "from-blue-500 to-indigo-600"
    },
    {
      type: "rekap" as const,
      icon: "📊",
      title: "Rekap Kehadiran",
      desc: "Hanya tabel rekap kehadiran bulanan",
      color: "from-green-500 to-emerald-600"
    },
    {
      type: "izin" as const,
      icon: "📸",
      title: "Daftar Izin + Foto",
      desc: "Daftar izin dengan lampiran foto bukti",
      color: "from-orange-500 to-red-600"
    }
  ];

  const fetchDataAndExport = async () => {
    setLoading(true);
    try {
      const startDate = moment().year(tahun).month(bulan).startOf("month").format("YYYY-MM-DD");
      const endDate = moment().year(tahun).month(bulan).endOf("month").format("YYYY-MM-DD");

      // Fetch users
      const { data: users } = await supabase
        .from("users")
        .select("*")
        .order("nama", { ascending: true });

      // Fetch absensi
      const { data: absensiData } = await supabase
        .from("absensi")
        .select("*")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      if (!users || !absensiData) {
        alert("Tidak ada data untuk diekspor");
        setLoading(false);
        return;
      }

      // Hitung rekap
      const rekapData = users.map((user: any) => {
        const userAbsensi = absensiData.filter((a: any) => a.username === user.username);
        const jumlahHadir = userAbsensi.filter((a: any) => a.status === "HADIR").length;
        const jumlahTidakHadir = userAbsensi.filter((a: any) => a.status === "TIDAK_HADIR").length;
        const jumlahIzin = userAbsensi.filter((a: any) => a.status === "IZIN").length;
        const totalAbsensi = jumlahHadir + jumlahTidakHadir + jumlahIzin;
        const persentaseHadir = totalAbsensi > 0 ? Math.round((jumlahHadir / totalAbsensi) * 100) : 0;

        return {
          nama: user.nama.toUpperCase(),
          username: user.username,
          jumlahHadir,
          jumlahTidakHadir,
          jumlahIzin,
          persentaseHadir
        };
      });

      // Data izin dengan foto
      const izinData = absensiData
        .filter((a: any) => a.status === "IZIN" && a.foto_izin)
        .map((a: any) => ({
          nama: a.nama,
          tanggal: a.tanggal,
          keterangan: a.keterangan_izin && a.keterangan_izin.trim() !== "" ? a.keterangan_izin : "Tidak ada keterangan",
          foto_izin: a.foto_izin,
          created_at: a.created_at
        }))
        .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

      // Generate PDF berdasarkan tipe
      if (selectedType === "rekap") {
        await generateRekapPDF(rekapData, bulanNama, tahun);
      } else if (selectedType === "izin") {
        await generateIzinPDF(izinData, bulanNama, tahun);
      } else {
        await generateLengkapPDF(rekapData, izinData, bulanNama, tahun);
      }

    } catch (error) {
      console.error("Error:", error);
      alert("Gagal mengekspor PDF");
    }
    setLoading(false);
  };

  // PDF Generator - Rekap Only (LENGKAP SEPERTI DI PRESENSI)
  const generateRekapPDF = async (rekap: any[], bulan: string, tahun: number) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const bulanAngka = String(moment().month(bulan).format("M")).padStart(2, '0');
    
    // Analisis data
    const sorted = [...rekap].sort((a, b) => b.persentaseHadir - a.persentaseHadir);
    const tertinggi = sorted[0];
    
    addHeaderLengkap(doc, bulan, tahun, rekap.length, bulanAngka);

    let currentY = 70;
    
    // Naratif pembuka
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const naratif = `Berdasarkan hasil pencatatan kehadiran kegiatan bulan ${bulan} ${tahun}, berikut disampaikan rekapitulasi tingkat kehadiran anggota Remaja LDII BPKULON.`;
    const splitNaratif = doc.splitTextToSize(naratif, pageWidth - 30);
    doc.text(splitNaratif, 15, currentY);
    currentY += (splitNaratif.length * 5) + 5;

    // Ringkasan tertinggi
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Ringkasan Rekap:", 15, currentY);
    currentY += 8;
    
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
      styles: { font: "times", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 30 }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 12;
    
    // Garis pemisah
    doc.setLineWidth(0.5);
    doc.setDrawColor(144, 238, 144);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 5;
    
    // Tabel lengkap
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Daftar Lengkap Rekap Kehadiran:", 15, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama', 'Hadir', 'Izin', 'Tidak Hadir', 'Persentase']],
      body: rekap.map((item, idx) => [
        (idx + 1).toString(),
        item.nama,
        item.jumlahHadir.toString(),
        item.jumlahIzin.toString(),
        item.jumlahTidakHadir.toString(),
        `${item.persentaseHadir}%`
      ]),
      styles: { font: "times", fontSize: 10, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [0, 146, 63], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 11 },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'left', cellWidth: 68 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 30 },
        5: { halign: 'center', cellWidth: 30 }
      },
      didParseCell: function(data) {
        if (data.column.index === 5 && data.section === 'body') {
          const persentase = parseInt(data.cell.text[0]);
          if (persentase >= 80) {
            data.cell.styles.textColor = [34, 197, 94];
            data.cell.styles.fontStyle = 'bold';
          } else if (persentase >= 60) {
            data.cell.styles.textColor = [251, 146, 60];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Footer apresiasi
    const finalY = (doc as any).lastAutoTable.finalY || 68;
    let footerY = finalY + 10;
    
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const apresiasi = `Berdasarkan hasil rekap presensi bulan ${bulan} ${tahun}, kami mengucapkan apresiasi dan penghargaan kepada ${tertinggi.nama} yang telah menunjukkan dedikasi tinggi dengan persentase kehadiran ${tertinggi.persentaseHadir}%. Semoga dapat menjadi teladan bagi anggota lainnya dalam meningkatkan kehadiran dan partisipasi aktif di Remaja LDII BPKULON.`;
    const splitApresiasi = doc.splitTextToSize(apresiasi, pageWidth - 30);
    doc.text(splitApresiasi, 15, footerY);
    footerY += (splitApresiasi.length * 5) + 8;
    
    // Penutup
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const penutup = `Demikian laporan kehadiran ini dibuat sebagai bentuk evaluasi dan dokumentasi kegiatan remaja LDII BPKULON selama bulan ${bulan} ${tahun}.`;
    const splitPenutup = doc.splitTextToSize(penutup, pageWidth - 30);
    doc.text(splitPenutup, 15, footerY);
    footerY += (splitPenutup.length * 5) + 8;

    addFooterSignature(doc, bulan, tahun, footerY);
    doc.save(`Rekap-Kehadiran-${bulan}-${tahun}.pdf`);
  };

  // PDF Generator - Izin dengan Foto (FOTO TAMPIL PENUH)
  const generateIzinPDF = async (izinData: any[], bulan: string, tahun: number) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const bulanAngka = String(moment().month(bulan).format("M")).padStart(2, '0');

    addHeaderLengkap(doc, bulan, tahun, izinData.length, bulanAngka, "DAFTAR IZIN");

    let currentY = 70;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const intro = `Berikut adalah daftar lengkap anggota yang mengajukan izin beserta bukti foto dan keterangan selama bulan ${bulan} ${tahun}. Total terdapat ${izinData.length} pengajuan izin yang tercatat dalam sistem.`;
    const splitIntro = doc.splitTextToSize(intro, pageWidth - 30);
    doc.text(splitIntro, 15, currentY);
    currentY += (splitIntro.length * 5) + 10;

    if (izinData.length === 0) {
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.text("Tidak ada data izin dengan foto untuk bulan ini.", pageWidth / 2, currentY + 20, { align: 'center' });
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text("Semua anggota hadir tanpa pengajuan izin.", pageWidth / 2, currentY + 30, { align: 'center' });
    } else {
      for (let i = 0; i < izinData.length; i++) {
        const izin = izinData[i];
        
        // Check if need new page (with more space for image)
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }

        // Box untuk setiap izin
        doc.setDrawColor(0, 146, 63);
        doc.setLineWidth(1);
        doc.roundedRect(15, currentY, pageWidth - 30, 85, 3, 3);
        
        // Header number
        doc.setFillColor(0, 146, 63);
        doc.roundedRect(15, currentY, 30, 10, 3, 3, 'F');
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`No. ${i + 1}`, 30, currentY + 7, { align: 'center' });

        // Info izin
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(izin.nama, 20, currentY + 20);
        
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`Tanggal: ${moment(izin.tanggal).format("DD MMMM YYYY")} (${moment(izin.tanggal).format("dddd")})`, 20, currentY + 28);
        doc.text(`Keterangan: ${izin.keterangan}`, 20, currentY + 35);
        doc.text(`Waktu Pengajuan: ${moment(izin.created_at).format("DD/MM/YYYY HH:mm")} WIB`, 20, currentY + 42);

        // Foto izin dengan frame
        if (izin.foto_izin) {
          doc.setFont("times", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0, 146, 63);
          doc.text("Bukti Foto Izin:", 20, currentY + 52);
          
          try {
            // Frame untuk foto
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(20, currentY + 55, 60, 25);
            
            // Load dan tampilkan foto
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  doc.addImage(img, "JPEG", 20, currentY + 55, 60, 25);
                  resolve(true);
                } catch (e) {
                  reject(e);
                }
              };
              img.onerror = reject;
              img.src = izin.foto_izin;
            });
            
            // Caption foto
            doc.setFont("times", "italic");
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text("Foto bukti izin terekam dalam sistem", 50, currentY + 82, { align: 'center' });
          } catch (error) {
            console.log("Error loading image:", error);
            doc.setFont("times", "italic");
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text("(Foto tersimpan di sistem database)", 20, currentY + 68);
            doc.text(`URL: ${izin.foto_izin.substring(0, 80)}...`, 20, currentY + 74, { maxWidth: 60 });
          }
        } else {
          doc.setFont("times", "italic");
          doc.setFontSize(9);
          doc.setTextColor(200, 100, 100);
          doc.text("⚠️ Tidak ada foto bukti izin", 20, currentY + 55);
        }

        currentY += 90;
      }
      
      // Kesimpulan
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }
      
      currentY += 10;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Kesimpulan:", 15, currentY);
      currentY += 7;
      
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      const kesimpulan = `Berdasarkan data di atas, tercatat ${izinData.length} pengajuan izin yang telah diverifikasi dengan bukti foto selama bulan ${bulan} ${tahun}. Semua izin telah tercatat dalam sistem presensi LDII BPKULON untuk keperluan dokumentasi dan evaluasi kehadiran.`;
      const splitKesimpulan = doc.splitTextToSize(kesimpulan, pageWidth - 30);
      doc.text(splitKesimpulan, 15, currentY);
      currentY += (splitKesimpulan.length * 5) + 10;
      
      addFooterSignature(doc, bulan, tahun, currentY);
    }

    addFooterNote(doc);
    doc.save(`Daftar-Izin-${bulan}-${tahun}.pdf`);
  };

  // PDF Generator - Lengkap (Rekap + Izin dengan FOTO TAMPIL)
  const generateLengkapPDF = async (rekap: any[], izinData: any[], bulan: string, tahun: number) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const bulanAngka = String(moment().month(bulan).format("M")).padStart(2, '0');
    
    const sorted = [...rekap].sort((a, b) => b.persentaseHadir - a.persentaseHadir);
    const tertinggi = sorted[0];

    addHeaderLengkap(doc, bulan, tahun, rekap.length, bulanAngka, "LAPORAN LENGKAP");

    let currentY = 70;
    
    // Pendahuluan
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const pendahuluan = `Dengan hormat, berikut kami sampaikan laporan lengkap kehadiran kegiatan Remaja LDII BPKULON untuk bulan ${bulan} ${tahun}. Laporan ini mencakup rekapitulasi kehadiran seluruh anggota serta dokumentasi izin yang diajukan beserta bukti pendukung.`;
    const splitPendahuluan = doc.splitTextToSize(pendahuluan, pageWidth - 30);
    doc.text(splitPendahuluan, 15, currentY);
    currentY += (splitPendahuluan.length * 5) + 10;

    // BAGIAN 1: REKAP
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 146, 63);
    doc.text("I. REKAPITULASI KEHADIRAN", 15, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 10;
    
    // Ringkasan statistik
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const totalAnggota = rekap.length;
    const totalHadir = rekap.reduce((sum, r) => sum + r.jumlahHadir, 0);
    const totalIzin = rekap.reduce((sum, r) => sum + r.jumlahIzin, 0);
    const totalTidakHadir = rekap.reduce((sum, r) => sum + r.jumlahTidakHadir, 0);
    const rataRata = Math.round(rekap.reduce((sum, r) => sum + r.persentaseHadir, 0) / totalAnggota);
    
    const statistik = `Tercatat ${totalAnggota} anggota aktif dengan total ${totalHadir} kehadiran, ${totalIzin} izin, dan ${totalTidakHadir} ketidakhadiran. Persentase kehadiran rata-rata mencapai ${rataRata}%.`;
    const splitStatistik = doc.splitTextToSize(statistik, pageWidth - 30);
    doc.text(splitStatistik, 15, currentY);
    currentY += (splitStatistik.length * 5) + 8;

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama', 'Hadir', 'Izin', 'Tidak Hadir', '%']],
      body: rekap.map((item, idx) => [
        (idx + 1).toString(),
        item.nama,
        item.jumlahHadir.toString(),
        item.jumlahIzin.toString(),
        item.jumlahTidakHadir.toString(),
        `${item.persentaseHadir}%`
      ]),
      styles: { font: "times", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [0, 146, 63], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'left', cellWidth: 75 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 22 }
      },
      didParseCell: function(data) {
        if (data.column.index === 5 && data.section === 'body') {
          const persentase = parseInt(data.cell.text[0]);
          if (persentase >= 80) data.cell.styles.textColor = [34, 197, 94];
          else if (persentase >= 60) data.cell.styles.textColor = [251, 146, 60];
          else data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
    
    // Apresiasi
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    const apresiasiTeks = `Apresiasi kepada ${tertinggi.nama} dengan kehadiran tertinggi ${tertinggi.persentaseHadir}%.`;
    doc.text(apresiasiTeks, 15, currentY);
    currentY += 12;

    // BAGIAN 2: DAFTAR IZIN
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(251, 146, 60);
    doc.text("II. DOKUMENTASI IZIN & BUKTI FOTO", 15, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 10;

    if (izinData.length === 0) {
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.text("Tidak ada pengajuan izin pada bulan ini. Semua anggota hadir sesuai jadwal.", 15, currentY);
      currentY += 15;
    } else {
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      const introIzin = `Terdapat ${izinData.length} pengajuan izin yang telah diverifikasi dengan bukti foto sebagai berikut:`;
      doc.text(introIzin, 15, currentY);
      currentY += 10;

      // Tampilkan setiap izin dengan foto
      for (let i = 0; i < izinData.length; i++) {
        const izin = izinData[i];
        
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }

        // Box izin
        doc.setDrawColor(251, 146, 60);
        doc.setLineWidth(1);
        doc.roundedRect(15, currentY, pageWidth - 30, 75, 3, 3);
        
        // Header
        doc.setFillColor(251, 146, 60);
        doc.roundedRect(15, currentY, 25, 10, 3, 3, 'F');
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`${i + 1}`, 27.5, currentY + 7, { align: 'center' });

        // Detail izin
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(izin.nama, 20, currentY + 19);
        
        doc.setFont("times", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`Tanggal: ${moment(izin.tanggal).format("DD MMMM YYYY")}`, 20, currentY + 26);
        doc.text(`Keterangan: ${izin.keterangan}`, 20, currentY + 32);
        doc.text(`Diajukan: ${moment(izin.created_at).format("DD/MM HH:mm")}`, 20, currentY + 38);

        // Foto
        if (izin.foto_izin) {
          doc.setFont("times", "bold");
          doc.setFontSize(9);
          doc.setTextColor(251, 146, 60);
          doc.text("Bukti Foto:", 20, currentY + 46);
          
          try {
            doc.setDrawColor(200, 200, 200);
            doc.rect(20, currentY + 48, 50, 22);
            
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  doc.addImage(img, "JPEG", 20, currentY + 48, 50, 22);
                  resolve(true);
                } catch (e) {
                  reject(e);
                }
              };
              img.onerror = reject;
              img.src = izin.foto_izin;
            });
          } catch (error) {
            doc.setFont("times", "italic");
            doc.setFontSize(7);
            doc.text("(Foto tersimpan di database)", 20, currentY + 59);
          }
        }

        currentY += 80;
      }
    }

    // PENUTUP
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY += 10;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("PENUTUP", 15, currentY);
    currentY += 10;
    
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const penutup = `Demikian laporan lengkap kehadiran dan dokumentasi izin bulan ${bulan} ${tahun} ini kami sampaikan. Semoga informasi ini dapat bermanfaat untuk evaluasi dan peningkatan partisipasi kegiatan Remaja LDII BPKULON ke depannya.`;
    const splitPenutup = doc.splitTextToSize(penutup, pageWidth - 30);
    doc.text(splitPenutup, 15, currentY);
    currentY += (splitPenutup.length * 5) + 10;

    addFooterSignature(doc, bulan, tahun, currentY);
    addFooterNote(doc);
    doc.save(`Laporan-Lengkap-${bulan}-${tahun}.pdf`);
  };

  // Helper functions - LENGKAP
  const addHeaderLengkap = (doc: jsPDF, bulan: string, tahun: number, jumlahData: number, bulanAngka: string, customTitle?: string) => {
    const pageWidth = doc.internal.pageSize.width;
    
    // Nomor dokumen
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const nomorDokumen = `Nomor: ${String(jumlahData).padStart(3, '0')}/LDII-BPK/${bulanAngka}/${tahun}`;
    doc.text(nomorDokumen, pageWidth - 15, 12, { align: 'right' });
    
    // Logo
    try {
      doc.addImage("/logo-ldii.png", "PNG", 15, 10, 30, 30);
    } catch (e) {
      console.log("Logo not loaded");
    }

    // Kop surat
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 146, 63);
    let text = "LEMBAGA DAKWAH ISLAM INDONESIA (LDII)";
    let textWidth = doc.getTextWidth(text);
    let startX = 50;
    let centerX = startX + ((pageWidth - 15 - startX) / 2);
    doc.text(text, centerX - (textWidth / 2), 18);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    text = "KEPENGURUSAN REMAJA LDII BPKULON";
    textWidth = doc.getTextWidth(text);
    doc.text(text, centerX - (textWidth / 2), 26);

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    text = "Jl. Ikan Baronang No.28, Pekauman, Kec. Gresik, Kabupaten Gresik, Jawa Timur 61111";
    textWidth = doc.getTextWidth(text);
    doc.text(text, centerX - (textWidth / 2), 34);

    // Garis pemisah
    doc.setLineWidth(0.8);
    doc.setDrawColor(0, 146, 63);
    doc.line(15, 45, pageWidth - 15, 45);
    doc.setLineWidth(0.3);
    doc.setDrawColor(255, 215, 0);
    doc.line(15, 46.5, pageWidth - 15, 46.5);

    // Judul dokumen
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    text = customTitle ? `${customTitle} BULAN ${bulan.toUpperCase()} ${tahun}` : `REKAP KEHADIRAN BULAN ${bulan.toUpperCase()} ${tahun}`;
    textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, 55);

    // Subtitle
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    text = "Dokumen ini diterbitkan secara resmi oleh Kepengurusan Remaja LDII BPKULON.";
    textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, 62);
  };

  const addFooterSignature = (doc: jsPDF, bulan: string, tahun: number, startY: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const bulanIndex = moment().month(bulan).month();
    const lastDay = new Date(tahun, bulanIndex + 1, 0).getDate();
    
    let currentY = startY;
    
    // Tanggal dan tempat
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const tanggalPengesahan = `Gresik, ${lastDay} ${bulan} ${tahun}`;
    doc.text(tanggalPengesahan, pageWidth - 15, currentY, { align: 'right' });
    doc.text("Kepengurusan Remaja LDII BPKULON", pageWidth - 15, currentY + 6, { align: 'right' });
    
    // Mengetahui
    doc.text("Mengetahui,", pageWidth / 2, currentY + 12, { align: 'center' });
    
    // Kolom TTD
    const col1X = 50;
    const col2X = pageWidth - 50;
    const signatureY = currentY + 18;
    
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("Ketua,", col1X, signatureY, { align: 'center' });
    doc.text("Sekretaris,", col2X, signatureY, { align: 'center' });
    
    // TTD space
    const nameY = signatureY + 25;
    doc.setFont("times", "normal");
    doc.text("(..........................)", col1X, nameY, { align: 'center' });
    doc.text("(..........................)", col2X, nameY, { align: 'center' });
  };

  const addFooterNote = (doc: jsPDF) => {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    // Waktu cetak
    doc.setFont("times", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const printTime = `Dicetak pada: ${moment().format("dddd, DD MMMM YYYY")} pukul ${moment().format("HH:mm")}`;
    const printTimeWidth = doc.getTextWidth(printTime);
    doc.text(printTime, (pageWidth - printTimeWidth) / 2, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(9);
    const footerText = "Dokumen ini dibuat secara otomatis oleh Sistem Presensi LDII BPKULON";
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
    
    // Page number
    doc.setFont("times", "normal");
    doc.text("Halaman 1", pageWidth / 2, pageHeight - 5, { align: 'center' });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📄</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Export PDF Laporan
          </h2>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Month/Year Selector */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          <button
            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white w-10 h-10 sm:w-auto sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg text-sm"
            onClick={() => {
              if (bulan === 0) {
                setBulan(11);
                setTahun((t) => t - 1);
              } else setBulan((b) => b - 1);
            }}
          >
            <span className="sm:mr-2">←</span>
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 sm:px-8 py-3 rounded-xl flex-1 sm:flex-initial max-w-[200px] sm:max-w-none">
            <span className="font-bold text-purple-800 text-sm sm:text-base text-center block">
              {bulanNama} {tahun}
            </span>
          </div>

          <button
            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white w-10 h-10 sm:w-auto sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg text-sm"
            onClick={() => {
              if (bulan === 11) {
                setBulan(0);
                setTahun((t) => t + 1);
              } else setBulan((b) => b + 1);
            }}
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <span className="sm:ml-2">→</span>
          </button>
        </div>

        {/* Export Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {exportTypes.map((type) => (
            <button
              key={type.type}
              onClick={() => setSelectedType(type.type)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 text-left ${
                selectedType === type.type
                  ? `bg-gradient-to-br ${type.color} text-white border-transparent shadow-lg`
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`text-3xl ${selectedType === type.type ? "" : "opacity-70"}`}>
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-sm sm:text-base mb-1 ${
                    selectedType === type.type ? "text-white" : "text-gray-800"
                  }`}>
                    {type.title}
                  </h3>
                  <p className={`text-xs ${
                    selectedType === type.type ? "text-white/90" : "text-gray-600"
                  }`}>
                    {type.desc}
                  </p>
                </div>
                {selectedType === type.type && (
                  <div className="text-white text-xl">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Export Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={fetchDataAndExport}
            disabled={loading}
            className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">⬇️</span>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl flex-shrink-0">💡</div>
            <div>
              <h3 className="text-blue-800 font-semibold mb-1">Tips Export PDF</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>Laporan Lengkap:</strong> Cocok untuk dokumentasi bulanan resmi</li>
                <li>• <strong>Rekap Kehadiran:</strong> Untuk laporan statistik sederhana</li>
                <li>• <strong>Daftar Izin:</strong> Untuk verifikasi izin dengan bukti foto</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
