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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      game_rooms: {
        Row: {
          code: string
          created_at: string
          current_round: number | null
          difficulty: string
          guest_finished: boolean
          guest_name: string | null
          guest_ready: boolean | null
          guest_score: number | null
          guest_secret: string | null
          host_finished: boolean
          host_name: string
          host_ready: boolean | null
          host_score: number | null
          host_secret: string | null
          id: string
          mode: string
          seed: number
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          current_round?: number | null
          difficulty?: string
          guest_finished?: boolean
          guest_name?: string | null
          guest_ready?: boolean | null
          guest_score?: number | null
          guest_secret?: string | null
          host_finished?: boolean
          host_name: string
          host_ready?: boolean | null
          host_score?: number | null
          host_secret?: string | null
          id?: string
          mode?: string
          seed: number
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_round?: number | null
          difficulty?: string
          guest_finished?: boolean
          guest_name?: string | null
          guest_ready?: boolean | null
          guest_score?: number | null
          guest_secret?: string | null
          host_finished?: boolean
          host_name?: string
          host_ready?: boolean | null
          host_score?: number | null
          host_secret?: string | null
          id?: string
          mode?: string
          seed?: number
          status?: string
        }
        Relationships: []
      }
      player_data: {
        Row: {
          user_id: string
          stats: Json
          history: Json
          energy: Json
          premium: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          stats?: Json
          history?: Json
          energy?: Json
          premium?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          stats?: Json
          history?: Json
          energy?: Json
          premium?: Json
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          initials: string
          mode: string
          score: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          difficulty: string
          id?: string
          initials: string
          mode?: string
          score: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          initials?: string
          mode?: string
          score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string
          created_at: string
          display_name: string
          id: string
          xp_legacy: number
        }
        Insert: {
          avatar?: string
          created_at?: string
          display_name?: string
          id: string
          xp_legacy?: number
        }
        Update: {
          avatar?: string
          created_at?: string
          display_name?: string
          id?: string
          xp_legacy?: number
        }
        Relationships: []
      }
      game_results: {
        Row: {
          avg_distance_km: number | null
          challenge_id: string | null
          client_id: string | null
          created_at: string
          difficulty: string
          end_reason: string
          game_type: string
          id: string
          is_record: boolean
          mode: string
          rounds_played: number
          rounds_total: number
          score: number
          seed: number | null
          user_id: string
        }
        Insert: {
          avg_distance_km?: number | null
          challenge_id?: string | null
          client_id?: string | null
          created_at?: string
          difficulty: string
          end_reason?: string
          game_type: string
          id?: string
          is_record?: boolean
          mode: string
          rounds_played?: number
          rounds_total?: number
          score: number
          seed?: number | null
          user_id: string
        }
        Update: {
          avg_distance_km?: number | null
          challenge_id?: string | null
          client_id?: string | null
          created_at?: string
          difficulty?: string
          end_reason?: string
          game_type?: string
          id?: string
          is_record?: boolean
          mode?: string
          rounds_played?: number
          rounds_total?: number
          score?: number
          seed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      game_rounds: {
        Row: {
          base_points: number | null
          city_country: string | null
          city_lat: number | null
          city_lon: number | null
          city_name: string
          click_lat: number | null
          click_lon: number | null
          distance_km: number | null
          extra: Json | null
          multiplier: number | null
          points: number
          result_id: string
          round_no: number
          time_s: number | null
        }
        Insert: {
          base_points?: number | null
          city_country?: string | null
          city_lat?: number | null
          city_lon?: number | null
          city_name: string
          click_lat?: number | null
          click_lon?: number | null
          distance_km?: number | null
          extra?: Json | null
          multiplier?: number | null
          points?: number
          result_id: string
          round_no: number
          time_s?: number | null
        }
        Update: {
          base_points?: number | null
          city_country?: string | null
          city_lat?: number | null
          city_lon?: number | null
          city_name?: string
          click_lat?: number | null
          click_lon?: number | null
          distance_km?: number | null
          extra?: Json | null
          multiplier?: number | null
          points?: number
          result_id?: string
          round_no?: number
          time_s?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string
          p256dh: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint: string
          p256dh?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string
          p256dh?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          flags: Json
          id: number
          updated_at: string
        }
        Insert: {
          flags?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          flags?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      game_rooms_public: {
        Row: {
          code: string | null
          created_at: string | null
          current_round: number | null
          difficulty: string | null
          guest_finished: boolean | null
          guest_name: string | null
          guest_ready: boolean | null
          guest_score: number | null
          host_finished: boolean | null
          host_name: string | null
          host_ready: boolean | null
          host_score: number | null
          id: string | null
          mode: string | null
          seed: number | null
          status: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          current_round?: number | null
          difficulty?: string | null
          guest_finished?: boolean | null
          guest_name?: string | null
          guest_ready?: boolean | null
          guest_score?: number | null
          host_finished?: boolean | null
          host_name?: string | null
          host_ready?: boolean | null
          host_score?: number | null
          id?: string | null
          mode?: string | null
          seed?: number | null
          status?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          current_round?: number | null
          difficulty?: string | null
          guest_finished?: boolean | null
          guest_name?: string | null
          guest_ready?: boolean | null
          guest_score?: number | null
          host_finished?: boolean | null
          host_name?: string | null
          host_ready?: boolean | null
          host_score?: number | null
          id?: string | null
          mode?: string | null
          seed?: number | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      save_game_result: {
        Args: { p: Json }
        Returns: string
      }
      import_legacy_history: {
        Args: { p: Json }
        Returns: number
      }
      my_progress: {
        Args: Record<string, never>
        Returns: {
          games_played: number
          best_score: number
          total_xp: number
          total_rounds: number
          avg_distance_km: number | null
        }[]
      }
      my_rank: {
        Args: { p_mode?: string; p_difficulty?: string | null; p_period?: string; p_game_type?: string | null; p_season?: string }
        Returns: {
          rank: number | null
          best_score: number | null
          total_players: number
        }[]
      }
      leaderboard_top: {
        Args: { p_mode?: string; p_difficulty?: string | null; p_period?: string; p_limit?: number; p_game_type?: string | null; p_season?: string }
        Returns: {
          rank: number
          user_id: string
          display_name: string
          avatar: string
          best_score: number
          achieved_at: string
        }[]
      }
      update_my_profile: {
        Args: { p_display_name?: string | null; p_avatar?: string | null }
        Returns: undefined
      }
      create_transfer_ticket: {
        Args: Record<string, never>
        Returns: string
      }
      redeem_transfer_ticket: {
        Args: { p_ticket: string }
        Returns: Json
      }
      my_entitlements: {
        Args: Record<string, never>
        Returns: Json
      }
      claim_purchased_lives: {
        Args: Record<string, never>
        Returns: number
      }
      delete_my_account: {
        Args: Record<string, never>
        Returns: undefined
      }
      register_push_subscription: {
        Args: { p_endpoint: string; p_p256dh: string | null; p_auth: string | null }
        Returns: undefined
      }
      challenge_create: {
        Args: { p: Json }
        Returns: Json
      }
      challenge_preview: {
        Args: { p_code: string }
        Returns: Json
      }
      challenge_join: {
        Args: { p_code: string }
        Returns: Json
      }
      challenge_detail: {
        Args: { p_id: string }
        Returns: Json
      }
      my_challenges: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          code: string
          mode: string
          difficulty: string
          status: string
          created_at: string
          completed_at: string | null
          rounds_total: number
          is_rematch: boolean
          my_role: string
          state: string
          rival_name: string | null
          rival_avatar: string | null
          rival_finished: boolean
          my_score: number | null
          rival_score: number | null
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
    Enums: {},
  },
} as const
