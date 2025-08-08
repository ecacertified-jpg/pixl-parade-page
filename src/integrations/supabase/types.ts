export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          ip_address: unknown | null
          revoked_at: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          revoked_at?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
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
          last_login_ip: unknown | null
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
          last_login_ip?: unknown | null
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
          last_login_ip?: unknown | null
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
      collective_funds: {
        Row: {
          allow_anonymous_contributions: boolean | null
          beneficiary_contact_id: string | null
          created_at: string
          creator_id: string
          currency: string | null
          current_amount: number | null
          deadline_date: string | null
          description: string | null
          id: string
          is_public: boolean | null
          occasion: string | null
          share_token: string | null
          status: string | null
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          allow_anonymous_contributions?: boolean | null
          beneficiary_contact_id?: string | null
          created_at?: string
          creator_id: string
          currency?: string | null
          current_amount?: number | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          occasion?: string | null
          share_token?: string | null
          status?: string | null
          target_amount: number
          title: string
          updated_at?: string
        }
        Update: {
          allow_anonymous_contributions?: boolean | null
          beneficiary_contact_id?: string | null
          created_at?: string
          creator_id?: string
          currency?: string | null
          current_amount?: number | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          occasion?: string | null
          share_token?: string | null
          status?: string | null
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
            foreignKeyName: "collective_funds_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
            foreignKeyName: "fund_contributions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
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
        ]
      }
      gifts: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          gift_date: string
          gift_description: string | null
          gift_name: string
          giver_id: string
          id: string
          occasion: string | null
          product_id: string | null
          receiver_id: string
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          gift_date: string
          gift_description?: string | null
          gift_name: string
          giver_id: string
          id?: string
          occasion?: string | null
          product_id?: string | null
          receiver_id: string
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          gift_date?: string
          gift_description?: string | null
          gift_name?: string
          giver_id?: string
          id?: string
          occasion?: string | null
          product_id?: string | null
          receiver_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gifts_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          scheduled_for: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          scheduled_for?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
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
      products: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          name: string
          price: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
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
          city: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
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
      scheduled_notifications: {
        Row: {
          contact_id: string | null
          created_at: string
          delivery_methods: string[]
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          delivery_methods: string[]
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          delivery_methods?: string[]
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
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
        ]
      }
      security_events: {
        Row: {
          admin_user_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
            foreignKeyName: "fk_transaction_verifications_fund"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "collective_funds"
            referencedColumns: ["id"]
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
      fund_activities_secure: {
        Row: {
          activity_type: string | null
          amount: number | null
          created_at: string | null
          currency: string | null
          fund_id: string | null
          id: string | null
          message: string | null
          metadata: Json | null
        }
        Insert: {
          activity_type?: string | null
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          fund_id?: string | null
          id?: string | null
          message?: never
          metadata?: Json | null
        }
        Update: {
          activity_type?: string | null
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          fund_id?: string | null
          id?: string | null
          message?: never
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
    }
    Functions: {
      add_loyalty_points: {
        Args: {
          p_user_id: string
          p_points: number
          p_source_type: string
          p_source_id?: string
          p_description?: string
        }
        Returns: undefined
      }
      are_users_connected: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      calculate_loyalty_points: {
        Args: { p_activity_type: string; p_amount?: number }
        Returns: number
      }
      can_contribute_to_fund: {
        Args: { fund_uuid: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_bucket_type: string
          p_max_tokens?: number
          p_refill_rate?: number
        }
        Returns: boolean
      }
      create_fund_activity: {
        Args: {
          p_fund_id: string
          p_contributor_id: string
          p_activity_type: string
          p_amount?: number
          p_message?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_transaction_verification: {
        Args: {
          p_user_id: string
          p_fund_id: string
          p_beneficiary_contact_id: string
          p_verification_type?: string
        }
        Returns: string
      }
      create_transaction_verification_with_rate_limit: {
        Args: {
          p_user_id: string
          p_fund_id: string
          p_beneficiary_contact_id: string
          p_verification_type?: string
          p_ip_address?: unknown
          p_device_fingerprint?: string
        }
        Returns: string
      }
      decrypt_instagram_token: {
        Args: { p_encrypted_token: string }
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key_id?: string }
        Returns: string
      }
      detect_suspicious_behavior: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      encrypt_instagram_token: {
        Args: { p_token: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string; key_id?: string }
        Returns: string
      }
      generate_event_analytics: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      handle_failed_verification: {
        Args: { p_verification_id: string }
        Returns: undefined
      }
      is_first_payment_to_beneficiary: {
        Args: { p_user_id: string; p_beneficiary_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_user_id?: string
          p_admin_user_id?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_event_data?: Json
          p_severity?: string
        }
        Returns: string
      }
      mask_contributor_info: {
        Args: { name: string; is_anonymous?: boolean }
        Returns: string
      }
      process_expired_funds: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      request_contact_relationship: {
        Args: { p_target_user_id: string; p_message?: string }
        Returns: string
      }
      respond_to_contact_request: {
        Args: { p_request_id: string; p_accept: boolean }
        Returns: boolean
      }
      spend_loyalty_points: {
        Args: {
          p_user_id: string
          p_points: number
          p_source_type: string
          p_source_id?: string
          p_description?: string
        }
        Returns: boolean
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
