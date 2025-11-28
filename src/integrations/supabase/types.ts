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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_audit_admin_user"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          revoked_at: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          allowed_ips: string[] | null
          assigned_at: string
          assigned_by: string | null
          created_at: string
          failed_login_attempts: number | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_login_ip: unknown
          locked_until: string | null
          mfa_enabled: boolean | null
          mfa_secret_encrypted: string | null
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          mfa_enabled?: boolean | null
          mfa_secret_encrypted?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          mfa_enabled?: boolean | null
          mfa_secret_encrypted?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          conversation_stage: string | null
          created_at: string | null
          current_page: string | null
          helpful_responses: number | null
          id: string
          last_message_at: string | null
          last_topic: string | null
          messages_count: number | null
          session_id: string
          updated_at: string | null
          user_id: string | null
          user_intent: string | null
        }
        Insert: {
          conversation_stage?: string | null
          created_at?: string | null
          current_page?: string | null
          helpful_responses?: number | null
          id?: string
          last_message_at?: string | null
          last_topic?: string | null
          messages_count?: number | null
          session_id: string
          updated_at?: string | null
          user_id?: string | null
          user_intent?: string | null
        }
        Update: {
          conversation_stage?: string | null
          created_at?: string | null
          current_page?: string | null
          helpful_responses?: number | null
          id?: string
          last_message_at?: string | null
          last_topic?: string | null
          messages_count?: number | null
          session_id?: string
          updated_at?: string | null
          user_id?: string | null
          user_intent?: string | null
        }
        Relationships: []
      }
      ai_knowledge_base: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          helpfulness_score: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          priority: number | null
          question: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string | null
          helpfulness_score?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          helpfulness_score?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          feedback_text: string | null
          id: string
          page_context: string | null
          response_time_ms: number | null
          role: string
          tokens_used: number | null
          user_state: Json | null
          was_helpful: boolean | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          page_context?: string | null
          response_time_ms?: number | null
          role: string
          tokens_used?: number | null
          user_state?: Json | null
          was_helpful?: boolean | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          page_context?: string | null
          response_time_ms?: number | null
          role?: string
          tokens_used?: number | null
          user_state?: Json | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_metrics: {
        Row: {
          calculated_at: string
          dimensions: Json | null
          id: string
          metric_category: string
          metric_name: string
          metric_value: number
          period_end: string
          period_start: string
        }
        Insert: {
          calculated_at?: string
          dimensions?: Json | null
          id?: string
          metric_category: string
          metric_name: string
          metric_value: number
          period_end: string
          period_start: string
        }
        Update: {
          calculated_at?: string
          dimensions?: Json | null
          id?: string
          metric_category?: string
          metric_name?: string
          metric_value?: number
          period_end?: string
          period_start?: string
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          badge_key: string
          category: string
          color_primary: string
          color_secondary: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean | null
          level: number
          name: string
          requirement_threshold: number | null
          requirement_type: string
        }
        Insert: {
          badge_key: string
          category: string
          color_primary: string
          color_secondary: string
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean | null
          level?: number
          name: string
          requirement_threshold?: number | null
          requirement_type: string
        }
        Update: {
          badge_key?: string
          category?: string
          color_primary?: string
          color_secondary?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          requirement_threshold?: number | null
          requirement_type?: string
        }
        Relationships: []
      }
      birthday_celebrations: {
        Row: {
          age_at_celebration: number | null
          celebrated_at: string
          celebration_year: number
          created_at: string
          id: string
          milestone_age: boolean | null
          user_id: string
        }
        Insert: {
          age_at_celebration?: number | null
          celebrated_at?: string
          celebration_year: number
          created_at?: string
          id?: string
          milestone_age?: boolean | null
          user_id: string
        }
        Update: {
          age_at_celebration?: number | null
          celebrated_at?: string
          celebration_year?: number
          created_at?: string
          id?: string
          milestone_age?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          corrections_message: string | null
          created_at: string
          delivery_settings: Json | null
          delivery_zones: Json | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          opening_hours: Json | null
          payment_info: Json | null
          phone: string | null
          rejection_date: string | null
          rejection_reason: string | null
          resubmission_count: number | null
          status: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          corrections_message?: string | null
          created_at?: string
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          payment_info?: Json | null
          phone?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          resubmission_count?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          corrections_message?: string | null
          created_at?: string
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          payment_info?: Json | null
          phone?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          resubmission_count?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      business_categories: {
        Row: {
          business_owner_id: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          business_owner_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          business_owner_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_collective_funds: {
        Row: {
          auto_notifications: boolean | null
          beneficiary_user_id: string
          business_id: string
          created_at: string | null
          fund_id: string
          id: string
          notification_schedule: Json | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          auto_notifications?: boolean | null
          beneficiary_user_id: string
          business_id: string
          created_at?: string | null
          fund_id: string
          id?: string
          notification_schedule?: Json | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          auto_notifications?: boolean | null
          beneficiary_user_id?: string
          business_id?: string
          created_at?: string | null
          fund_id?: string
          id?: string
          notification_schedule?: Json | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_collective_funds_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_collective_funds_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: true
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_collective_funds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          commune: string | null
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          commune?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          commune?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_orders: {
        Row: {
          beneficiary_phone: string
          business_account_id: string
          created_at: string
          currency: string
          delivery_address: string
          donor_phone: string
          fund_id: string | null
          id: string
          order_summary: Json
          payment_method: string
          processed_at: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          beneficiary_phone: string
          business_account_id: string
          created_at?: string
          currency?: string
          delivery_address: string
          donor_phone: string
          fund_id?: string | null
          id?: string
          order_summary?: Json
          payment_method?: string
          processed_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          beneficiary_phone?: string
          business_account_id?: string
          created_at?: string
          currency?: string
          delivery_address?: string
          donor_phone?: string
          fund_id?: string | null
          id?: string
          order_summary?: Json
          payment_method?: string
          processed_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_orders_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_orders_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      business_registration_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          business_account_id: string | null
          business_email: string | null
          business_name: string
          business_type: string | null
          created_at: string | null
          id: string
          rejection_reason: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          business_account_id?: string | null
          business_email?: string | null
          business_name: string
          business_type?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          business_account_id?: string | null
          business_email?: string | null
          business_name?: string
          business_type?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_registration_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          created_at: string | null
          delivery_settings: Json | null
          delivery_zones: Json | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          opening_hours: Json | null
          payment_info: Json | null
          phone: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          created_at?: string | null
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          payment_info?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          created_at?: string | null
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          payment_info?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          name_fr: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          name_fr: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_fr?: string
        }
        Relationships: []
      }
      collective_fund_orders: {
        Row: {
          beneficiary_phone: string
          created_at: string
          creator_id: string
          currency: string
          delivery_address: string
          donor_phone: string
          fund_id: string
          id: string
          order_summary: Json
          payment_method: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          beneficiary_phone: string
          created_at?: string
          creator_id: string
          currency?: string
          delivery_address: string
          donor_phone: string
          fund_id: string
          id?: string
          order_summary?: Json
          payment_method?: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          beneficiary_phone?: string
          created_at?: string
          creator_id?: string
          currency?: string
          delivery_address?: string
          donor_phone?: string
          fund_id?: string
          id?: string
          order_summary?: Json
          payment_method?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collective_fund_orders_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_funds: {
        Row: {
          allow_anonymous_contributions: boolean | null
          beneficiary_contact_id: string | null
          business_product_id: string | null
          created_at: string
          created_by_business_id: string | null
          creator_id: string
          currency: string | null
          current_amount: number | null
          deadline_date: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_surprise: boolean | null
          occasion: string | null
          share_token: string | null
          status: string | null
          surprise_message: string | null
          surprise_reveal_date: string | null
          surprise_song_prompt: string | null
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          allow_anonymous_contributions?: boolean | null
          beneficiary_contact_id?: string | null
          business_product_id?: string | null
          created_at?: string
          created_by_business_id?: string | null
          creator_id: string
          currency?: string | null
          current_amount?: number | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_surprise?: boolean | null
          occasion?: string | null
          share_token?: string | null
          status?: string | null
          surprise_message?: string | null
          surprise_reveal_date?: string | null
          surprise_song_prompt?: string | null
          target_amount: number
          title: string
          updated_at?: string
        }
        Update: {
          allow_anonymous_contributions?: boolean | null
          beneficiary_contact_id?: string | null
          business_product_id?: string | null
          created_at?: string
          created_by_business_id?: string | null
          creator_id?: string
          currency?: string | null
          current_amount?: number | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_surprise?: boolean | null
          occasion?: string | null
          share_token?: string | null
          status?: string | null
          surprise_message?: string | null
          surprise_reveal_date?: string | null
          surprise_song_prompt?: string | null
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collective_funds_beneficiary_contact_id_fkey"
            columns: ["beneficiary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_funds_beneficiary_contact_id_fkey"
            columns: ["beneficiary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_limited"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_funds_business_product_id_fkey"
            columns: ["business_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_funds_created_by_business_id_fkey"
            columns: ["created_by_business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_funds_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "collective_funds_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      community_scores: {
        Row: {
          badge_level: string
          created_at: string
          funds_created_count: number
          gifts_given_count: number
          id: string
          last_updated: string
          posts_count: number
          rank_position: number | null
          reactions_received: number
          total_points: number
          user_id: string
        }
        Insert: {
          badge_level?: string
          created_at?: string
          funds_created_count?: number
          gifts_given_count?: number
          id?: string
          last_updated?: string
          posts_count?: number
          rank_position?: number | null
          reactions_received?: number
          total_points?: number
          user_id: string
        }
        Update: {
          badge_level?: string
          created_at?: string
          funds_created_count?: number
          gifts_given_count?: number
          id?: string
          last_updated?: string
          posts_count?: number
          rank_position?: number | null
          reactions_received?: number
          total_points?: number
          user_id?: string
        }
        Relationships: []
      }
      contact_events: {
        Row: {
          contact_id: string
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          is_recurring: boolean | null
          title: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          is_recurring?: boolean | null
          title: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_limited"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_relationships: {
        Row: {
          can_see_events: boolean | null
          can_see_funds: boolean | null
          created_at: string
          established_at: string
          id: string
          relationship_type: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          can_see_events?: boolean | null
          can_see_funds?: boolean | null
          created_at?: string
          established_at?: string
          id?: string
          relationship_type?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          can_see_events?: boolean | null
          can_see_funds?: boolean | null
          created_at?: string
          established_at?: string
          id?: string
          relationship_type?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          expires_at: string
          id: string
          message: string | null
          metadata: Json | null
          requested_at: string
          requester_id: string
          responded_at: string | null
          status: string
          target_id: string
        }
        Insert: {
          expires_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          requested_at?: string
          requester_id: string
          responded_at?: string | null
          status?: string
          target_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          requested_at?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          coordinates: Json
          created_at: string
          delivery_fee: number | null
          estimated_time: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
          zone_name: string
        }
        Insert: {
          coordinates: Json
          created_at?: string
          delivery_fee?: number | null
          estimated_time?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
          zone_name: string
        }
        Update: {
          coordinates?: Json
          created_at?: string
          delivery_fee?: number | null
          estimated_time?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "delivery_zones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      event_popularity_reports: {
        Row: {
          avg_contributors: number | null
          avg_fund_amount: number | null
          created_at: string
          event_type: string
          id: string
          occasion: string | null
          period_end: string
          period_start: string
          success_rate: number | null
          total_amount_raised: number | null
          total_funds_created: number | null
        }
        Insert: {
          avg_contributors?: number | null
          avg_fund_amount?: number | null
          created_at?: string
          event_type: string
          id?: string
          occasion?: string | null
          period_end: string
          period_start: string
          success_rate?: number | null
          total_amount_raised?: number | null
          total_funds_created?: number | null
        }
        Update: {
          avg_contributors?: number | null
          avg_fund_amount?: number | null
          created_at?: string
          event_type?: string
          id?: string
          occasion?: string | null
          period_end?: string
          period_start?: string
          success_rate?: number | null
          total_amount_raised?: number | null
          total_funds_created?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          accept_alternatives: boolean | null
          context_usage: string[] | null
          created_at: string | null
          id: string
          notes: string | null
          occasion_type: string | null
          priority_level: string | null
          product_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accept_alternatives?: boolean | null
          context_usage?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          occasion_type?: string | null
          priority_level?: string | null
          product_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accept_alternatives?: boolean | null
          context_usage?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          occasion_type?: string | null
          priority_level?: string | null
          product_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fund_activities: {
        Row: {
          activity_type: string
          amount: number | null
          contributor_id: string | null
          created_at: string
          currency: string | null
          fund_id: string
          id: string
          message: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          amount?: number | null
          contributor_id?: string | null
          created_at?: string
          currency?: string | null
          fund_id: string
          id?: string
          message: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          amount?: number | null
          contributor_id?: string | null
          created_at?: string
          currency?: string | null
          fund_id?: string
          id?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_activities_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_comments: {
        Row: {
          content: string
          created_at: string
          fund_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          fund_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          fund_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_comments_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_contributions: {
        Row: {
          amount: number
          contributor_id: string
          created_at: string
          currency: string | null
          fund_id: string
          id: string
          is_anonymous: boolean | null
          message: string | null
        }
        Insert: {
          amount: number
          contributor_id: string
          created_at?: string
          currency?: string | null
          fund_id: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
        }
        Update: {
          amount?: number
          contributor_id?: string
          created_at?: string
          currency?: string | null
          fund_id?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_contributions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fund_contributions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "fund_contributions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_promises: {
        Row: {
          created_at: string
          id: string
          is_notified: boolean | null
          post_author_id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_notified?: boolean | null
          post_author_id: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_notified?: boolean | null
          post_author_id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_promises_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_recommendations: {
        Row: {
          ai_analysis_summary: Json | null
          confidence_score: number
          created_at: string
          expires_at: string
          id: string
          instagram_connection_id: string | null
          occasion: string | null
          priority_score: number | null
          reasoning: string | null
          recommendation_type: string
          recommended_products: Json
          status: string
          target_contact_id: string | null
          updated_at: string
          user_feedback: Json | null
          user_id: string
        }
        Insert: {
          ai_analysis_summary?: Json | null
          confidence_score?: number
          created_at?: string
          expires_at?: string
          id?: string
          instagram_connection_id?: string | null
          occasion?: string | null
          priority_score?: number | null
          reasoning?: string | null
          recommendation_type: string
          recommended_products?: Json
          status?: string
          target_contact_id?: string | null
          updated_at?: string
          user_feedback?: Json | null
          user_id: string
        }
        Update: {
          ai_analysis_summary?: Json | null
          confidence_score?: number
          created_at?: string
          expires_at?: string
          id?: string
          instagram_connection_id?: string | null
          occasion?: string | null
          priority_score?: number | null
          reasoning?: string | null
          recommendation_type?: string
          recommended_products?: Json
          status?: string
          target_contact_id?: string | null
          updated_at?: string
          user_feedback?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_recommendations_instagram_connection_id_fkey"
            columns: ["instagram_connection_id"]
            isOneToOne: false
            referencedRelation: "instagram_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_recommendations_target_contact_id_fkey"
            columns: ["target_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_recommendations_target_contact_id_fkey"
            columns: ["target_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_limited"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_thanks: {
        Row: {
          collective_fund_id: string | null
          created_at: string | null
          emoji: string | null
          gift_id: string | null
          id: string
          is_group_message: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          collective_fund_id?: string | null
          created_at?: string | null
          emoji?: string | null
          gift_id?: string | null
          id?: string
          is_group_message?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          collective_fund_id?: string | null
          created_at?: string | null
          emoji?: string | null
          gift_id?: string | null
          id?: string
          is_group_message?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_thanks_collective_fund_id_fkey"
            columns: ["collective_fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_thanks_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_thanks_recipients: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          thank_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          thank_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          thank_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_thanks_recipients_thank_message_id_fkey"
            columns: ["thank_message_id"]
            isOneToOne: false
            referencedRelation: "gift_thanks"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          amount: number | null
          collective_fund_id: string | null
          created_at: string
          currency: string | null
          gift_date: string
          gift_description: string | null
          gift_name: string
          giver_id: string
          id: string
          occasion: string | null
          product_id: string | null
          receiver_id: string | null
          receiver_name: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          collective_fund_id?: string | null
          created_at?: string
          currency?: string | null
          gift_date: string
          gift_description?: string | null
          gift_name: string
          giver_id: string
          id?: string
          occasion?: string | null
          product_id?: string | null
          receiver_id?: string | null
          receiver_name?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          collective_fund_id?: string | null
          created_at?: string
          currency?: string | null
          gift_date?: string
          gift_description?: string | null
          gift_name?: string
          giver_id?: string
          id?: string
          occasion?: string | null
          product_id?: string | null
          receiver_id?: string | null
          receiver_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gifts_collective_fund_id_fkey"
            columns: ["collective_fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gifts_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "gifts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gifts_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      gratitude_wall: {
        Row: {
          beneficiary_id: string
          contributor_id: string
          created_at: string | null
          fund_id: string | null
          id: string
          is_public: boolean | null
          message_text: string
          message_type: string
          reaction_count: number | null
          updated_at: string | null
        }
        Insert: {
          beneficiary_id: string
          contributor_id: string
          created_at?: string | null
          fund_id?: string | null
          id?: string
          is_public?: boolean | null
          message_text: string
          message_type: string
          reaction_count?: number | null
          updated_at?: string | null
        }
        Update: {
          beneficiary_id?: string
          contributor_id?: string
          created_at?: string | null
          fund_id?: string | null
          id?: string
          is_public?: boolean | null
          message_text?: string
          message_type?: string
          reaction_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gratitude_wall_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_connections: {
        Row: {
          access_token_encrypted: string | null
          consent_date: string | null
          consent_granted: boolean
          consent_version: string
          created_at: string
          data_usage_consent: Json
          id: string
          instagram_user_id: string | null
          instagram_username: string
          is_active: boolean
          last_sync_at: string | null
          last_token_rotation: string | null
          privacy_settings: Json | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          token_rotation_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          consent_date?: string | null
          consent_granted?: boolean
          consent_version?: string
          created_at?: string
          data_usage_consent?: Json
          id?: string
          instagram_user_id?: string | null
          instagram_username: string
          is_active?: boolean
          last_sync_at?: string | null
          last_token_rotation?: string | null
          privacy_settings?: Json | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          token_rotation_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          consent_date?: string | null
          consent_granted?: boolean
          consent_version?: string
          created_at?: string
          data_usage_consent?: Json
          id?: string
          instagram_user_id?: string | null
          instagram_username?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_token_rotation?: string | null
          privacy_settings?: Json | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          token_rotation_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_posts_analysis: {
        Row: {
          ai_analysis: Json
          analysis_version: string
          analyzed_at: string
          caption_text: string | null
          confidence_score: number
          content_type: string | null
          detected_interests: string[] | null
          detected_products: string[] | null
          expires_at: string
          gift_preferences: string[] | null
          hashtags: string[] | null
          id: string
          instagram_connection_id: string
          mentions: string[] | null
          occasion_hints: string[] | null
          post_date: string | null
          post_id: string
          post_url: string | null
          sentiment_score: number | null
        }
        Insert: {
          ai_analysis?: Json
          analysis_version?: string
          analyzed_at?: string
          caption_text?: string | null
          confidence_score?: number
          content_type?: string | null
          detected_interests?: string[] | null
          detected_products?: string[] | null
          expires_at?: string
          gift_preferences?: string[] | null
          hashtags?: string[] | null
          id?: string
          instagram_connection_id: string
          mentions?: string[] | null
          occasion_hints?: string[] | null
          post_date?: string | null
          post_id: string
          post_url?: string | null
          sentiment_score?: number | null
        }
        Update: {
          ai_analysis?: Json
          analysis_version?: string
          analyzed_at?: string
          caption_text?: string | null
          confidence_score?: number
          content_type?: string | null
          detected_interests?: string[] | null
          detected_products?: string[] | null
          expires_at?: string
          gift_preferences?: string[] | null
          hashtags?: string[] | null
          id?: string
          instagram_connection_id?: string
          mentions?: string[] | null
          occasion_hints?: string[] | null
          post_date?: string | null
          post_id?: string
          post_url?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_posts_analysis_instagram_connection_id_fkey"
            columns: ["instagram_connection_id"]
            isOneToOne: false
            referencedRelation: "instagram_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_rewards: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          earned_at: string | null
          id: string
          invitation_id: string
          reward_type: string
          reward_value: Json
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          invitation_id: string
          reward_type: string
          reward_value: Json
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          invitation_id?: string
          reward_type?: string
          reward_value?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_rewards_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string
          invitee_email: string
          invitee_phone: string | null
          inviter_id: string
          message: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          expires_at?: string
          id?: string
          invitation_token: string
          invited_at?: string
          invitee_email: string
          invitee_phone?: string | null
          inviter_id: string
          message?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invitee_email?: string
          invitee_phone?: string | null
          inviter_id?: string
          message?: string | null
          status?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          current_points: number
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_points?: number
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_points?: number
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_redemptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          points_spent: number
          redemption_code: string | null
          reward_id: string
          status: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          points_spent: number
          redemption_code?: string | null
          reward_id: string
          status?: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          points_spent?: number
          redemption_code?: string | null
          reward_id?: string
          status?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          image_url: string | null
          is_active: boolean
          max_discount_amount: number | null
          max_redemptions_per_user: number | null
          points_cost: number
          product_id: string | null
          reward_type: string
          stock_quantity: number | null
          terms_conditions: string | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          workshop_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_discount_amount?: number | null
          max_redemptions_per_user?: number | null
          points_cost: number
          product_id?: string | null
          reward_type: string
          stock_quantity?: number | null
          terms_conditions?: string | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          workshop_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_discount_amount?: number | null
          max_redemptions_per_user?: number | null
          points_cost?: number
          product_id?: string | null
          reward_type?: string
          stock_quantity?: number | null
          terms_conditions?: string | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          workshop_id?: string | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json | null
          points_amount: number
          points_balance_after: number
          source_id: string | null
          source_type: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          points_amount: number
          points_balance_after: number
          source_id?: string | null
          source_type: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          points_amount?: number
          points_balance_after?: number
          source_id?: string | null
          source_type?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          ai_suggestions: boolean | null
          birthday_notifications: boolean | null
          comment_notifications: boolean | null
          contribution_notifications: boolean | null
          created_at: string | null
          digest_frequency: string | null
          digest_mode: boolean | null
          email_enabled: boolean | null
          event_notifications: boolean | null
          fund_deadline_notifications: boolean | null
          gift_notifications: boolean | null
          id: string
          in_app_enabled: boolean | null
          post_notifications: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reaction_notifications: boolean | null
          sms_enabled: boolean | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
        }
        Insert: {
          ai_suggestions?: boolean | null
          birthday_notifications?: boolean | null
          comment_notifications?: boolean | null
          contribution_notifications?: boolean | null
          created_at?: string | null
          digest_frequency?: string | null
          digest_mode?: boolean | null
          email_enabled?: boolean | null
          event_notifications?: boolean | null
          fund_deadline_notifications?: boolean | null
          gift_notifications?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          post_notifications?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reaction_notifications?: boolean | null
          sms_enabled?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
        }
        Update: {
          ai_suggestions?: boolean | null
          birthday_notifications?: boolean | null
          comment_notifications?: boolean | null
          contribution_notifications?: boolean | null
          created_at?: string | null
          digest_frequency?: string | null
          digest_mode?: boolean | null
          email_enabled?: boolean | null
          event_notifications?: boolean | null
          fund_deadline_notifications?: boolean | null
          gift_notifications?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          post_notifications?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reaction_notifications?: boolean | null
          sms_enabled?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          archived_at: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          scheduled_for: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          scheduled_for?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          scheduled_for?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      occasions: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_featured: boolean | null
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occasions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occasions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string | null
          delivery_address: Json | null
          id: string
          notes: string | null
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          delivery_address?: Json | null
          id?: string
          notes?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          delivery_address?: Json | null
          id?: string
          notes?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          code: string
          config: Json | null
          created_at: string
          currency: string
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json | null
          created_at?: string
          currency?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json | null
          created_at?: string
          currency?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          contributor_id: string | null
          created_at: string
          currency: string
          external_transaction_id: string | null
          failure_reason: string | null
          fund_id: string
          id: string
          payment_data: Json | null
          payment_method_code: string
          processed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contributor_id?: string | null
          created_at?: string
          currency?: string
          external_transaction_id?: string | null
          failure_reason?: string | null
          fund_id: string
          id?: string
          payment_data?: Json | null
          payment_method_code: string
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contributor_id?: string | null
          created_at?: string
          currency?: string
          external_transaction_id?: string | null
          failure_reason?: string | null
          fund_id?: string
          id?: string
          payment_data?: Json | null
          payment_method_code?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payment_method_code_fkey"
            columns: ["payment_method_code"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["code"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          device_info: Json | null
          endpoint: string | null
          id: string
          location_info: Json | null
          metadata: Json | null
          metric_type: string
          timestamp: string
          unit: string
          user_id: string | null
          value: number
        }
        Insert: {
          device_info?: Json | null
          endpoint?: string | null
          id?: string
          location_info?: Json | null
          metadata?: Json | null
          metric_type: string
          timestamp?: string
          unit: string
          user_id?: string | null
          value: number
        }
        Update: {
          device_info?: Json | null
          endpoint?: string | null
          id?: string
          location_info?: Json | null
          metadata?: Json | null
          metric_type?: string
          timestamp?: string
          unit?: string
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          last_modified_by: string | null
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          last_modified_by?: string | null
          setting_category: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          last_modified_by?: string | null
          setting_category?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          is_published: boolean | null
          media_thumbnail: string | null
          media_url: string | null
          occasion: string | null
          type: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_published?: boolean | null
          media_thumbnail?: string | null
          media_url?: string | null
          occasion?: string | null
          type: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_published?: boolean | null
          media_thumbnail?: string | null
          media_url?: string | null
          occasion?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_posts_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      product_ratings: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_account_id: string | null
          business_category_id: string | null
          business_id: string
          business_owner_id: string | null
          category_id: string | null
          category_name: string | null
          created_at: string
          currency: string | null
          description: string | null
          experience_type: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_experience: boolean | null
          location_name: string | null
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          business_account_id?: string | null
          business_category_id?: string | null
          business_id: string
          business_owner_id?: string | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          experience_type?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_experience?: boolean | null
          location_name?: string | null
          name: string
          price: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          business_account_id?: string | null
          business_category_id?: string | null
          business_id?: string
          business_owner_id?: string | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          experience_type?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_experience?: boolean | null
          location_name?: string | null
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_category_id_fkey"
            columns: ["business_category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_referrals: number | null
          avatar_url: string | null
          badges: Json | null
          bio: string | null
          birthday: string | null
          birthday_badge_level: number | null
          city: string | null
          created_at: string
          first_birthday_on_platform: string | null
          first_name: string | null
          id: string
          invitations_accepted: number | null
          invitations_sent: number | null
          is_suspended: boolean | null
          last_name: string | null
          phone: string | null
          preferences: Json | null
          primary_referral_code: string | null
          referral_earnings: number | null
          referred_by: string | null
          suspended_at: string | null
          suspension_reason: string | null
          total_birthdays_celebrated: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_referrals?: number | null
          avatar_url?: string | null
          badges?: Json | null
          bio?: string | null
          birthday?: string | null
          birthday_badge_level?: number | null
          city?: string | null
          created_at?: string
          first_birthday_on_platform?: string | null
          first_name?: string | null
          id?: string
          invitations_accepted?: number | null
          invitations_sent?: number | null
          is_suspended?: boolean | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          primary_referral_code?: string | null
          referral_earnings?: number | null
          referred_by?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          total_birthdays_celebrated?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_referrals?: number | null
          avatar_url?: string | null
          badges?: Json | null
          bio?: string | null
          birthday?: string | null
          birthday_badge_level?: number | null
          city?: string | null
          created_at?: string
          first_birthday_on_platform?: string | null
          first_name?: string | null
          id?: string
          invitations_accepted?: number | null
          invitations_sent?: number | null
          is_suspended?: boolean | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          primary_referral_code?: string | null
          referral_earnings?: number | null
          referred_by?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          total_birthdays_celebrated?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          device_name: string | null
          device_type: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          bucket_type: string
          created_at: string
          id: string
          identifier: string
          last_refill: string
          max_tokens: number
          refill_rate: number
          tokens: number
        }
        Insert: {
          bucket_type: string
          created_at?: string
          id?: string
          identifier: string
          last_refill?: string
          max_tokens: number
          refill_rate: number
          tokens?: number
        }
        Update: {
          bucket_type?: string
          created_at?: string
          id?: string
          identifier?: string
          last_refill?: string
          max_tokens?: number
          refill_rate?: number
          tokens?: number
        }
        Relationships: []
      }
      reciprocity_imbalance_alerts: {
        Row: {
          admin_notes: string | null
          alert_type: string
          contributions_given_count: number
          contributions_received_count: number
          created_at: string
          days_since_last_contribution: number | null
          id: string
          imbalance_ratio: number
          metadata: Json | null
          recommended_action: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          total_contributed: number
          total_received: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          alert_type?: string
          contributions_given_count?: number
          contributions_received_count?: number
          created_at?: string
          days_since_last_contribution?: number | null
          id?: string
          imbalance_ratio?: number
          metadata?: Json | null
          recommended_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          total_contributed?: number
          total_received?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          alert_type?: string
          contributions_given_count?: number
          contributions_received_count?: number
          created_at?: string
          days_since_last_contribution?: number | null
          id?: string
          imbalance_ratio?: number
          metadata?: Json | null
          recommended_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          total_contributed?: number
          total_received?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reciprocity_scores: {
        Row: {
          academic_contributions: number | null
          badge_level: string | null
          birthday_contributions: number | null
          generosity_score: number | null
          last_calculated_at: string | null
          promotion_contributions: number | null
          total_amount_given: number | null
          total_contributions_count: number | null
          total_funds_initiated: number | null
          user_id: string
          wedding_contributions: number | null
        }
        Insert: {
          academic_contributions?: number | null
          badge_level?: string | null
          birthday_contributions?: number | null
          generosity_score?: number | null
          last_calculated_at?: string | null
          promotion_contributions?: number | null
          total_amount_given?: number | null
          total_contributions_count?: number | null
          total_funds_initiated?: number | null
          user_id: string
          wedding_contributions?: number | null
        }
        Update: {
          academic_contributions?: number | null
          badge_level?: string | null
          birthday_contributions?: number | null
          generosity_score?: number | null
          last_calculated_at?: string | null
          promotion_contributions?: number | null
          total_amount_given?: number | null
          total_contributions_count?: number | null
          total_funds_initiated?: number | null
          user_id?: string
          wedding_contributions?: number | null
        }
        Relationships: []
      }
      reciprocity_tracking: {
        Row: {
          beneficiary_id: string
          contribution_amount: number
          created_at: string | null
          currency: string | null
          donor_id: string
          fund_id: string | null
          id: string
          occasion: string | null
        }
        Insert: {
          beneficiary_id: string
          contribution_amount: number
          created_at?: string | null
          currency?: string | null
          donor_id: string
          fund_id?: string | null
          id?: string
          occasion?: string | null
        }
        Update: {
          beneficiary_id?: string
          contribution_amount?: number
          created_at?: string | null
          currency?: string | null
          donor_id?: string
          fund_id?: string | null
          id?: string
          occasion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reciprocity_tracking_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          clicks_count: number | null
          code: string
          code_type: string
          conversions_count: number | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          label: string | null
          last_used_at: string | null
          max_uses: number | null
          metadata: Json | null
          signups_count: number | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          clicks_count?: number | null
          code: string
          code_type?: string
          conversions_count?: number | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          last_used_at?: string | null
          max_uses?: number | null
          metadata?: Json | null
          signups_count?: number | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          clicks_count?: number | null
          code?: string
          code_type?: string
          conversions_count?: number | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          last_used_at?: string | null
          max_uses?: number | null
          metadata?: Json | null
          signups_count?: number | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      referral_tracking: {
        Row: {
          city: string | null
          conversion_value: number | null
          country: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          landing_page: string | null
          metadata: Json | null
          referral_code_id: string
          referred_user_id: string | null
          referrer_id: string
          referrer_url: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          conversion_value?: number | null
          country?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          landing_page?: string | null
          metadata?: Json | null
          referral_code_id: string
          referred_user_id?: string | null
          referrer_id: string
          referrer_url?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          conversion_value?: number | null
          country?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          landing_page?: string | null
          metadata?: Json | null
          referral_code_id?: string
          referred_user_id?: string | null
          referrer_id?: string
          referrer_url?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_refund_id: string | null
          fund_id: string
          id: string
          processed_at: string | null
          reason: string
          refund_data: Json | null
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          external_refund_id?: string | null
          fund_id: string
          id?: string
          processed_at?: string | null
          reason?: string
          refund_data?: Json | null
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_refund_id?: string | null
          fund_id?: string
          id?: string
          processed_at?: string | null
          reason?: string
          refund_data?: Json | null
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_comments: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_comment_reports_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_comments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_comments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reported_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_reports_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reported_posts_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reported_posts_reporter"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_reported_posts_reporter"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "fk_reported_posts_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          action_data: Json | null
          archived_at: string | null
          contact_id: string | null
          created_at: string
          delivery_methods: string[]
          id: string
          is_archived: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          priority_score: number | null
          scheduled_for: string
          sent_at: string | null
          smart_notification_category: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          archived_at?: string | null
          contact_id?: string | null
          created_at?: string
          delivery_methods: string[]
          id?: string
          is_archived?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority_score?: number | null
          scheduled_for: string
          sent_at?: string | null
          smart_notification_category?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          archived_at?: string | null
          contact_id?: string | null
          created_at?: string
          delivery_methods?: string[]
          id?: string
          is_archived?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority_score?: number | null
          scheduled_for?: string
          sent_at?: string | null
          smart_notification_category?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_scheduled_notifications_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scheduled_notifications_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_limited"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          admin_user_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      surprise_contributors: {
        Row: {
          contributor_id: string
          created_at: string | null
          fund_id: string
          has_seen_surprise: boolean | null
          id: string
          invited_at: string | null
          invited_by: string
        }
        Insert: {
          contributor_id: string
          created_at?: string | null
          fund_id: string
          has_seen_surprise?: boolean | null
          id?: string
          invited_at?: string | null
          invited_by: string
        }
        Update: {
          contributor_id?: string
          created_at?: string | null
          fund_id?: string
          has_seen_surprise?: boolean | null
          id?: string
          invited_at?: string | null
          invited_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "surprise_contributors_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      suspicious_activities: {
        Row: {
          action_taken: string | null
          activity_type: string
          auto_detected: boolean | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          activity_type: string
          auto_detected?: boolean | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          activity_type?: string
          auto_detected?: boolean | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_suspicious_activities_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      transaction_verifications: {
        Row: {
          beneficiary_contact_id: string | null
          blocked_until: string | null
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          fund_id: string
          id: string
          ip_address: unknown
          is_verified: boolean
          user_id: string
          verification_attempts: number | null
          verification_code: string
          verification_token: string
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          beneficiary_contact_id?: string | null
          blocked_until?: string | null
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          fund_id: string
          id?: string
          ip_address?: unknown
          is_verified?: boolean
          user_id: string
          verification_attempts?: number | null
          verification_code: string
          verification_token?: string
          verification_type?: string
          verified_at?: string | null
        }
        Update: {
          beneficiary_contact_id?: string | null
          blocked_until?: string | null
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          fund_id?: string
          id?: string
          ip_address?: unknown
          is_verified?: boolean
          user_id?: string
          verification_attempts?: number | null
          verification_code?: string
          verification_token?: string
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transaction_verifications_contact"
            columns: ["beneficiary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transaction_verifications_contact"
            columns: ["beneficiary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_limited"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transaction_verifications_fund"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_key: string
          created_at: string
          earned_at: string
          id: string
          is_showcased: boolean | null
          metadata: Json | null
          progress_value: number | null
          user_id: string
        }
        Insert: {
          badge_key: string
          created_at?: string
          earned_at?: string
          id?: string
          is_showcased?: boolean | null
          metadata?: Json | null
          progress_value?: number | null
          user_id: string
        }
        Update: {
          badge_key?: string
          created_at?: string
          earned_at?: string
          id?: string
          is_showcased?: boolean | null
          metadata?: Json | null
          progress_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["badge_key"]
          },
        ]
      }
      user_beneficiary_history: {
        Row: {
          beneficiary_contact_id: string
          created_at: string
          first_payment_at: string
          id: string
          user_id: string
        }
        Insert: {
          beneficiary_contact_id: string
          created_at?: string
          first_payment_at?: string
          id?: string
          user_id: string
        }
        Update: {
          beneficiary_contact_id?: string
          created_at?: string
          first_payment_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_beneficiary_contact"
            columns: ["beneficiary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_beneficiary_contact"
            columns: ["beneficiary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_limited"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string
          device_id: string
          device_name: string | null
          device_type: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          push_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name?: string | null
          device_type: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          push_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string | null
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          push_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          accept_alternatives: boolean | null
          context_usage: string[] | null
          created_at: string
          id: string
          notes: string | null
          occasion_type: string | null
          priority_level: string | null
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accept_alternatives?: boolean | null
          context_usage?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          occasion_type?: string | null
          priority_level?: string | null
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accept_alternatives?: boolean | null
          context_usage?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          occasion_type?: string | null
          priority_level?: string | null
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_performance_settings: {
        Row: {
          auto_optimize: boolean | null
          compress_images: boolean | null
          connection_type: string | null
          created_at: string
          id: string
          last_speed_test: number | null
          low_bandwidth_mode: boolean | null
          reduce_animations: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_optimize?: boolean | null
          compress_images?: boolean | null
          connection_type?: string | null
          created_at?: string
          id?: string
          last_speed_test?: number | null
          low_bandwidth_mode?: boolean | null
          reduce_animations?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_optimize?: boolean | null
          compress_images?: boolean | null
          connection_type?: string | null
          created_at?: string
          id?: string
          last_speed_test?: number | null
          low_bandwidth_mode?: boolean | null
          reduce_animations?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          allergies: string[] | null
          clothing_size: string | null
          created_at: string | null
          dietary_restrictions: string[] | null
          favorite_colors: string[] | null
          id: string
          price_ranges: Json | null
          ring_size: string | null
          shoe_size: string | null
          updated_at: string | null
          user_id: string
          visibility_settings: Json | null
        }
        Insert: {
          allergies?: string[] | null
          clothing_size?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          favorite_colors?: string[] | null
          id?: string
          price_ranges?: Json | null
          ring_size?: string | null
          shoe_size?: string | null
          updated_at?: string | null
          user_id: string
          visibility_settings?: Json | null
        }
        Update: {
          allergies?: string[] | null
          clothing_size?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          favorite_colors?: string[] | null
          id?: string
          price_ranges?: Json | null
          ring_size?: string | null
          shoe_size?: string | null
          updated_at?: string | null
          user_id?: string
          visibility_settings?: Json | null
        }
        Relationships: []
      }
      user_reciprocity_preferences: {
        Row: {
          created_at: string | null
          enable_for_academic: boolean | null
          enable_for_birthdays: boolean | null
          enable_for_promotions: boolean | null
          enable_for_weddings: boolean | null
          enable_reciprocity_system: boolean | null
          min_reciprocity_score: number | null
          notify_high_priority_only: boolean | null
          notify_on_friend_fund: boolean | null
          show_generosity_badge: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_for_academic?: boolean | null
          enable_for_birthdays?: boolean | null
          enable_for_promotions?: boolean | null
          enable_for_weddings?: boolean | null
          enable_reciprocity_system?: boolean | null
          min_reciprocity_score?: number | null
          notify_high_priority_only?: boolean | null
          notify_on_friend_fund?: boolean | null
          show_generosity_badge?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_for_academic?: boolean | null
          enable_for_birthdays?: boolean | null
          enable_for_promotions?: boolean | null
          enable_for_weddings?: boolean | null
          enable_reciprocity_system?: boolean | null
          min_reciprocity_score?: number | null
          notify_high_priority_only?: boolean | null
          notify_on_friend_fund?: boolean | null
          show_generosity_badge?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sync_preferences: {
        Row: {
          created_at: string
          id: string
          notification_email: boolean | null
          notification_push: boolean | null
          notification_sms: boolean | null
          sync_contacts: boolean | null
          sync_events: boolean | null
          sync_funds: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_email?: boolean | null
          notification_push?: boolean | null
          notification_sms?: boolean | null
          sync_contacts?: boolean | null
          sync_events?: boolean | null
          sync_funds?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_email?: boolean | null
          notification_push?: boolean | null
          notification_sms?: boolean | null
          sync_contacts?: boolean | null
          sync_events?: boolean | null
          sync_funds?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_views: {
        Row: {
          id: string
          viewed_at: string | null
          viewer_id: string
          wishlist_owner_id: string
        }
        Insert: {
          id?: string
          viewed_at?: string | null
          viewer_id: string
          wishlist_owner_id: string
        }
        Update: {
          id?: string
          viewed_at?: string | null
          viewer_id?: string
          wishlist_owner_id?: string
        }
        Relationships: []
      }
      workshops: {
        Row: {
          artisan_bio: string | null
          artisan_name: string
          available_dates: Json | null
          created_at: string
          description: string
          difficulty_level: string | null
          duration_hours: number
          id: string
          images: Json | null
          is_active: boolean
          location_address: string | null
          location_coordinates: Json | null
          materials_included: boolean | null
          max_participants: number
          price: number
          requirements: string | null
          title: string
          updated_at: string
          workshop_type: string
        }
        Insert: {
          artisan_bio?: string | null
          artisan_name: string
          available_dates?: Json | null
          created_at?: string
          description: string
          difficulty_level?: string | null
          duration_hours: number
          id?: string
          images?: Json | null
          is_active?: boolean
          location_address?: string | null
          location_coordinates?: Json | null
          materials_included?: boolean | null
          max_participants?: number
          price: number
          requirements?: string | null
          title: string
          updated_at?: string
          workshop_type: string
        }
        Update: {
          artisan_bio?: string | null
          artisan_name?: string
          available_dates?: Json | null
          created_at?: string
          description?: string
          difficulty_level?: string | null
          duration_hours?: number
          id?: string
          images?: Json | null
          is_active?: boolean
          location_address?: string | null
          location_coordinates?: Json | null
          materials_included?: boolean | null
          max_participants?: number
          price?: number
          requirements?: string | null
          title?: string
          updated_at?: string
          workshop_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      contacts_limited: {
        Row: {
          birthday: string | null
          id: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          birthday?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          birthday?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_birthday_stats"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      product_rating_stats: {
        Row: {
          average_rating: number | null
          five_star_count: number | null
          four_star_count: number | null
          one_star_count: number | null
          product_id: string | null
          rating_count: number | null
          three_star_count: number | null
          two_star_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges_with_definitions: {
        Row: {
          badge_key: string | null
          category: string | null
          color_primary: string | null
          color_secondary: string | null
          description: string | null
          earned_at: string | null
          icon: string | null
          id: string | null
          is_showcased: boolean | null
          level: number | null
          metadata: Json | null
          name: string | null
          progress_value: number | null
          requirement_threshold: number | null
          requirement_type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_key_fkey"
            columns: ["badge_key"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["badge_key"]
          },
        ]
      }
      user_birthday_stats: {
        Row: {
          auth_user_id: string | null
          badge_level: string | null
          badge_name: string | null
          birthday_badge_level: number | null
          celebrations_count: number | null
          first_birthday_on_platform: string | null
          total_birthdays_celebrated: number | null
          user_id: string | null
          user_name: string | null
          years_celebrated: number[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_loyalty_points: {
        Args: {
          p_description?: string
          p_points: number
          p_source_id?: string
          p_source_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      archive_old_notifications: { Args: never; Returns: undefined }
      are_users_connected: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      calculate_birthday_badge_level: {
        Args: { celebrations_count: number }
        Returns: string
      }
      calculate_fund_deadline: {
        Args: { contact_birthday: string; created_year?: number }
        Returns: string
      }
      calculate_loyalty_points: {
        Args: { p_activity_type: string; p_amount?: number }
        Returns: number
      }
      can_contribute_to_fund: { Args: { fund_uuid: string }; Returns: boolean }
      can_see_fund_for_friend: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      check_admin_permission: {
        Args: { required_role?: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_bucket_type: string
          p_identifier: string
          p_max_tokens?: number
          p_refill_rate?: number
        }
        Returns: boolean
      }
      create_business_collective_fund:
        | {
            Args: {
              p_beneficiary_user_id: string
              p_business_id: string
              p_currency?: string
              p_description?: string
              p_occasion?: string
              p_product_id: string
              p_target_amount?: number
              p_title: string
            }
            Returns: string
          }
        | {
            Args: {
              p_auto_notifications?: boolean
              p_beneficiary_user_id: string
              p_business_id: string
              p_currency?: string
              p_description?: string
              p_product_id: string
              p_target_amount: number
              p_title?: string
            }
            Returns: string
          }
      create_fund_activity: {
        Args: {
          p_activity_type: string
          p_amount?: number
          p_contributor_id: string
          p_fund_id: string
          p_message?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_transaction_verification: {
        Args: {
          p_beneficiary_contact_id: string
          p_fund_id: string
          p_user_id: string
          p_verification_type?: string
        }
        Returns: string
      }
      create_transaction_verification_with_rate_limit: {
        Args: {
          p_beneficiary_contact_id: string
          p_device_fingerprint?: string
          p_fund_id: string
          p_ip_address?: unknown
          p_user_id: string
          p_verification_type?: string
        }
        Returns: string
      }
      current_user_role: { Args: never; Returns: string }
      decrypt_instagram_token: {
        Args: { p_encrypted_token: string }
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key_id?: string }
        Returns: string
      }
      detect_domino_effect: {
        Args: { p_contributor_id: string; p_fund_id: string }
        Returns: {
          total_amount_triggered: number
          triggered_contributions: number
        }[]
      }
      detect_reciprocity_imbalance: {
        Args: { p_user_id: string }
        Returns: {
          friend_id: string
          friend_name: string
          given_count: number
          imbalance_score: number
          received_count: number
        }[]
      }
      detect_suspicious_behavior: { Args: never; Returns: number }
      detect_upcoming_birthdays_without_fund: {
        Args: { p_user_id: string }
        Returns: {
          birthday: string
          contact_id: string
          contact_name: string
          days_until: number
          existing_contributors: number
        }[]
      }
      encrypt_instagram_token: { Args: { p_token: string }; Returns: string }
      encrypt_sensitive_data: {
        Args: { data: string; key_id?: string }
        Returns: string
      }
      extract_beneficiary_name: {
        Args: { fund_title: string }
        Returns: string
      }
      find_contact_by_name: {
        Args: { p_creator_id: string; p_name: string }
        Returns: string
      }
      find_users_in_delivery_zones: {
        Args: { p_business_id: string; p_search_term?: string }
        Returns: {
          address: string
          email: string
          first_name: string
          last_name: string
          phone: string
          user_id: string
        }[]
      }
      find_users_outside_delivery_zones: {
        Args: { p_business_id: string; p_search_term?: string }
        Returns: {
          address: string
          email: string
          first_name: string
          last_name: string
          phone: string
          user_id: string
        }[]
      }
      generate_event_analytics: { Args: never; Returns: number }
      generate_unique_referral_code: {
        Args: { code_format?: string; user_uuid: string }
        Returns: string
      }
      get_badge_name: { Args: { badge_level: string }; Returns: string }
      get_business_account: {
        Args: { p_user_id: string }
        Returns: {
          address: string
          business_name: string
          business_type: string
          created_at: string
          delivery_settings: Json
          delivery_zones: Json
          description: string
          email: string
          id: string
          is_active: boolean
          is_verified: boolean
          logo_url: string
          opening_hours: Json
          payment_info: Json
          phone: string
          updated_at: string
          user_id: string
          website_url: string
        }[]
      }
      get_favorites_suggestions: {
        Args: { p_user_id: string }
        Returns: {
          friend_count: number
          friends_names: string
          product_currency: string
          product_description: string
          product_id: string
          product_image_url: string
          product_name: string
          product_price: number
        }[]
      }
      get_follower_count: { Args: { target_user_id: string }; Returns: number }
      get_following_count: { Args: { target_user_id: string }; Returns: number }
      get_fund_activities_for_user: {
        Args: { p_fund_id: string }
        Returns: {
          activity_type: string
          amount: number
          created_at: string
          currency: string
          fund_id: string
          id: string
          message: string
          metadata: Json
        }[]
      }
      get_invitation_stats: { Args: { user_uuid: string }; Returns: Json }
      get_product_category_name: {
        Args: { p_product_id: string }
        Returns: string
      }
      get_reciprocity_candidates: {
        Args: { fund_uuid: string }
        Returns: {
          candidate_id: string
          candidate_name: string
          generosity_score: number
          past_contribution_amount: number
          past_contribution_date: string
        }[]
      }
      get_referral_code_stats: { Args: { code_id: string }; Returns: Json }
      get_surprises_to_reveal: {
        Args: never
        Returns: {
          beneficiary_contact_id: string
          creator_id: string
          fund_id: string
          surprise_message: string
          surprise_song_prompt: string
        }[]
      }
      get_user_badge_progress: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          contribution_count: number
          friends_count: number
          funds_created: number
          successful_funds: number
          surprise_events: number
          thanks_sent: number
          total_amount_donated: number
        }[]
      }
      get_user_favorites_with_products: {
        Args: { p_user_id: string }
        Returns: {
          added_at: string
          favorite_id: string
          notes: string
          product_category_id: string
          product_currency: string
          product_description: string
          product_id: string
          product_image_url: string
          product_name: string
          product_price: number
        }[]
      }
      handle_failed_verification: {
        Args: { p_verification_id: string }
        Returns: undefined
      }
      has_active_fund_for_beneficiary: {
        Args: { p_beneficiary_user_id: string }
        Returns: boolean
      }
      has_contributed_to_fund: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      increment_gratitude_reaction: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      is_active_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_beneficiary_of_surprise: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_first_payment_to_beneficiary: {
        Args: { p_beneficiary_id: string; p_user_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { follower: string; following: string }
        Returns: boolean
      }
      is_super_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_surprise_contributor: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_admin_user_id?: string
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_severity?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      mark_surprise_revealed: {
        Args: { p_fund_id: string }
        Returns: undefined
      }
      mask_contributor_info: {
        Args: { is_anonymous?: boolean; name: string }
        Returns: string
      }
      process_expired_funds: { Args: never; Returns: undefined }
      request_contact_relationship: {
        Args: { p_message?: string; p_target_user_id: string }
        Returns: string
      }
      request_refund_from_service: {
        Args: {
          p_amount: number
          p_currency?: string
          p_fund_id: string
          p_user_id: string
        }
        Returns: string
      }
      respond_to_contact_request: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: boolean
      }
      spend_loyalty_points: {
        Args: {
          p_description?: string
          p_points: number
          p_source_id?: string
          p_source_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_community_rankings: { Args: never; Returns: undefined }
      update_community_score: {
        Args: {
          p_funds_delta?: number
          p_gifts_delta?: number
          p_points_delta?: number
          p_posts_delta?: number
          p_reactions_delta?: number
          p_user_id: string
        }
        Returns: undefined
      }
      update_reciprocity_score: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      upsert_business_account: {
        Args: {
          p_address?: string
          p_business_name: string
          p_business_type?: string
          p_delivery_settings?: Json
          p_delivery_zones?: Json
          p_description?: string
          p_email?: string
          p_logo_url?: string
          p_opening_hours?: Json
          p_payment_info?: Json
          p_phone?: string
          p_user_id: string
          p_website_url?: string
        }
        Returns: string
      }
      user_can_see_fund: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
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
