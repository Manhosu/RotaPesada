/**
 * Tipagens do banco Supabase — Rota Pesada.
 * GERADO via MCP do Supabase (generate_typescript_types) a partir do schema real.
 * Regenere com:  npx supabase gen types typescript --project-id ddgqhziniyuryguwzabx
 * Aliases convenientes ao final do arquivo.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      restrictions: {
        Row: {
          created_at: string
          geom: unknown
          id: number
          status: string
          street_name: string | null
          type: string
          value: number | null
        }
        Insert: {
          created_at?: string
          geom: unknown
          id?: never
          status?: string
          street_name?: string | null
          type: string
          value?: number | null
        }
        Update: {
          created_at?: string
          geom?: unknown
          id?: never
          status?: string
          street_name?: string | null
          type?: string
          value?: number | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          id: number
          user_id: string
          dest_label: string
          dest_lat: number
          dest_lng: number
          distance_m: number | null
          duration_s: number | null
          created_at: string
        }
        Insert: {
          id?: never
          user_id: string
          dest_label: string
          dest_lat: number
          dest_lng: number
          distance_m?: number | null
          duration_s?: number | null
          created_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          dest_label?: string
          dest_lat?: number
          dest_lng?: number
          distance_m?: number | null
          duration_s?: number | null
          created_at?: string
        }
        Relationships: []
      }
      truck_profiles: {
        Row: {
          axles: number
          created_at: string
          height: number
          id: string
          is_active: boolean
          length: number | null
          name: string
          user_id: string
          weight_pbt: number
          width: number | null
        }
        Insert: {
          axles: number
          created_at?: string
          height: number
          id?: string
          is_active?: boolean
          length?: number | null
          name: string
          user_id: string
          weight_pbt: number
          width?: number | null
        }
        Update: {
          axles?: number
          created_at?: string
          height?: number
          id?: string
          is_active?: boolean
          length?: number | null
          name?: string
          user_id?: string
          weight_pbt?: number
          width?: number | null
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          id: number
          photo_url: string | null
          restriction_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          photo_url?: string | null
          restriction_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          photo_url?: string | null
          restriction_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_restriction_id_fkey"
            columns: ["restriction_id"]
            isOneToOne: false
            referencedRelation: "restrictions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      restricoes_evitar_geojson: {
        Args: {
          min_lng: number
          min_lat: number
          max_lng: number
          max_lat: number
          altura_veiculo: number
          buffer_m?: number
          limite?: number
        }
        Returns: Json
      }
      confirmar_restricao: {
        Args: { restriction_id: number }
        Returns: { confirmacoes: number; verificada: boolean }[]
      }
      restricoes_na_rota: {
        Args: {
          rota_geojson: Json
          altura_veiculo: number
          buffer_m?: number
        }
        Returns: {
          distancia_m: number
          id: number
          status: string
          street_name: string
          type: string
          value: number
          longitude: number
          latitude: number
        }[]
      }
      reportar_perigo: {
        Args: {
          lat: number
          lng: number
          tipo?: string
          valor?: number
          via?: string
        }
        Returns: number
      }
      restricoes_proximas: {
        Args: {
          altura_veiculo?: number
          lat: number
          lng: number
          raio_m?: number
        }
        Returns: {
          distancia_m: number
          id: number
          latitude: number
          longitude: number
          status: string
          street_name: string
          type: string
          value: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/* ============================================================
   Aliases convenientes (mantidos à mão)
   ============================================================ */

/** Valores permitidos por CHECK constraints (texto no banco). */
export type RestrictionType = "altura" | "peso" | "largura" | "rodizio"
export type RestrictionStatus = "verificado" | "pendente_validacao"

export type TruckProfile = Database["public"]["Tables"]["truck_profiles"]["Row"]
export type TruckProfileInsert = Database["public"]["Tables"]["truck_profiles"]["Insert"]
export type TruckProfileUpdate = Database["public"]["Tables"]["truck_profiles"]["Update"]

export type Restriction = Database["public"]["Tables"]["restrictions"]["Row"]
export type RestrictionInsert = Database["public"]["Tables"]["restrictions"]["Insert"]

export type UserReport = Database["public"]["Tables"]["user_reports"]["Row"]

export type Trip = Database["public"]["Tables"]["trips"]["Row"]

/** Uma linha do retorno da RPC de proximidade (motor de alerta). */
export type RestricaoProxima =
  Database["public"]["Functions"]["restricoes_proximas"]["Returns"][number]

/** Restrição impeditiva encontrada ao longo de uma rota (avaliação de desvio). */
export type RestricaoNaRota =
  Database["public"]["Functions"]["restricoes_na_rota"]["Returns"][number]
