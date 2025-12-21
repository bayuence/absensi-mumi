// API Route untuk Auto Record Tidak Hadir
// File: app/api/cron/auto-record-tidak-hadir/route.ts

import supabase from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import moment from "moment-timezone";



export async function GET(request: Request) {
  // Validasi secret key untuk keamanan
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("=== Starting Auto Record Tidak Hadir ===");
    
    // Ambil semua jadwal yang sudah lewat (tanggal < hari ini)
    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
    
    const { data: jadwalLewat, error: jadwalError } = await supabase
      .from("jadwal_guru")
      .select("*")
      .lt("tanggal", today);

    if (jadwalError) {
      console.error("Error fetching jadwal:", jadwalError);
      return NextResponse.json({ error: jadwalError.message }, { status: 500 });
    }

    if (!jadwalLewat || jadwalLewat.length === 0) {
      console.log("No past schedules found");
      return NextResponse.json({ 
        success: true, 
        message: "No past schedules to process",
        recorded: 0 
      });
    }

    console.log(`Found ${jadwalLewat.length} past schedule entries`);

    // Group by tanggal
    const jadwalByDate = jadwalLewat.reduce((acc: Record<string, any[]>, j: any) => {
      if (!acc[j.tanggal]) {
        acc[j.tanggal] = [];
      }
      acc[j.tanggal].push(j);
      return acc;
    }, {} as Record<string, any[]>);

    let totalRecorded = 0;

    // Process setiap tanggal
    for (const [tanggal, jadwalList] of Object.entries(jadwalByDate)) {
      console.log(`Processing date: ${tanggal}`);

      // Ambil semua absensi untuk tanggal ini
      const { data: existingAbsensi } = await supabase
        .from("absensi")
        .select("username")
        .eq("tanggal", tanggal);

      const usernamesSudahAbsen = new Set(
        existingAbsensi?.map((a: any) => a.username) || []
      );

      // Ambil semua users
      const { data: allUsers } = await supabase
        .from("users")
        .select("*");

      if (!allUsers) continue;

      // Buat map nama guru -> kode absensi
      const guruKodeMap = new Map<string, string>();
      (jadwalList as any[]).forEach((j: any) => {
        guruKodeMap.set(j.guru, j.kode_absensi);
      });

      // Filter user yang:
      // 1. Ada di jadwal hari itu
      // 2. Belum ada record absensi
      const usersBelumAbsen = allUsers.filter((user: any) => {
        const adaDiJadwal = guruKodeMap.has(user.nama);
        const belumAbsen = !usernamesSudahAbsen.has(user.username);
        return adaDiJadwal && belumAbsen;
      });

      if (usersBelumAbsen.length === 0) {
        console.log(`No missing records for ${tanggal}`);
        continue;
      }

      console.log(`Creating ${usersBelumAbsen.length} TIDAK_HADIR records for ${tanggal}`);

      // Buat records TIDAK_HADIR
      const tidakHadirRecords = usersBelumAbsen.map((user: any) => ({
        username: user.username,
        nama: user.nama,
        tanggal: tanggal,
        status: "TIDAK_HADIR",
        kode_absensi: guruKodeMap.get(user.nama),
        foto_profil: user.foto_profil || null,
        keterangan: "Tidak input kode absensi dan tidak izin - Auto recorded setelah 24 jam",
        created_at: moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
      }));

      const { error: insertError } = await supabase
        .from("absensi")
        .insert(tidakHadirRecords);

      if (insertError) {
        console.error(`Error inserting for ${tanggal}:`, insertError);
      } else {
        totalRecorded += tidakHadirRecords.length;
        console.log(`✓ Recorded ${tidakHadirRecords.length} for ${tanggal}`);
      }
    }

    console.log(`=== Completed: ${totalRecorded} total records created ===`);

    return NextResponse.json({
      success: true,
      message: `Successfully recorded ${totalRecorded} TIDAK_HADIR entries`,
      recorded: totalRecorded,
      processedDates: Object.keys(jadwalByDate).length,
    });
  } catch (error: any) {
    console.error("Error in auto record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Untuk testing via browser (development only)
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }
  return GET(request);
}
