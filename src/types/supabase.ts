export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      behavioral_questions: {
        Row: {
          created_at: string | null
          id: string
          question: string
          sample_response: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question: string
          sample_response: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question?: string
          sample_response?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          action_score: number | null
          created_at: string
          id: string
          rating: number | null
          response_id: string
          result_score: number | null
          score: number
          situation_score: number | null
          task_score: number | null
          text: string
        }
        Insert: {
          action_score?: number | null
          created_at?: string
          id?: string
          rating?: number | null
          response_id: string
          result_score?: number | null
          score: number
          situation_score?: number | null
          task_score?: number | null
          text: string
        }
        Update: {
          action_score?: number | null
          created_at?: string
          id?: string
          rating?: number | null
          response_id?: string
          result_score?: number | null
          score?: number
          situation_score?: number | null
          task_score?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          difficulty: string | null
          id: string
          sample_response: string | null
          text: string
          type: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          id?: string
          sample_response?: string | null
          text: string
          type: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          id?: string
          sample_response?: string | null
          text?: string
          type?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          action: string | null
          audio_url: string | null
          created_at: string
          id: string
          notes: Json | null
          question_id: string
          result: string | null
          situation: string | null
          task: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          audio_url?: string | null
          created_at?: string
          id?: string
          notes?: Json | null
          question_id: string
          result?: string | null
          situation?: string | null
          task?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          audio_url?: string | null
          created_at?: string
          id?: string
          notes?: Json | null
          question_id?: string
          result?: string | null
          situation?: string | null
          task?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          end_date: string
          id: string
          perfect_response_limit: number | null
          perfect_responses_used: number | null
          plan_type: string
          question_limit: number | null
          start_date: string
          status: string | null
          stripe_subscription_id: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          end_date: string
          id?: string
          perfect_response_limit?: number | null
          perfect_responses_used?: number | null
          plan_type: string
          question_limit?: number | null
          start_date: string
          status?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          end_date?: string
          id?: string
          perfect_response_limit?: number | null
          perfect_responses_used?: number | null
          plan_type?: string
          question_limit?: number | null
          start_date?: string
          status?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          created_at: string
          id: string
          response_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          response_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          created_at: string | null
          id: string
          perfect_response_limit: number
          plan_type: string
          question_limit: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          perfect_response_limit?: number
          plan_type: string
          question_limit?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          perfect_response_limit?: number
          plan_type?: string
          question_limit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_stats: {
        Row: {
          count: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string | null
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_direct: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      ensure_usage_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_all_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
          role: string
        }[]
      }
      get_user_plan_and_limits: {
        Args: {
          user_id: string
        }
        Returns: {
          subscription_plan: string
          subscription_end_date: string
          role: string
          question_limit: number
          perfect_response_limit: number
          questions_used: number
          perfect_responses_used: number
        }[]
      }
      increment_usage_count: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      list_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
          role: string
        }[]
      }
      refresh_user_plan_data: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      reset_monthly_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_all_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          old_role: string
          new_role: string
        }[]
      }
      sync_user_immediately: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      sync_user_subscription: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      sync_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_users_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_role: {
        Args: {
          p_user_id: string
          p_role: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
