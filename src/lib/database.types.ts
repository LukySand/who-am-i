export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chain_turns: {
        Row: {
          game_id: string
          player_id: string
          position: number
          resolved: boolean
          round_index: number
        }
        Insert: {
          game_id: string
          player_id: string
          position: number
          resolved?: boolean
          round_index: number
        }
        Update: {
          game_id?: string
          player_id?: string
          position?: number
          resolved?: boolean
          round_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "chain_turns_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_turns_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          answers: Json
          created_at: string
          game_id: string
          id: string
          player_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          game_id: string
          id?: string
          player_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          game_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_secrets: {
        Row: {
          card_order: string[]
          game_id: string
        }
        Insert: {
          card_order: string[]
          game_id: string
        }
        Update: {
          card_order?: string[]
          game_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_secrets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          code: string
          created_at: string
          field_index: number
          finished_at: string | null
          host_id: string
          host_plays: boolean
          id: string
          mode: Database["public"]["Enums"]["game_mode"]
          phase: Database["public"]["Enums"]["game_phase"]
          phase_ends_at: string | null
          round_index: number
          status: Database["public"]["Enums"]["game_status"]
          template_id: string
        }
        Insert: {
          code: string
          created_at?: string
          field_index?: number
          finished_at?: string | null
          host_id: string
          host_plays?: boolean
          id?: string
          mode: Database["public"]["Enums"]["game_mode"]
          phase?: Database["public"]["Enums"]["game_phase"]
          phase_ends_at?: string | null
          round_index?: number
          status?: Database["public"]["Enums"]["game_status"]
          template_id: string
        }
        Update: {
          code?: string
          created_at?: string
          field_index?: number
          finished_at?: string | null
          host_id?: string
          host_plays?: boolean
          id?: string
          mode?: Database["public"]["Enums"]["game_mode"]
          phase?: Database["public"]["Enums"]["game_phase"]
          phase_ends_at?: string | null
          round_index?: number
          status?: Database["public"]["Enums"]["game_status"]
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      guesses: {
        Row: {
          created_at: string
          game_id: string
          guessed_player_id: string | null
          guesser_id: string
          id: string
          is_correct: boolean
          round_index: number
        }
        Insert: {
          created_at?: string
          game_id: string
          guessed_player_id?: string | null
          guesser_id: string
          id?: string
          is_correct: boolean
          round_index: number
        }
        Update: {
          created_at?: string
          game_id?: string
          guessed_player_id?: string | null
          guesser_id?: string
          id?: string
          is_correct?: boolean
          round_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "guesses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guesses_guessed_player_id_fkey"
            columns: ["guessed_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guesses_guesser_id_fkey"
            columns: ["guesser_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          emoji: string
          game_id: string
          id: string
          is_host: boolean
          joined_at: string
          nickname: string
          plays: boolean
          score: number
          user_id: string | null
        }
        Insert: {
          emoji: string
          game_id: string
          id?: string
          is_host?: boolean
          joined_at?: string
          nickname: string
          plays?: boolean
          score?: number
          user_id?: string | null
        }
        Update: {
          emoji?: string
          game_id?: string
          id?: string
          is_host?: boolean
          joined_at?: string
          nickname?: string
          plays?: boolean
          score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          fields: Json
          id: string
          is_adhoc: boolean
          is_shared: boolean
          locale: string | null
          name: string
          owner_id: string | null
          time_limit_s: number | null
        }
        Insert: {
          created_at?: string
          fields: Json
          id?: string
          is_adhoc?: boolean
          is_shared?: boolean
          locale?: string | null
          name: string
          owner_id?: string | null
          time_limit_s?: number | null
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          is_adhoc?: boolean
          is_shared?: boolean
          locale?: string | null
          name?: string
          owner_id?: string | null
          time_limit_s?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_phase: { Args: { p_game_id: string }; Returns: undefined }
      blind_candidates: {
        Args: { p_game_id: string; p_player_id: string }
        Returns: string[]
      }
      build_chain: {
        Args: { p_game_id: string; p_round: number }
        Returns: undefined
      }
      card_author: {
        Args: { p_game_id: string; p_round: number }
        Returns: string
      }
      card_steps: {
        Args: { p_game_id: string; p_round: number }
        Returns: Json
      }
      close_round: {
        Args: { p_game_id: string; p_round: number }
        Returns: undefined
      }
      create_game: {
        Args: {
          p_emoji: string
          p_host_plays: boolean
          p_mode: Database["public"]["Enums"]["game_mode"]
          p_nickname: string
          p_template_id: string
        }
        Returns: Json
      }
      gen_code: { Args: never; Returns: string }
      get_game_state: { Args: { p_game_id: string }; Returns: Json }
      is_in_game: { Args: { p_game_id: string }; Returns: boolean }
      join_game: {
        Args: { p_code: string; p_emoji: string; p_nickname: string }
        Returns: Json
      }
      my_history: { Args: never; Returns: Json }
      my_player: {
        Args: { p_game_id: string }
        Returns: {
          emoji: string
          game_id: string
          id: string
          is_host: boolean
          joined_at: string
          nickname: string
          plays: boolean
          score: number
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      open_voting: { Args: { p_game_id: string }; Returns: undefined }
      participants: {
        Args: { p_game_id: string }
        Returns: {
          emoji: string
          game_id: string
          id: string
          is_host: boolean
          joined_at: string
          nickname: string
          plays: boolean
          score: number
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      podium: { Args: { p_game_id: string }; Returns: Json }
      require_registered: { Args: never; Returns: string }
      require_user: { Args: never; Returns: string }
      round_count: { Args: { p_game_id: string }; Returns: number }
      server_now: { Args: never; Returns: string }
      start_game: { Args: { p_game_id: string }; Returns: undefined }
      submit_entry: {
        Args: { p_answers: Json; p_game_id: string }
        Returns: undefined
      }
      submit_guess: {
        Args: { p_game_id: string; p_guess: string; p_round: number }
        Returns: Json
      }
    }
    Enums: {
      game_mode: "relampago" | "cadena" | "a_ciegas"
      game_phase: "reveal_fields" | "voting" | "result"
      game_status: "lobby" | "filling" | "playing" | "revealing" | "finished"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      game_mode: ["relampago", "cadena", "a_ciegas"],
      game_phase: ["reveal_fields", "voting", "result"],
      game_status: ["lobby", "filling", "playing", "revealing", "finished"],
    },
  },
} as const

