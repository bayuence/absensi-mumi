    export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json }
    | Json[]

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
