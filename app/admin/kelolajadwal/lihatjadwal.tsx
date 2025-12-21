"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";
import moment from "moment";
import "moment/locale/id";



interface JadwalGuru {
  id: number;
  tanggal: string;
  guru: string;
  kode_absensi: string;
}

interface GroupedJadwal {
  [key: string]: {
    [kode: string]: JadwalGuru[];
  };
}

interface LihatJadwalProps {
  jadwalList: JadwalGuru[];
  onRefresh: () => void;
}

export default function LihatJadwal({ jadwalList, onRefresh }: LihatJadwalProps) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
    
    setDeleting(id);
    const { error } = await supabase
      .from("jadwal_guru")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus jadwal: " + error.message);
    } else {
      alert("Jadwal berhasil dihapus!");
      onRefresh();
    }
    setDeleting(null);
  };

  const handleDeleteByCode = async (kode: string, tanggal: string) => {
    if (!confirm(`Yakin ingin menghapus semua jadwal dengan kode ${kode} pada tanggal ${moment(tanggal).format("DD MMMM YYYY")}?`)) return;
    
    const { error } = await supabase
      .from("jadwal_guru")
      .delete()
      .eq("kode_absensi", kode)
      .eq("tanggal", tanggal);

    if (error) {
      alert("Gagal menghapus jadwal: " + error.message);
    } else {
      alert("Semua jadwal berhasil dihapus!");
      onRefresh();
    }
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Group jadwal by date and code
  const groupedJadwal: GroupedJadwal = jadwalList.reduce((acc, jadwal) => {
    if (!acc[jadwal.tanggal]) {
      acc[jadwal.tanggal] = {};
    }
    if (!acc[jadwal.tanggal][jadwal.kode_absensi]) {
      acc[jadwal.tanggal][jadwal.kode_absensi] = [];
    }
    acc[jadwal.tanggal][jadwal.kode_absensi].push(jadwal);
    return acc;
  }, {} as GroupedJadwal);

  // Sort guru names alphabetically within each code
  Object.keys(groupedJadwal).forEach(tanggal => {
    Object.keys(groupedJadwal[tanggal]).forEach(kode => {
      groupedJadwal[tanggal][kode].sort((a, b) => a.guru.localeCompare(b.guru));
    });
  });

  // Calendar functions
  const generateCalendar = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');

    const calendar = [];
    let day = startDate.clone();

    while (day.isBefore(endDate, 'day')) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day.clone());
        day.add(1, 'day');
      }
      calendar.push(week);
    }

    return calendar;
  };

  const getGuruForDate = (date: moment.Moment) => {
    const dateStr = date.format('YYYY-MM-DD');
    const jadwalForDate = jadwalList.filter(j => j.tanggal === dateStr);
    return jadwalForDate;
  };

  const isToday = (date: moment.Moment) => {
    return date.isSame(moment(), 'day');
  };

  const isCurrentMonth = (date: moment.Moment) => {
    return date.month() === currentMonth.month();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };

  const handleDateClick = (date: moment.Moment) => {
    const dateStr = date.format('YYYY-MM-DD');
    const jadwalForDate = getGuruForDate(date);
    if (jadwalForDate.length > 0) {
      setSelectedDate(dateStr);
      toggleDate(dateStr);
      // Scroll to the date section
      setTimeout(() => {
        const element = document.getElementById(`date-${dateStr}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const calendar = generateCalendar();

  return (
    <>
      {/* Stats Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <p className="text-sm text-slate-600 font-medium">Total Jadwal Aktif</p>
            <p className="text-2xl font-bold text-slate-800">{jadwalList.length}</p>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 mb-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>📅</span> Kalender Jadwal
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Bulan Sebelumnya"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center min-w-[140px] sm:min-w-[180px]">
                <p className="text-base sm:text-lg font-bold text-slate-800">
                  {currentMonth.format('MMMM YYYY')}
                </p>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Bulan Berikutnya"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[280px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                  <div key={day} className="text-center text-xs sm:text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="space-y-1 sm:space-y-2">
                {calendar.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
                    {week.map((day, dayIndex) => {
                      const jadwalForDate = getGuruForDate(day);
                      const hasJadwal = jadwalForDate.length > 0;
                      const isCurrentMonthDay = isCurrentMonth(day);
                      const isTodayDay = isToday(day);
                      const dateStr = day.format('YYYY-MM-DD');
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => handleDateClick(day)}
                          disabled={!hasJadwal}
                          className={`
                            relative aspect-square p-1 sm:p-2 rounded-lg sm:rounded-xl text-center transition-all duration-200
                            ${!isCurrentMonthDay ? 'text-slate-300' : 'text-slate-800'}
                            ${isTodayDay ? 'ring-2 ring-blue-500' : ''}
                            ${hasJadwal ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                            ${isSelected ? 'ring-2 ring-green-500' : ''}
                            ${hasJadwal && isCurrentMonthDay
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100'
                              : 'bg-slate-50'
                            }
                          `}
                        >
                          <div className="text-xs sm:text-sm font-semibold mb-0.5">
                            {day.format('D')}
                          </div>
                          {hasJadwal && isCurrentMonthDay && (
                            <div className="text-[8px] sm:text-[10px] leading-tight">
                              <div className="flex flex-col gap-0.5">
                                {jadwalForDate.slice(0, 2).map((jadwal, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-green-500 text-white px-1 rounded truncate font-medium"
                                    title={jadwal.guru}
                                  >
                                    {jadwal.guru.length > 6 ? jadwal.guru.substring(0, 6) + '.' : jadwal.guru}
                                  </div>
                                ))}
                                {jadwalForDate.length > 2 && (
                                  <div className="text-green-600 font-bold text-[9px] sm:text-[11px]">
                                    +{jadwalForDate.length - 2}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-blue-500"></div>
                <span className="text-slate-600">Hari Ini</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"></div>
                <span className="text-slate-600">Ada Jadwal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-500"></div>
                <span className="text-slate-600">Dipilih</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 md:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>📋</span> Daftar Jadwal
        </h2>

        {jadwalList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-500 text-lg">Belum ada jadwal dibuat</p>
            <p className="text-slate-400 text-sm mt-2">Buat jadwal baru melalui tab "Buat Jadwal"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedJadwal).map((tanggal) => (
              <div key={tanggal} id={`date-${tanggal}`} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                {/* Date Header */}
                <button
                  onClick={() => toggleDate(tanggal)}
                  className="w-full bg-gradient-to-r from-green-50 to-emerald-50 p-4 flex items-center justify-between hover:from-green-100 hover:to-emerald-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                      📅
                    </div>
                    <div className="text-left">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        {moment(tanggal).format("dddd, DD MMMM YYYY")}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {Object.keys(groupedJadwal[tanggal]).length} kode absensi
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-slate-600 transition-transform ${expandedDates.has(tanggal) ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded Content */}
                {expandedDates.has(tanggal) && (
                  <div className="p-4 space-y-4 bg-white">
                    {Object.keys(groupedJadwal[tanggal]).map((kode) => (
                      <div key={kode} className="border border-slate-200 rounded-lg p-4">
                        {/* Code Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎟️</span>
                            <span className="font-mono font-bold text-lg text-green-600">{kode}</span>
                            <span className="text-xs text-slate-500">
                              ({groupedJadwal[tanggal][kode].length} guru)
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteByCode(kode, tanggal)}
                            className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2"
                          >
                            <span>🗑️</span>
                            <span>Hapus Semua</span>
                          </button>
                        </div>

                        {/* Guru List */}
                        <div className="space-y-2">
                          {groupedJadwal[tanggal][kode].map((jadwal) => (
                            <div
                              key={jadwal.id}
                              className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">👨‍🏫</span>
                                <span className="font-medium text-slate-800">{jadwal.guru.toUpperCase()}</span>
                              </div>
                              <button
                                onClick={() => handleDelete(jadwal.id)}
                                disabled={deleting === jadwal.id}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                              >
                                {deleting === jadwal.id ? "..." : "Hapus"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-yellow-400 text-xl flex-shrink-0">⚠️</div>
          <div>
            <h3 className="text-yellow-800 font-semibold mb-1">Perhatian</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Penghapusan jadwal bersifat permanen</li>
              <li>• Menghapus jadwal dengan "Hapus Semua" akan menghapus semua guru dalam kode tersebut</li>
              <li>• Pastikan untuk memverifikasi sebelum menghapus</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
