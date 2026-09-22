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
      accounts: {
        Row: {
          created_at: string | null
          display_name: string | null
          email_address: string
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email_address: string
          id?: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          draft_id: string | null
          email_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          draft_id?: string | null
          email_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          draft_id?: string | null
          email_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          ai_generated_text: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          draft_type: string
          edited_text: string | null
          email_id: string
          id: string
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          ai_generated_text?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          draft_type?: string
          edited_text?: string | null
          email_id: string
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          ai_generated_text?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          draft_type?: string
          edited_text?: string | null
          email_id?: string
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: true
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          account_id: string
          body_html: string | null
          body_text: string | null
          /** @deprecated Superseded by `theme` as of the theme-routing migration. Historical rows only — do not read for new logic. */
          category: string | null
          created_at: string | null
          from_address: string
          from_name: string | null
          id: string
          message_id: string
          received_at: string
          /** @deprecated Superseded by `routed_roles` (array) as of the theme-routing migration. Historical rows only — do not read for new logic. */
          routed_role: string | null
          routed_roles: string[] | null
          status: string
          subject: string | null
          theme: string | null
          thread_id: string | null
          urgency: string | null
        }
        Insert: {
          account_id: string
          body_html?: string | null
          body_text?: string | null
          /** @deprecated Superseded by `theme` as of the theme-routing migration. Historical rows only — do not write. */
          category?: string | null
          created_at?: string | null
          from_address: string
          from_name?: string | null
          id?: string
          message_id: string
          received_at: string
          /** @deprecated Superseded by `routed_roles` (array) as of the theme-routing migration. Historical rows only — do not write. */
          routed_role?: string | null
          routed_roles?: string[] | null
          status?: string
          subject?: string | null
          theme?: string | null
          thread_id?: string | null
          urgency?: string | null
        }
        Update: {
          account_id?: string
          body_html?: string | null
          body_text?: string | null
          /** @deprecated Superseded by `theme` as of the theme-routing migration. Historical rows only — do not write. */
          category?: string | null
          created_at?: string | null
          from_address?: string
          from_name?: string | null
          id?: string
          message_id?: string
          received_at?: string
          /** @deprecated Superseded by `routed_roles` (array) as of the theme-routing migration. Historical rows only — do not write. */
          routed_role?: string | null
          routed_roles?: string[] | null
          status?: string
          subject?: string | null
          theme?: string | null
          thread_id?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
