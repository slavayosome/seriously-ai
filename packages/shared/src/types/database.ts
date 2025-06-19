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
      user_profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          preferred_platform: Database["public"]["Enums"]["platform_type"]
          onboarding_completed: boolean
          referral_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          preferred_platform?: Database["public"]["Enums"]["platform_type"]
          onboarding_completed?: boolean
          referral_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          preferred_platform?: Database["public"]["Enums"]["platform_type"]
          onboarding_completed?: boolean
          referral_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_wallet: {
        Row: {
          id: string
          user_id: string
          balance: number
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          last_refill: string
          next_refill: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          last_refill?: string
          next_refill?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          last_refill?: string
          next_refill?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_wallet_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          balance_after: number
          operation_type: Database["public"]["Enums"]["operation_type"]
          description: string | null
          job_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          balance_after: number
          operation_type: Database["public"]["Enums"]["operation_type"]
          description?: string | null
          job_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          balance_after?: number
          operation_type?: Database["public"]["Enums"]["operation_type"]
          description?: string | null
          job_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      research_reports: {
        Row: {
          id: string
          user_id: string
          topic: string
          summary_md: string | null
          articles_scanned: number
          insight_count: number
          job_id: string | null
          expires_at: string
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          summary_md?: string | null
          articles_scanned?: number
          insight_count?: number
          job_id?: string | null
          expires_at?: string
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          summary_md?: string | null
          articles_scanned?: number
          insight_count?: number
          job_id?: string | null
          expires_at?: string
          generated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      insights: {
        Row: {
          id: string
          report_id: string
          user_id: string
          content_md: string
          citation_url: string | null
          citation_title: string | null
          citation_source: string | null
          embedding: string | null
          relevance_score: number | null
          saved_to_library: boolean
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          content_md: string
          citation_url?: string | null
          citation_title?: string | null
          citation_source?: string | null
          embedding?: string | null
          relevance_score?: number | null
          saved_to_library?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          content_md?: string
          citation_url?: string | null
          citation_title?: string | null
          citation_source?: string | null
          embedding?: string | null
          relevance_score?: number | null
          saved_to_library?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "research_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      drafts: {
        Row: {
          id: string
          user_id: string
          insight_ids: string[]
          template_id: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          content_md: string
          version: number
          job_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_ids: string[]
          template_id?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          content_md: string
          version?: number
          job_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          insight_ids?: string[]
          template_id?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          content_md?: string
          version?: number
          job_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      platform_type: "linkedin" | "x"
      plan_tier: "starter" | "plus" | "pro"
      operation_type: "refill" | "purchase" | "deduction"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never