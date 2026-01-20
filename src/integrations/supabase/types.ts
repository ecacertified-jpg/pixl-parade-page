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
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          country_code: string | null
          created_at: string
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          related_notification_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          country_code?: string | null
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          related_notification_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          country_code?: string | null
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          related_notification_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_related_notification_id_fkey"
            columns: ["related_notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_admin_audit_admin_user"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_growth_alerts: {
        Row: {
          alert_type: string
          current_value: number
          escalation_count: number | null
          growth_percentage: number | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          last_escalated_at: string | null
          message: string
          metadata: Json | null
          metric_type: string
          original_severity: string | null
          previous_value: number | null
          severity: string | null
          threshold_id: string | null
          triggered_at: string | null
        }
        Insert: {
          alert_type: string
          current_value: number
          escalation_count?: number | null
          growth_percentage?: number | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          last_escalated_at?: string | null
          message: string
          metadata?: Json | null
          metric_type: string
          original_severity?: string | null
          previous_value?: number | null
          severity?: string | null
          threshold_id?: string | null
          triggered_at?: string | null
        }
        Update: {
          alert_type?: string
          current_value?: number
          escalation_count?: number | null
          growth_percentage?: number | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          last_escalated_at?: string | null
          message?: string
          metadata?: Json | null
          metric_type?: string
          original_severity?: string | null
          previous_value?: number | null
          severity?: string | null
          threshold_id?: string | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_growth_alerts_threshold_id_fkey"
            columns: ["threshold_id"]
            isOneToOne: false
            referencedRelation: "growth_alert_thresholds"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notification_preferences: {
        Row: {
          admin_user_id: string
          client_deletion_alerts: boolean
          created_at: string
          critical_moderation_alerts: boolean
          daily_digest: boolean
          email_enabled: boolean
          growth_alerts: boolean
          id: string
          in_app_enabled: boolean
          monitored_countries: string[] | null
          new_business_alerts: boolean
          new_client_alerts: boolean
          new_order_alerts: boolean
          performance_alerts: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          refund_request_alerts: boolean
          struggling_country_alerts: boolean | null
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          client_deletion_alerts?: boolean
          created_at?: string
          critical_moderation_alerts?: boolean
          daily_digest?: boolean
          email_enabled?: boolean
          growth_alerts?: boolean
          id?: string
          in_app_enabled?: boolean
          monitored_countries?: string[] | null
          new_business_alerts?: boolean
          new_client_alerts?: boolean
          new_order_alerts?: boolean
          performance_alerts?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          refund_request_alerts?: boolean
          struggling_country_alerts?: boolean | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          client_deletion_alerts?: boolean
          created_at?: string
          critical_moderation_alerts?: boolean
          daily_digest?: boolean
          email_enabled?: boolean
          growth_alerts?: boolean
          id?: string
          in_app_enabled?: boolean
          monitored_countries?: string[] | null
          new_business_alerts?: boolean
          new_client_alerts?: boolean
          new_order_alerts?: boolean
          performance_alerts?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          refund_request_alerts?: boolean
          struggling_country_alerts?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_notification_prefs_admin"
            columns: ["admin_user_id"]
            isOneToOne: true
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          action_url: string | null
          admin_user_id: string | null
          country_code: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          severity: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          admin_user_id?: string | null
          country_code?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          severity?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          admin_user_id?: string | null
          country_code?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          severity?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_report_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipients_count: number
          report_type: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipients_count?: number
          report_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipients_count?: number
          report_type?: string
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
      admin_report_preferences: {
        Row: {
          admin_user_id: string
          created_at: string
          email_override: string | null
          id: string
          include_alerts: boolean
          include_charts_summary: boolean
          include_kpis: boolean
          include_top_performers: boolean
          is_active: boolean
          report_types: string[]
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          email_override?: string | null
          id?: string
          include_alerts?: boolean
          include_charts_summary?: boolean
          include_kpis?: boolean
          include_top_performers?: boolean
          is_active?: boolean
          report_types?: string[]
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          email_override?: string | null
          id?: string
          include_alerts?: boolean
          include_charts_summary?: boolean
          include_kpis?: boolean
          include_top_performers?: boolean
          is_active?: boolean
          report_types?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_report_preferences_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: true
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
          assigned_countries: string[] | null
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
          assigned_countries?: string[] | null
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
          assigned_countries?: string[] | null
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
          country_code: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          delivery_settings: Json | null
          delivery_zones: Json | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
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
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
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
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
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
      business_alert_thresholds: {
        Row: {
          comparison_period: string
          created_at: string
          critical_threshold: number
          description: string | null
          id: string
          is_active: boolean | null
          metric_type: string
          notify_admin: boolean | null
          notify_business: boolean | null
          threshold_type: string
          updated_at: string
          warning_threshold: number
        }
        Insert: {
          comparison_period?: string
          created_at?: string
          critical_threshold: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          metric_type: string
          notify_admin?: boolean | null
          notify_business?: boolean | null
          threshold_type?: string
          updated_at?: string
          warning_threshold: number
        }
        Update: {
          comparison_period?: string
          created_at?: string
          critical_threshold?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          metric_type?: string
          notify_admin?: boolean | null
          notify_business?: boolean | null
          threshold_type?: string
          updated_at?: string
          warning_threshold?: number
        }
        Relationships: []
      }
      business_birthday_alerts: {
        Row: {
          birthday_date: string | null
          business_id: string
          created_at: string
          days_until_birthday: number
          expires_at: string | null
          fund_id: string | null
          id: string
          notified_at: string | null
          priority: string
          product_id: string | null
          status: string
          target_user_avatar: string | null
          target_user_id: string
          target_user_name: string | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          birthday_date?: string | null
          business_id: string
          created_at?: string
          days_until_birthday: number
          expires_at?: string | null
          fund_id?: string | null
          id?: string
          notified_at?: string | null
          priority?: string
          product_id?: string | null
          status?: string
          target_user_avatar?: string | null
          target_user_id: string
          target_user_name?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          birthday_date?: string | null
          business_id?: string
          created_at?: string
          days_until_birthday?: number
          expires_at?: string | null
          fund_id?: string | null
          id?: string
          notified_at?: string | null
          priority?: string
          product_id?: string | null
          status?: string
          target_user_avatar?: string | null
          target_user_id?: string
          target_user_name?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_birthday_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_birthday_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_birthday_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_birthday_alerts_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_birthday_alerts_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_birthday_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "business_collective_funds_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_collective_funds_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
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
            foreignKeyName: "business_collective_funds_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: true
            referencedRelation: "collective_funds_public"
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
      business_follows: {
        Row: {
          business_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      business_gallery: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          media_type: string
          media_url: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type: string
          media_url: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type?: string
          media_url?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          commune: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          commune?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          commune?: string | null
          country_code?: string | null
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
          customer_confirmed_at: string | null
          customer_id: string | null
          customer_rating: number | null
          customer_review_text: string | null
          delivery_address: string
          donor_phone: string
          fund_id: string | null
          id: string
          order_summary: Json
          payment_method: string
          processed_at: string | null
          refund_reason: string | null
          refund_requested_at: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          beneficiary_phone: string
          business_account_id: string
          created_at?: string
          currency?: string
          customer_confirmed_at?: string | null
          customer_id?: string | null
          customer_rating?: number | null
          customer_review_text?: string | null
          delivery_address: string
          donor_phone: string
          fund_id?: string | null
          id?: string
          order_summary?: Json
          payment_method?: string
          processed_at?: string | null
          refund_reason?: string | null
          refund_requested_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          beneficiary_phone?: string
          business_account_id?: string
          created_at?: string
          currency?: string
          customer_confirmed_at?: string | null
          customer_id?: string | null
          customer_rating?: number | null
          customer_review_text?: string | null
          delivery_address?: string
          donor_phone?: string
          fund_id?: string | null
          id?: string
          order_summary?: Json
          payment_method?: string
          processed_at?: string | null
          refund_reason?: string | null
          refund_requested_at?: string | null
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
            foreignKeyName: "business_orders_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_orders_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_orders_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_orders_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_performance_alerts: {
        Row: {
          alert_type: string
          business_id: string
          change_percentage: number | null
          created_at: string
          current_value: number
          escalation_count: number | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          is_resolved: boolean | null
          last_escalated_at: string | null
          message: string
          metadata: Json | null
          metric_type: string
          original_severity: string | null
          period_end: string | null
          period_start: string | null
          previous_value: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          business_id: string
          change_percentage?: number | null
          created_at?: string
          current_value?: number
          escalation_count?: number | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          is_resolved?: boolean | null
          last_escalated_at?: string | null
          message: string
          metadata?: Json | null
          metric_type: string
          original_severity?: string | null
          period_end?: string | null
          period_start?: string | null
          previous_value?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          business_id?: string
          change_percentage?: number | null
          created_at?: string
          current_value?: number
          escalation_count?: number | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          is_resolved?: boolean | null
          last_escalated_at?: string | null
          message?: string
          metadata?: Json | null
          metric_type?: string
          original_severity?: string | null
          period_end?: string | null
          period_start?: string | null
          previous_value?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_performance_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_performance_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_performance_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
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
      business_share_events: {
        Row: {
          actor_user_id: string | null
          business_id: string
          conversion_value: number | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          referrer_url: string | null
          share_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          actor_user_id?: string | null
          business_id: string
          conversion_value?: number | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          referrer_url?: string | null
          share_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          actor_user_id?: string | null
          business_id?: string
          conversion_value?: number | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          referrer_url?: string | null
          share_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_share_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_share_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_share_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_share_events_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "business_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      business_shares: {
        Row: {
          business_id: string
          click_count: number | null
          created_at: string
          first_clicked_at: string | null
          first_follow_at: string | null
          follow_count: number | null
          id: string
          last_clicked_at: string | null
          order_count: number | null
          referrer_url: string | null
          share_platform: string
          share_token: string | null
          total_order_value: number | null
          user_agent: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          business_id: string
          click_count?: number | null
          created_at?: string
          first_clicked_at?: string | null
          first_follow_at?: string | null
          follow_count?: number | null
          id?: string
          last_clicked_at?: string | null
          order_count?: number | null
          referrer_url?: string | null
          share_platform: string
          share_token?: string | null
          total_order_value?: number | null
          user_agent?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          business_id?: string
          click_count?: number | null
          created_at?: string
          first_clicked_at?: string | null
          first_follow_at?: string | null
          follow_count?: number | null
          id?: string
          last_clicked_at?: string | null
          order_count?: number | null
          referrer_url?: string | null
          share_platform?: string
          share_token?: string | null
          total_order_value?: number | null
          user_agent?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_shares_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_shares_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_shares_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      business_waitlist: {
        Row: {
          business_name: string
          business_type: string | null
          city: string | null
          contact_first_name: string
          contact_last_name: string
          converted_to_business_id: string | null
          created_at: string | null
          email: string
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_at: string | null
          motivation: string | null
          phone: string | null
          position: number
          processed_by: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_name: string
          business_type?: string | null
          city?: string | null
          contact_first_name: string
          contact_last_name: string
          converted_to_business_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          motivation?: string | null
          phone?: string | null
          position?: number
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string | null
          city?: string | null
          contact_first_name?: string
          contact_last_name?: string
          converted_to_business_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          motivation?: string | null
          phone?: string | null
          position?: number
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_waitlist_converted_to_business_id_fkey"
            columns: ["converted_to_business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_waitlist_converted_to_business_id_fkey"
            columns: ["converted_to_business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_waitlist_converted_to_business_id_fkey"
            columns: ["converted_to_business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
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
          {
            foreignKeyName: "collective_fund_orders_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_funds: {
        Row: {
          allow_anonymous_contributions: boolean | null
          beneficiary_contact_id: string | null
          business_product_id: string | null
          country_code: string | null
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
          country_code?: string | null
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
          country_code?: string | null
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
            foreignKeyName: "collective_funds_created_by_business_id_fkey"
            columns: ["created_by_business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_funds_created_by_business_id_fkey"
            columns: ["created_by_business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
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
            referencedRelation: "public_profiles"
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
          country_code: string | null
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
          country_code?: string | null
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
          country_code?: string | null
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
            referencedRelation: "public_profiles"
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
      country_objective_alerts: {
        Row: {
          achievement_rate: number
          actual_value: number
          alert_type: string
          country_code: string
          created_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          metric_type: string
          month: number
          severity: string
          target_value: number
          triggered_at: string | null
          year: number
        }
        Insert: {
          achievement_rate: number
          actual_value: number
          alert_type?: string
          country_code: string
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          metric_type: string
          month: number
          severity?: string
          target_value: number
          triggered_at?: string | null
          year: number
        }
        Update: {
          achievement_rate?: number
          actual_value?: number
          alert_type?: string
          country_code?: string
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          metric_type?: string
          month?: number
          severity?: string
          target_value?: number
          triggered_at?: string | null
          year?: number
        }
        Relationships: []
      }
      country_struggling_status: {
        Row: {
          country_code: string
          created_at: string | null
          id: string
          is_struggling: boolean | null
          last_status_change: string | null
          metadata: Json | null
          severity: string | null
          struggling_metrics: string[] | null
          struggling_since: string | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          id?: string
          is_struggling?: boolean | null
          last_status_change?: string | null
          metadata?: Json | null
          severity?: string | null
          struggling_metrics?: string[] | null
          struggling_since?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          id?: string
          is_struggling?: boolean | null
          last_status_change?: string | null
          metadata?: Json | null
          severity?: string | null
          struggling_metrics?: string[] | null
          struggling_since?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deleted_business_archives: {
        Row: {
          archived_data: Json
          business_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          expires_at: string | null
          id: string
        }
        Insert: {
          archived_data: Json
          business_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expires_at?: string | null
          id?: string
        }
        Update: {
          archived_data?: Json
          business_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expires_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deleted_business_archives_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deleted_business_archives_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deleted_business_archives_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_client_archives: {
        Row: {
          archived_data: Json
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          expires_at: string
          id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          archived_data?: Json
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expires_at?: string
          id?: string
          profile_id: string
          user_id: string
        }
        Update: {
          archived_data?: Json
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expires_at?: string
          id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "public_profiles"
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
      detected_duplicate_accounts: {
        Row: {
          account_ids: string[]
          admin_notes: string | null
          confidence: string
          created_at: string
          detected_at: string
          id: string
          match_criteria: string[]
          metadata: Json | null
          primary_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          account_ids?: string[]
          admin_notes?: string | null
          confidence?: string
          created_at?: string
          detected_at?: string
          id?: string
          match_criteria?: string[]
          metadata?: Json | null
          primary_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          account_ids?: string[]
          admin_notes?: string | null
          confidence?: string
          created_at?: string
          detected_at?: string
          id?: string
          match_criteria?: string[]
          metadata?: Json | null
          primary_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "fund_activities_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
          {
            foreignKeyName: "fund_comments_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "fund_contributions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
            foreignKeyName: "gift_thanks_collective_fund_id_fkey"
            columns: ["collective_fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
            foreignKeyName: "gifts_collective_fund_id_fkey"
            columns: ["collective_fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
            referencedRelation: "public_profiles"
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
            referencedRelation: "public_profiles"
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
          country_code: string | null
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
          country_code?: string | null
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
          country_code?: string | null
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
          {
            foreignKeyName: "gratitude_wall_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_alert_thresholds: {
        Row: {
          comparison_period: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metric_type: string
          notify_methods: Json | null
          threshold_type: string
          threshold_value: number
          updated_at: string | null
        }
        Insert: {
          comparison_period?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_type: string
          notify_methods?: Json | null
          threshold_type: string
          threshold_value: number
          updated_at?: string | null
        }
        Update: {
          comparison_period?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_type?: string
          notify_methods?: Json | null
          threshold_type?: string
          threshold_value?: number
          updated_at?: string | null
        }
        Relationships: []
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
      ml_forecast_results: {
        Row: {
          anomaly_detected: boolean | null
          confidence_score: number | null
          contributing_factors: Json | null
          country_code: string
          created_at: string | null
          expires_at: string | null
          forecast_month: number
          forecast_year: number
          generated_at: string | null
          growth_momentum: number | null
          id: string
          lower_bound: number | null
          metric_type: string
          model_confidence: number | null
          model_version: string | null
          opportunities: string[] | null
          overall_trend: string | null
          predicted_value: number
          risk_factors: string[] | null
          seasonal_factor: number | null
          seasonal_patterns: string[] | null
          trend_direction: string | null
          upper_bound: number | null
        }
        Insert: {
          anomaly_detected?: boolean | null
          confidence_score?: number | null
          contributing_factors?: Json | null
          country_code: string
          created_at?: string | null
          expires_at?: string | null
          forecast_month: number
          forecast_year: number
          generated_at?: string | null
          growth_momentum?: number | null
          id?: string
          lower_bound?: number | null
          metric_type: string
          model_confidence?: number | null
          model_version?: string | null
          opportunities?: string[] | null
          overall_trend?: string | null
          predicted_value: number
          risk_factors?: string[] | null
          seasonal_factor?: number | null
          seasonal_patterns?: string[] | null
          trend_direction?: string | null
          upper_bound?: number | null
        }
        Update: {
          anomaly_detected?: boolean | null
          confidence_score?: number | null
          contributing_factors?: Json | null
          country_code?: string
          created_at?: string | null
          expires_at?: string | null
          forecast_month?: number
          forecast_year?: number
          generated_at?: string | null
          growth_momentum?: number | null
          id?: string
          lower_bound?: number | null
          metric_type?: string
          model_confidence?: number | null
          model_version?: string | null
          opportunities?: string[] | null
          overall_trend?: string | null
          predicted_value?: number
          risk_factors?: string[] | null
          seasonal_factor?: number | null
          seasonal_patterns?: string[] | null
          trend_direction?: string | null
          upper_bound?: number | null
        }
        Relationships: []
      }
      monthly_objectives: {
        Row: {
          country_code: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metric_type: string
          month: number
          notes: string | null
          target_value: number
          updated_at: string | null
          year: number
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metric_type: string
          month: number
          notes?: string | null
          target_value: number
          updated_at?: string | null
          year: number
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metric_type?: string
          month?: number
          notes?: string | null
          target_value?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      notification_analytics: {
        Row: {
          action_url: string | null
          body: string | null
          category: string | null
          clicked_at: string | null
          conversion_type: string | null
          conversion_value: number | null
          converted_at: string | null
          created_at: string | null
          delivered_at: string | null
          device_type: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_id: string | null
          notification_type: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: string | null
          clicked_at?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          notification_type?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: string | null
          clicked_at?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          notification_type?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          ai_suggestions: boolean | null
          birthday_notifications: boolean | null
          birthday_reminder_days: number[] | null
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
          birthday_reminder_days?: number[] | null
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
          birthday_reminder_days?: number[] | null
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
            foreignKeyName: "payment_transactions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
      pending_business_registrations: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          created_at: string
          description: string | null
          email: string
          expires_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          created_at?: string
          description?: string | null
          email: string
          expires_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          created_at?: string
          description?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
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
          country_code: string | null
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
          country_code?: string | null
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
          country_code?: string | null
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
            referencedRelation: "public_profiles"
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
      product_share_events: {
        Row: {
          actor_user_id: string | null
          conversion_value: number | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          landing_page: string | null
          metadata: Json | null
          product_id: string
          referrer_url: string | null
          share_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          actor_user_id?: string | null
          conversion_value?: number | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          landing_page?: string | null
          metadata?: Json | null
          product_id: string
          referrer_url?: string | null
          share_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          actor_user_id?: string | null
          conversion_value?: number | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          landing_page?: string | null
          metadata?: Json | null
          product_id?: string
          referrer_url?: string | null
          share_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_share_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_share_events_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "product_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      product_shares: {
        Row: {
          click_count: number | null
          conversion_count: number | null
          created_at: string
          first_clicked_at: string | null
          first_converted_at: string | null
          id: string
          last_clicked_at: string | null
          personal_message: string | null
          product_id: string
          referrer_url: string | null
          share_platform: string
          share_token: string | null
          template_used: string | null
          total_conversion_value: number | null
          user_agent: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          first_clicked_at?: string | null
          first_converted_at?: string | null
          id?: string
          last_clicked_at?: string | null
          personal_message?: string | null
          product_id: string
          referrer_url?: string | null
          share_platform: string
          share_token?: string | null
          template_used?: string | null
          total_conversion_value?: number | null
          user_agent?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          first_clicked_at?: string | null
          first_converted_at?: string | null
          id?: string
          last_clicked_at?: string | null
          personal_message?: string | null
          product_id?: string
          referrer_url?: string | null
          share_platform?: string
          share_token?: string | null
          template_used?: string | null
          total_conversion_value?: number | null
          user_agent?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_shares_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          product_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_virality_alerts: {
        Row: {
          alert_date: string | null
          alert_type: string
          business_id: string
          conversion_rate: number | null
          conversion_value: number | null
          created_at: string | null
          current_clicks: number
          current_conversions: number
          current_shares: number
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          milestone_value: number | null
          period_type: string | null
          previous_shares: number | null
          product_id: string
          read_at: string | null
          severity: string
          share_growth_percentage: number | null
        }
        Insert: {
          alert_date?: string | null
          alert_type: string
          business_id: string
          conversion_rate?: number | null
          conversion_value?: number | null
          created_at?: string | null
          current_clicks?: number
          current_conversions?: number
          current_shares?: number
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          milestone_value?: number | null
          period_type?: string | null
          previous_shares?: number | null
          product_id: string
          read_at?: string | null
          severity?: string
          share_growth_percentage?: number | null
        }
        Update: {
          alert_date?: string | null
          alert_type?: string
          business_id?: string
          conversion_rate?: number | null
          conversion_value?: number | null
          created_at?: string | null
          current_clicks?: number
          current_conversions?: number
          current_shares?: number
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          milestone_value?: number | null
          period_type?: string | null
          previous_shares?: number | null
          product_id?: string
          read_at?: string | null
          severity?: string
          share_growth_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_virality_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_virality_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_virality_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_virality_alerts_product_id_fkey"
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
          country_code: string | null
          created_at: string
          currency: string | null
          description: string | null
          experience_type: string | null
          favorites_count: number | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_experience: boolean | null
          location_name: string | null
          name: string
          order_count: number | null
          popularity_score: number | null
          price: number
          stock_quantity: number | null
          updated_at: string
          video_thumbnail_url: string | null
          video_url: string | null
          videos: Json | null
          view_count: number | null
        }
        Insert: {
          business_account_id?: string | null
          business_category_id?: string | null
          business_id: string
          business_owner_id?: string | null
          category_id?: string | null
          category_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          experience_type?: string | null
          favorites_count?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_experience?: boolean | null
          location_name?: string | null
          name: string
          order_count?: number | null
          popularity_score?: number | null
          price: number
          stock_quantity?: number | null
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
          videos?: Json | null
          view_count?: number | null
        }
        Update: {
          business_account_id?: string | null
          business_category_id?: string | null
          business_id?: string
          business_owner_id?: string | null
          category_id?: string | null
          category_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          experience_type?: string | null
          favorites_count?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_experience?: boolean | null
          location_name?: string | null
          name?: string
          order_count?: number | null
          popularity_score?: number | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
          videos?: Json | null
          view_count?: number | null
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
            foreignKeyName: "products_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
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
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "deleted_businesses_with_admin"
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
      profile_completion_reminders: {
        Row: {
          channel: string
          clicked_at: string | null
          completed_after: boolean | null
          completion_at_send: number
          created_at: string
          id: string
          missing_fields: string[] | null
          opened_at: string | null
          reminder_number: number
          sent_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          clicked_at?: string | null
          completed_after?: boolean | null
          completion_at_send?: number
          created_at?: string
          id?: string
          missing_fields?: string[] | null
          opened_at?: string | null
          reminder_number?: number
          sent_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          completed_after?: boolean | null
          completion_at_send?: number
          created_at?: string
          id?: string
          missing_fields?: string[] | null
          opened_at?: string | null
          reminder_number?: number
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_reminder_settings: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          email_subject_1: string | null
          email_subject_2: string | null
          email_subject_3: string | null
          email_subject_final: string | null
          id: string
          in_app_enabled: boolean | null
          is_enabled: boolean | null
          max_reminders: number | null
          min_completion_threshold: number | null
          push_enabled: boolean | null
          reminder_1_days: number | null
          reminder_2_days: number | null
          reminder_3_days: number | null
          reminder_final_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          email_subject_1?: string | null
          email_subject_2?: string | null
          email_subject_3?: string | null
          email_subject_final?: string | null
          id?: string
          in_app_enabled?: boolean | null
          is_enabled?: boolean | null
          max_reminders?: number | null
          min_completion_threshold?: number | null
          push_enabled?: boolean | null
          reminder_1_days?: number | null
          reminder_2_days?: number | null
          reminder_3_days?: number | null
          reminder_final_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          email_subject_1?: string | null
          email_subject_2?: string | null
          email_subject_3?: string | null
          email_subject_final?: string | null
          id?: string
          in_app_enabled?: boolean | null
          is_enabled?: boolean | null
          max_reminders?: number | null
          min_completion_threshold?: number | null
          push_enabled?: boolean | null
          reminder_1_days?: number | null
          reminder_2_days?: number | null
          reminder_3_days?: number | null
          reminder_final_days?: number | null
          updated_at?: string
        }
        Relationships: []
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
          country_code: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          first_birthday_on_platform: string | null
          first_name: string | null
          id: string
          invitations_accepted: number | null
          invitations_sent: number | null
          is_deleted: boolean | null
          is_suspended: boolean | null
          last_name: string | null
          phone: string | null
          preferences: Json | null
          primary_referral_code: string | null
          privacy_setting: string
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
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          first_birthday_on_platform?: string | null
          first_name?: string | null
          id?: string
          invitations_accepted?: number | null
          invitations_sent?: number | null
          is_deleted?: boolean | null
          is_suspended?: boolean | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          primary_referral_code?: string | null
          privacy_setting?: string
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
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          first_birthday_on_platform?: string | null
          first_name?: string | null
          id?: string
          invitations_accepted?: number | null
          invitations_sent?: number | null
          is_deleted?: boolean | null
          is_suspended?: boolean | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          primary_referral_code?: string | null
          privacy_setting?: string
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
          {
            foreignKeyName: "reciprocity_tracking_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
            foreignKeyName: "refunds_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
            referencedRelation: "public_profiles"
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
          priority: string | null
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
          priority?: string | null
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
          priority?: string | null
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
      suggestion_feedback: {
        Row: {
          contact_id: string | null
          created_at: string | null
          feedback_reason: string | null
          feedback_type: string
          id: string
          match_score: number | null
          occasion: string | null
          price_at_feedback: number | null
          product_id: string | null
          recommendation_id: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          feedback_reason?: string | null
          feedback_type: string
          id?: string
          match_score?: number | null
          occasion?: string | null
          price_at_feedback?: number | null
          product_id?: string | null
          recommendation_id?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          feedback_reason?: string | null
          feedback_type?: string
          id?: string
          match_score?: number | null
          occasion?: string | null
          price_at_feedback?: number | null
          product_id?: string | null
          recommendation_id?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_feedback_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_feedback_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_limited"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_feedback_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "gift_recommendations"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "surprise_contributors_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
          {
            foreignKeyName: "fk_transaction_verifications_fund"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_account_merges: {
        Row: {
          created_at: string | null
          data_transferred: Json | null
          id: string
          merged_at: string | null
          merged_by: string | null
          primary_name: string | null
          primary_user_id: string
          secondary_name: string | null
          secondary_user_id: string
        }
        Insert: {
          created_at?: string | null
          data_transferred?: Json | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          primary_name?: string | null
          primary_user_id: string
          secondary_name?: string | null
          secondary_user_id: string
        }
        Update: {
          created_at?: string | null
          data_transferred?: Json | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          primary_name?: string | null
          primary_user_id?: string
          secondary_name?: string | null
          secondary_user_id?: string
        }
        Relationships: []
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
      user_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          is_recurring: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          is_recurring?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          title?: string
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
      virality_alert_thresholds: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metric_type: string
          milestone_values: number[] | null
          min_conversion_rate: number | null
          min_delay_hours: number | null
          notify_admin: boolean | null
          notify_business: boolean | null
          period_type: string | null
          spike_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metric_type: string
          milestone_values?: number[] | null
          min_conversion_rate?: number | null
          min_delay_hours?: number | null
          notify_admin?: boolean | null
          notify_business?: boolean | null
          period_type?: string | null
          spike_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metric_type?: string
          milestone_values?: number[] | null
          min_conversion_rate?: number | null
          min_delay_hours?: number | null
          notify_admin?: boolean | null
          notify_business?: boolean | null
          period_type?: string | null
          spike_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          context: Json | null
          created_at: string
          display_name: string | null
          id: string
          last_message_at: string | null
          phone_number: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          phone_number: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message_type: string
          metadata: Json | null
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          message_type?: string
          metadata?: Json | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      admin_sessions_safe: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          ip_address_display: string | null
          revoked_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          ip_address_display?: never
          revoked_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          ip_address_display?: never
          revoked_at?: string | null
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
      business_public_info: {
        Row: {
          business_name: string | null
          business_type: string | null
          created_at: string | null
          delivery_settings: Json | null
          delivery_zones: Json | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          opening_hours: Json | null
          status: string | null
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          status?: string | null
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          delivery_settings?: Json | null
          delivery_zones?: Json | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          opening_hours?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      collective_funds_public: {
        Row: {
          created_at: string | null
          currency: string | null
          current_amount: number | null
          deadline_date: string | null
          description: string | null
          id: string | null
          is_public: boolean | null
          occasion: string | null
          share_token: string | null
          status: string | null
          target_amount: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          current_amount?: number | null
          deadline_date?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          occasion?: string | null
          share_token?: string | null
          status?: string | null
          target_amount?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          current_amount?: number | null
          deadline_date?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          occasion?: string | null
          share_token?: string | null
          status?: string | null
          target_amount?: number | null
          title?: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "public_profiles"
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
      deleted_businesses_with_admin: {
        Row: {
          address: string | null
          archived_data: Json | null
          business_name: string | null
          business_type: string | null
          corrections_message: string | null
          created_at: string | null
          days_remaining: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_first_name: string | null
          deleted_by_last_name: string | null
          delivery_settings: Json | null
          delivery_zones: Json | null
          description: string | null
          email: string | null
          expires_at: string | null
          id: string | null
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
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Relationships: []
      }
      fund_contributions_safe: {
        Row: {
          amount: number | null
          contributor_id: string | null
          created_at: string | null
          currency: string | null
          fund_id: string | null
          id: string | null
          is_anonymous: boolean | null
          message: string | null
        }
        Insert: {
          amount?: number | null
          contributor_id?: never
          created_at?: string | null
          currency?: string | null
          fund_id?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          message?: string | null
        }
        Update: {
          amount?: number | null
          contributor_id?: never
          created_at?: string | null
          currency?: string | null
          fund_id?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_contributions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_contributions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
            referencedColumns: ["id"]
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
      product_share_analytics: {
        Row: {
          avg_conversion_value: number | null
          click_to_conversion_rate: number | null
          product_id: string | null
          share_platform: string | null
          share_to_click_rate: number | null
          total_clicks: number | null
          total_conversions: number | null
          total_revenue: number | null
          total_shares: number | null
          total_views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_shares_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_share_stats: {
        Row: {
          email_shares: number | null
          facebook_shares: number | null
          link_copies: number | null
          native_shares: number | null
          product_id: string | null
          shares_this_week: number | null
          shares_today: number | null
          sms_shares: number | null
          total_shares: number | null
          whatsapp_shares: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_shares_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          first_name: string | null
          privacy_setting: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          privacy_setting?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          privacy_setting?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transaction_verifications_safe: {
        Row: {
          beneficiary_contact_id: string | null
          blocked_until: string | null
          created_at: string | null
          expires_at: string | null
          fund_id: string | null
          id: string | null
          is_verified: boolean | null
          user_id: string | null
          verification_attempts: number | null
          verification_type: string | null
          verified_at: string | null
        }
        Insert: {
          beneficiary_contact_id?: string | null
          blocked_until?: string | null
          created_at?: string | null
          expires_at?: string | null
          fund_id?: string | null
          id?: string | null
          is_verified?: boolean | null
          user_id?: string | null
          verification_attempts?: number | null
          verification_type?: string | null
          verified_at?: string | null
        }
        Update: {
          beneficiary_contact_id?: string | null
          blocked_until?: string | null
          created_at?: string | null
          expires_at?: string | null
          fund_id?: string | null
          id?: string | null
          is_verified?: boolean | null
          user_id?: string | null
          verification_attempts?: number | null
          verification_type?: string | null
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
          {
            foreignKeyName: "fk_transaction_verifications_fund"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds_public"
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
      admin_can_access_country: {
        Args: { admin_user_id: string; country_code: string }
        Returns: boolean
      }
      archive_old_notifications: { Args: never; Returns: undefined }
      are_friends: {
        Args: { user_a_id: string; user_b_id: string }
        Returns: boolean
      }
      are_users_connected: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      are_users_friends: {
        Args: { user_a_id: string; user_b_id: string }
        Returns: boolean
      }
      award_user_badge: {
        Args: {
          p_awarded_for?: string
          p_badge_key: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
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
      calculate_product_popularity_score: {
        Args: {
          p_avg_rating: number
          p_favorites_count: number
          p_order_count: number
          p_rating_count: number
          p_share_count: number
          p_view_count: number
        }
        Returns: number
      }
      can_access_business_fund_data: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      can_contribute_to_fund: { Args: { fund_uuid: string }; Returns: boolean }
      can_see_business_fund_for_friend: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      can_see_fund_for_friend: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { target_user_id: string; viewer_id: string }
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
      cleanup_expired_pending_registrations: { Args: never; Returns: number }
      create_birthday_celebration: {
        Args: {
          p_age_at_celebration?: number
          p_celebration_year: number
          p_milestone_age?: boolean
          p_user_id: string
        }
        Returns: string
      }
      create_business_collective_fund:
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
      create_imbalance_alert: {
        Args: {
          p_alert_type: string
          p_details?: Json
          p_imbalance_score: number
          p_severity: string
          p_user_id: string
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
      get_admin_countries: {
        Args: { admin_user_id: string }
        Returns: string[]
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
      get_fund_creator_id: { Args: { p_fund_id: string }; Returns: string }
      get_invitation_stats: { Args: { user_uuid: string }; Returns: Json }
      get_product_category_name: {
        Args: { p_product_id: string }
        Returns: string
      }
      get_profile_privacy: { Args: { target_user_id: string }; Returns: string }
      get_public_profile_data: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          created_at: string
          first_name: string
          last_name: string
          user_id: string
        }[]
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
      get_user_email_for_admin: {
        Args: { target_user_id: string }
        Returns: string
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
      get_user_feedback_stats: {
        Args: { p_user_id: string }
        Returns: {
          accepted_count: number
          preferred_categories: Json
          purchased_count: number
          rejected_count: number
          saved_count: number
          top_rejection_reasons: Json
        }[]
      }
      get_user_profile_with_privacy: {
        Args: { p_target_user_id: string; p_viewer_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city: string
          first_name: string
          is_visible: boolean
          last_name: string
          privacy_setting: string
          user_id: string
        }[]
      }
      get_user_stats_for_admin: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_visible_profiles_for_posts: {
        Args: { p_user_ids: string[]; p_viewer_id: string }
        Returns: {
          avatar_url: string
          country_code: string
          first_name: string
          is_visible: boolean
          last_name: string
          user_id: string
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
      has_active_fund_for_contact: {
        Args: { p_contact_id: string }
        Returns: boolean
      }
      has_contributed_to_fund: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      increment_business_share_metrics: {
        Args: {
          p_conversion_value?: number
          p_event_type: string
          p_share_id: string
        }
        Returns: undefined
      }
      increment_gratitude_reaction: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      increment_share_metrics: {
        Args: {
          p_conversion_value?: number
          p_event_type: string
          p_share_token: string
        }
        Returns: undefined
      }
      is_active_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_beneficiary_of_surprise: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_business_owner_of_fund: {
        Args: { p_fund_id: string; p_user_id: string }
        Returns: boolean
      }
      is_business_owner_of_fund_order: {
        Args: { p_order_id: string; p_user_id: string }
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
      log_security_event:
        | {
            Args: {
              p_event_type: string
              p_ip_address?: string
              p_metadata?: Json
              p_severity?: string
              p_user_agent?: string
              p_user_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_action: string
              p_event_type: string
              p_ip_address: unknown
              p_metadata?: Json
              p_severity?: string
              p_target_user_id: string
              p_user_id: string
            }
            Returns: undefined
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
      process_pending_business_registration: {
        Args: { p_user_id: string }
        Returns: string
      }
      promote_to_super_admin: { Args: { admin_email: string }; Returns: string }
      promote_to_super_admin_by_phone: {
        Args: {
          admin_email: string
          admin_password: string
          phone_number: string
        }
        Returns: string
      }
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
      track_referral: {
        Args: {
          p_conversion_type?: string
          p_referral_code_id: string
          p_referred_user_id: string
        }
        Returns: string
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
      update_product_metrics: {
        Args: { p_product_id: string }
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
      user_can_access_fund: {
        Args: { p_fund_id: string; p_user_id: string }
        Returns: boolean
      }
      user_can_see_fund: {
        Args: { fund_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_has_contributed_to_fund: {
        Args: { p_fund_id: string; p_user_id: string }
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
