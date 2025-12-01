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
  is_admin?: boolean;
  password?: string;
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
      absensi: {
        Row: {
          id: string
          username: string
          nama: string
          tanggal: string
          status: string
          foto_profil?: string | null
          foto_izin?: string | null
          keterangan?: string | null
          created_at?: string
        }
        Insert: {
          username: string
          nama: string
          tanggal: string
          status: string
          foto_profil?: string | null
          foto_izin?: string | null
          keterangan?: string | null
        }
        Update: {
          username?: string
          nama?: string
          tanggal?: string
          status?: string
          foto_profil?: string | null
          foto_izin?: string | null
          keterangan?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
