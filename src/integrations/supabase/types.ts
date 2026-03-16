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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          activated: boolean
          code: string
          created_at: string
          display_name: string
          email: string
          extraction_limit: number
          id: string
          is_admin: boolean
        }
        Insert: {
          activated?: boolean
          code: string
          created_at?: string
          display_name: string
          email?: string
          extraction_limit?: number
          id?: string
          is_admin?: boolean
        }
        Update: {
          activated?: boolean
          code?: string
          created_at?: string
          display_name?: string
          email?: string
          extraction_limit?: number
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          offline_approved: boolean
          status: Database["public"]["Enums"]["access_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          offline_approved?: boolean
          status?: Database["public"]["Enums"]["access_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          offline_approved?: boolean
          status?: Database["public"]["Enums"]["access_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      airport_frequencies: {
        Row: {
          airport_ident: string
          airport_ref: number
          description: string
          frequency_mhz: number | null
          id: number
          type: string
        }
        Insert: {
          airport_ident?: string
          airport_ref: number
          description?: string
          frequency_mhz?: number | null
          id: number
          type?: string
        }
        Update: {
          airport_ident?: string
          airport_ref?: number
          description?: string
          frequency_mhz?: number | null
          id?: number
          type?: string
        }
        Relationships: []
      }
      airports: {
        Row: {
          continent: string
          elevation_ft: number | null
          gps_code: string
          iata_code: string
          icao_code: string
          id: number
          ident: string
          iso_country: string
          iso_region: string
          latitude_deg: number | null
          local_code: string
          longitude_deg: number | null
          municipality: string
          name: string
          scheduled_service: string
          type: string
        }
        Insert: {
          continent?: string
          elevation_ft?: number | null
          gps_code?: string
          iata_code?: string
          icao_code?: string
          id: number
          ident?: string
          iso_country?: string
          iso_region?: string
          latitude_deg?: number | null
          local_code?: string
          longitude_deg?: number | null
          municipality?: string
          name?: string
          scheduled_service?: string
          type?: string
        }
        Update: {
          continent?: string
          elevation_ft?: number | null
          gps_code?: string
          iata_code?: string
          icao_code?: string
          id?: number
          ident?: string
          iso_country?: string
          iso_region?: string
          latitude_deg?: number | null
          local_code?: string
          longitude_deg?: number | null
          municipality?: string
          name?: string
          scheduled_service?: string
          type?: string
        }
        Relationships: []
      }
      column_templates: {
        Row: {
          column_mapping: Json
          created_at: string
          id: string
          name: string
          source_headers: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          column_mapping?: Json
          created_at?: string
          id?: string
          name?: string
          source_headers?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          column_mapping?: Json
          created_at?: string
          id?: string
          name?: string
          source_headers?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_requests: {
        Row: {
          admin_note: string
          approved_amount: number | null
          created_at: string
          id: string
          requested_amount: number
          status: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          admin_note?: string
          approved_amount?: number | null
          created_at?: string
          id?: string
          requested_amount?: number
          status?: string
          updated_at?: string
          user_id: string
          user_name?: string
        }
        Update: {
          admin_note?: string
          approved_amount?: number | null
          created_at?: string
          id?: string
          requested_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      flight_plans: {
        Row: {
          aircraft_reg: string
          aircraft_type: string
          created_at: string
          fuel_burn_rate: number
          fuel_on_board: number
          ground_speed: number
          id: string
          name: string
          notes: string
          pilot_in_command: string
          reserve_fuel: number
          updated_at: string
          user_id: string
          waypoints: Json
        }
        Insert: {
          aircraft_reg?: string
          aircraft_type?: string
          created_at?: string
          fuel_burn_rate?: number
          fuel_on_board?: number
          ground_speed?: number
          id?: string
          name?: string
          notes?: string
          pilot_in_command?: string
          reserve_fuel?: number
          updated_at?: string
          user_id: string
          waypoints?: Json
        }
        Update: {
          aircraft_reg?: string
          aircraft_type?: string
          created_at?: string
          fuel_burn_rate?: number
          fuel_on_board?: number
          ground_speed?: number
          id?: string
          name?: string
          notes?: string
          pilot_in_command?: string
          reserve_fuel?: number
          updated_at?: string
          user_id?: string
          waypoints?: Json
        }
        Relationships: []
      }
      logbook_entries: {
        Row: {
          aircraft_reg: string
          aircraft_type: string
          created_at: string
          date: string
          flight_details: string
          id: string
          instructor_day: number
          instructor_night: number
          instrument_nav_aids: number
          instrument_place: number
          instrument_time: number
          pilot_in_command: string
          se_day_dual: number
          se_day_pilot: number
          se_night_dual: number
          se_night_pilot: number
          user_id: string
        }
        Insert: {
          aircraft_reg?: string
          aircraft_type?: string
          created_at?: string
          date?: string
          flight_details?: string
          id?: string
          instructor_day?: number
          instructor_night?: number
          instrument_nav_aids?: number
          instrument_place?: number
          instrument_time?: number
          pilot_in_command?: string
          se_day_dual?: number
          se_day_pilot?: number
          se_night_dual?: number
          se_night_pilot?: number
          user_id: string
        }
        Update: {
          aircraft_reg?: string
          aircraft_type?: string
          created_at?: string
          date?: string
          flight_details?: string
          id?: string
          instructor_day?: number
          instructor_night?: number
          instrument_nav_aids?: number
          instrument_place?: number
          instrument_time?: number
          pilot_in_command?: string
          se_day_dual?: number
          se_day_pilot?: number
          se_night_dual?: number
          se_night_pilot?: number
          user_id?: string
        }
        Relationships: []
      }
      navaids: {
        Row: {
          associated_airport: string
          dme_channel: string
          dme_frequency_khz: number | null
          elevation_ft: number | null
          frequency_khz: number | null
          id: number
          ident: string
          iso_country: string
          latitude_deg: number | null
          longitude_deg: number | null
          magnetic_variation_deg: number | null
          name: string
          power: string
          type: string
          usage_type: string
        }
        Insert: {
          associated_airport?: string
          dme_channel?: string
          dme_frequency_khz?: number | null
          elevation_ft?: number | null
          frequency_khz?: number | null
          id: number
          ident?: string
          iso_country?: string
          latitude_deg?: number | null
          longitude_deg?: number | null
          magnetic_variation_deg?: number | null
          name?: string
          power?: string
          type?: string
          usage_type?: string
        }
        Update: {
          associated_airport?: string
          dme_channel?: string
          dme_frequency_khz?: number | null
          elevation_ft?: number | null
          frequency_khz?: number | null
          id?: number
          ident?: string
          iso_country?: string
          latitude_deg?: number | null
          longitude_deg?: number | null
          magnetic_variation_deg?: number | null
          name?: string
          power?: string
          type?: string
          usage_type?: string
        }
        Relationships: []
      }
      runways: {
        Row: {
          airport_ident: string
          airport_ref: number
          closed: boolean
          he_heading_degt: number | null
          he_ident: string
          id: number
          le_heading_degt: number | null
          le_ident: string
          length_ft: number | null
          lighted: boolean
          surface: string
          width_ft: number | null
        }
        Insert: {
          airport_ident?: string
          airport_ref: number
          closed?: boolean
          he_heading_degt?: number | null
          he_ident?: string
          id: number
          le_heading_degt?: number | null
          le_ident?: string
          length_ft?: number | null
          lighted?: boolean
          surface?: string
          width_ft?: number | null
        }
        Update: {
          airport_ident?: string
          airport_ref?: number
          closed?: boolean
          he_heading_degt?: number | null
          he_ident?: string
          id?: number
          le_heading_degt?: number | null
          le_ident?: string
          length_ft?: number | null
          lighted?: boolean
          surface?: string
          width_ft?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      access_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
