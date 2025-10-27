export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface User {
  id?: string;
  username: string;
  nama: string;
  asal: string;
  status: string;
  keterangan?: string;
  foto_profil?: string | null;
  foto_sampul?: string | null;
}

export interface Database {
  public: {
    Tables: {
      presensi: {
        Row: {
          id: string
          username: string
          nama: string
          tanggal: string
          waktu: string
          status_presensi: string
        }
        Insert: {
          id: string
          username: string
          nama: string
          tanggal: string
          waktu: string
          status_presensi: string
        }
        Update: {
          id?: string
          username?: string
          nama?: string
          tanggal?: string
          waktu?: string
          status_presensi?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
