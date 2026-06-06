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
      accepted_universities: {
        Row: {
          acceptance_letter_url: string | null
          country: string | null
          created_at: string
          degree_type: string | null
          degree_type_other: string | null
          field: string | null
          id: string
          name: string
          student_id: string
          study_year: string | null
        }
        Insert: {
          acceptance_letter_url?: string | null
          country?: string | null
          created_at?: string
          degree_type?: string | null
          degree_type_other?: string | null
          field?: string | null
          id?: string
          name: string
          student_id: string
          study_year?: string | null
        }
        Update: {
          acceptance_letter_url?: string | null
          country?: string | null
          created_at?: string
          degree_type?: string | null
          degree_type_other?: string | null
          field?: string | null
          id?: string
          name?: string
          student_id?: string
          study_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accepted_universities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      advisors: {
        Row: {
          contract_url: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_amount: number | null
          payment_notes: string | null
          payment_type: string | null
          phone: string | null
          portal_password: string | null
          residence: string | null
        }
        Insert: {
          contract_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_amount?: number | null
          payment_notes?: string | null
          payment_type?: string | null
          phone?: string | null
          portal_password?: string | null
          residence?: string | null
        }
        Update: {
          contract_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_amount?: number | null
          payment_notes?: string | null
          payment_type?: string | null
          phone?: string | null
          portal_password?: string | null
          residence?: string | null
        }
        Relationships: []
      }
      agreement_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
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
      applied_universities: {
        Row: {
          application_status: string | null
          country: string | null
          created_at: string
          degree_type: string | null
          degree_type_other: string | null
          field: string | null
          id: string
          name: string
          notes: string | null
          student_id: string
          study_year: string | null
        }
        Insert: {
          application_status?: string | null
          country?: string | null
          created_at?: string
          degree_type?: string | null
          degree_type_other?: string | null
          field?: string | null
          id?: string
          name: string
          notes?: string | null
          student_id: string
          study_year?: string | null
        }
        Update: {
          application_status?: string | null
          country?: string | null
          created_at?: string
          degree_type?: string | null
          degree_type_other?: string | null
          field?: string | null
          id?: string
          name?: string
          notes?: string | null
          student_id?: string
          study_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applied_universities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_percentiles: {
        Row: {
          computed_at: string
          id: string
          metric: string
          p25: number | null
          p50: number | null
          p75: number | null
          period: string
          sample_size: number
        }
        Insert: {
          computed_at?: string
          id?: string
          metric: string
          p25?: number | null
          p50?: number | null
          p75?: number | null
          period: string
          sample_size?: number
        }
        Update: {
          computed_at?: string
          id?: string
          metric?: string
          p25?: number | null
          p50?: number | null
          p75?: number | null
          period?: string
          sample_size?: number
        }
        Relationships: []
      }
      collaborations: {
        Row: {
          category: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      college_reference: {
        Row: {
          acceptance_rate: number | null
          city: string | null
          created_at: string
          id: string
          is_common_app: boolean | null
          is_test_optional: boolean | null
          median_act: number | null
          median_sat: number | null
          name: string
          ranking_tier: string | null
          setting: string | null
          size: number | null
          state: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          city?: string | null
          created_at?: string
          id?: string
          is_common_app?: boolean | null
          is_test_optional?: boolean | null
          median_act?: number | null
          median_sat?: number | null
          name: string
          ranking_tier?: string | null
          setting?: string | null
          size?: number | null
          state?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          city?: string | null
          created_at?: string
          id?: string
          is_common_app?: boolean | null
          is_test_optional?: boolean | null
          median_act?: number | null
          median_sat?: number | null
          name?: string
          ranking_tier?: string | null
          setting?: string | null
          size?: number | null
          state?: string | null
        }
        Relationships: []
      }
      country_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      field_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          advisor_name: string | null
          created_at: string
          degree_type: string
          did_not_continue: boolean | null
          discontinue_reason: string | null
          email: string | null
          id: string
          interested_country: string | null
          interested_field: string | null
          is_from_website: boolean
          last_contact_at: string
          leads_year: string | null
          meeting_summary: string | null
          name: string
          package_notes: string | null
          phone: string | null
          source: string | null
          status: string
          website_inquiry: string | null
        }
        Insert: {
          advisor_name?: string | null
          created_at?: string
          degree_type?: string
          did_not_continue?: boolean | null
          discontinue_reason?: string | null
          email?: string | null
          id?: string
          interested_country?: string | null
          interested_field?: string | null
          is_from_website?: boolean
          last_contact_at?: string
          leads_year?: string | null
          meeting_summary?: string | null
          name: string
          package_notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          website_inquiry?: string | null
        }
        Update: {
          advisor_name?: string | null
          created_at?: string
          degree_type?: string
          did_not_continue?: boolean | null
          discontinue_reason?: string | null
          email?: string | null
          id?: string
          interested_country?: string | null
          interested_field?: string | null
          is_from_website?: boolean
          last_contact_at?: string
          leads_year?: string | null
          meeting_summary?: string | null
          name?: string
          package_notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          website_inquiry?: string | null
        }
        Relationships: []
      }
      leads_year_settings: {
        Row: {
          created_at: string
          current_year: string
          id: string
          next_year: string
          transition_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_year: string
          id?: string
          next_year: string
          transition_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_year?: string
          id?: string
          next_year?: string
          transition_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_benchmark_settings: {
        Row: {
          created_at: string
          id: string
          last_computed_at: string | null
          metrics: Json
          opted_in: boolean
          org_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_computed_at?: string | null
          metrics?: Json
          opted_in?: boolean
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_computed_at?: string | null
          metrics?: Json
          opted_in?: boolean
          org_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      outcomes_share_tokens: {
        Row: {
          cohort_year: number
          config: Json
          created_at: string
          id: string
          status: string
          token: string
        }
        Insert: {
          cohort_year: number
          config?: Json
          created_at?: string
          id?: string
          status?: string
          token: string
        }
        Update: {
          cohort_year?: number
          config?: Json
          created_at?: string
          id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          amount: number | null
          category: string | null
          collaboration_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          description: string | null
          file_url: string | null
          id: string
          invoice_date: string | null
          name: string
          net_amount: number | null
          notes: string | null
          payment_date: string | null
          payment_direction: string
          payment_notes: string | null
          payment_request_date: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          collaboration_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          name: string
          net_amount?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_direction?: string
          payment_notes?: string | null
          payment_request_date?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          collaboration_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          name?: string
          net_amount?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_direction?: string
          payment_notes?: string | null
          payment_request_date?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_options: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      sidebar_categories: {
        Row: {
          category_type: string
          created_at: string
          display_label: string
          id: string
          is_active: boolean
          sort_order: number
          year_value: string
        }
        Insert: {
          category_type: string
          created_at?: string
          display_label: string
          id?: string
          is_active?: boolean
          sort_order?: number
          year_value: string
        }
        Update: {
          category_type?: string
          created_at?: string
          display_label?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          year_value?: string
        }
        Relationships: []
      }
      source_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      student_agreements: {
        Row: {
          address: string
          birth_date: string
          created_at: string
          email: string
          first_name: string
          id: string
          id_number: string
          ip_address: string | null
          last_name: string
          linkedin_profile: string | null
          mba_package_other: string | null
          mba_package_selections: string[] | null
          mba_payment_option: string | null
          mba_payment_other: string | null
          notification_dismissed: boolean | null
          phone: string
          signed_at: string
          student_id: string
          user_agent: string | null
        }
        Insert: {
          address: string
          birth_date: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          id_number: string
          ip_address?: string | null
          last_name: string
          linkedin_profile?: string | null
          mba_package_other?: string | null
          mba_package_selections?: string[] | null
          mba_payment_option?: string | null
          mba_payment_other?: string | null
          notification_dismissed?: boolean | null
          phone: string
          signed_at?: string
          student_id: string
          user_agent?: string | null
        }
        Update: {
          address?: string
          birth_date?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          id_number?: string
          ip_address?: string | null
          last_name?: string
          linkedin_profile?: string | null
          mba_package_other?: string | null
          mba_package_selections?: string[] | null
          mba_payment_option?: string | null
          mba_payment_other?: string | null
          notification_dismissed?: boolean | null
          phone?: string
          signed_at?: string
          student_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_agreements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_ai_sessions: {
        Row: {
          created_at: string
          id: string
          input_text: string | null
          mode: string
          output_json: Json | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_text?: string | null
          mode: string
          output_json?: Json | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_text?: string | null
          mode?: string
          output_json?: Json | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_ai_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_calendar_events: {
        Row: {
          all_day: boolean
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          event_type: string
          id: string
          location: string | null
          reminder_minutes_before: number | null
          start_at: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          reminder_minutes_before?: number | null
          start_at: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          reminder_minutes_before?: number | null
          start_at?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_calendar_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_checklist_items: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          sort_order: number | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_checklist_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_colleges: {
        Row: {
          application_id: string | null
          application_plan: string | null
          college_name: string
          country: string | null
          created_at: string
          deadline: string | null
          decision_at: string | null
          essays_status: string | null
          id: string
          list_bucket: string
          locked_at: string | null
          notes: string | null
          portal_url: string | null
          recs_status: string | null
          scholarship_amount: number | null
          sort_order: number
          status: string
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          application_plan?: string | null
          college_name: string
          country?: string | null
          created_at?: string
          deadline?: string | null
          decision_at?: string | null
          essays_status?: string | null
          id?: string
          list_bucket?: string
          locked_at?: string | null
          notes?: string | null
          portal_url?: string | null
          recs_status?: string | null
          scholarship_amount?: number | null
          sort_order?: number
          status?: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          application_plan?: string | null
          college_name?: string
          country?: string | null
          created_at?: string
          deadline?: string | null
          decision_at?: string | null
          essays_status?: string | null
          id?: string
          list_bucket?: string
          locked_at?: string | null
          notes?: string | null
          portal_url?: string | null
          recs_status?: string | null
          scholarship_amount?: number | null
          sort_order?: number
          status?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_colleges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_conversations: {
        Row: {
          advisor_id: string | null
          conversation_date: string
          created_at: string
          created_by: string
          follow_up_actions: string | null
          id: string
          student_id: string
          summary: string
        }
        Insert: {
          advisor_id?: string | null
          conversation_date?: string
          created_at?: string
          created_by?: string
          follow_up_actions?: string | null
          id?: string
          student_id: string
          summary: string
        }
        Update: {
          advisor_id?: string | null
          conversation_date?: string
          created_at?: string
          created_by?: string
          follow_up_actions?: string | null
          id?: string
          student_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_conversations_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_document_comments: {
        Row: {
          anchor_end: number | null
          anchor_start: number | null
          author: string
          body: string
          created_at: string
          id: string
          resolved_at: string | null
          version_id: string
        }
        Insert: {
          anchor_end?: number | null
          anchor_start?: number | null
          author: string
          body: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          version_id: string
        }
        Update: {
          anchor_end?: number | null
          anchor_start?: number | null
          author?: string
          body?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_document_comments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "student_document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_document_versions: {
        Row: {
          body_text: string | null
          created_at: string
          created_by: string
          document_id: string
          file_mime: string | null
          file_url: string | null
          id: string
          status: string
          version_no: number
          word_count: number | null
        }
        Insert: {
          body_text?: string | null
          created_at?: string
          created_by?: string
          document_id: string
          file_mime?: string | null
          file_url?: string | null
          id?: string
          status?: string
          version_no?: number
          word_count?: number | null
        }
        Update: {
          body_text?: string | null
          created_at?: string
          created_by?: string
          document_id?: string
          file_mime?: string | null
          file_url?: string | null
          id?: string
          status?: string
          version_no?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "student_documents_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_url: string
          id: string
          name: string
          student_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          name: string
          student_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          name?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents_v2: {
        Row: {
          created_at: string
          file_path: string | null
          folder: string | null
          id: string
          kind: string
          prompt_text: string | null
          requested_by: string | null
          review_status: string | null
          status: string
          student_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          folder?: string | null
          id?: string
          kind?: string
          prompt_text?: string | null
          requested_by?: string | null
          review_status?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          folder?: string | null
          id?: string
          kind?: string
          prompt_text?: string | null
          requested_by?: string | null
          review_status?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_v2_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_messages: {
        Row: {
          attachment_path: string | null
          attachment_url: string | null
          author: string
          body: string
          cc_parent: boolean | null
          created_at: string
          id: string
          read_at: string | null
          student_id: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_url?: string | null
          author: string
          body: string
          cc_parent?: boolean | null
          created_at?: string
          id?: string
          read_at?: string | null
          student_id: string
        }
        Update: {
          attachment_path?: string | null
          attachment_url?: string | null
          author?: string
          body?: string
          cc_parent?: boolean | null
          created_at?: string
          id?: string
          read_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_portal_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_seen_at: string | null
          status: string
          student_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          status?: string
          student_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          status?: string
          student_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_portal_tokens_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profile_extras: {
        Row: {
          about_me: string | null
          act_score: number | null
          activities: Json | null
          awards: Json | null
          career_goals: string | null
          class_rank: string | null
          counselor_notes: string | null
          created_at: string
          current_school: string | null
          duolingo_score: number | null
          extracurriculars: string | null
          gpa: number | null
          gpa_scale: number | null
          graduation_year: string | null
          hooks: string | null
          id: string
          ielts_score: number | null
          intended_majors: string[]
          notes: string | null
          onboarded_at: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          sat_score: number | null
          student_id: string
          toefl_score: number | null
          updated_at: string
        }
        Insert: {
          about_me?: string | null
          act_score?: number | null
          activities?: Json | null
          awards?: Json | null
          career_goals?: string | null
          class_rank?: string | null
          counselor_notes?: string | null
          created_at?: string
          current_school?: string | null
          duolingo_score?: number | null
          extracurriculars?: string | null
          gpa?: number | null
          gpa_scale?: number | null
          graduation_year?: string | null
          hooks?: string | null
          id?: string
          ielts_score?: number | null
          intended_majors?: string[]
          notes?: string | null
          onboarded_at?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          sat_score?: number | null
          student_id: string
          toefl_score?: number | null
          updated_at?: string
        }
        Update: {
          about_me?: string | null
          act_score?: number | null
          activities?: Json | null
          awards?: Json | null
          career_goals?: string | null
          class_rank?: string | null
          counselor_notes?: string | null
          created_at?: string
          current_school?: string | null
          duolingo_score?: number | null
          extracurriculars?: string | null
          gpa?: number | null
          gpa_scale?: number | null
          graduation_year?: string | null
          hooks?: string | null
          id?: string
          ielts_score?: number | null
          intended_majors?: string[]
          notes?: string | null
          onboarded_at?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          sat_score?: number | null
          student_id?: string
          toefl_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profile_extras_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_scholarships: {
        Row: {
          amount: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          student_id: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          student_id: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_scholarships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_strategy_reviews: {
        Row: {
          created_at: string
          id: string
          input_snapshot: Json
          mode: string
          output_json: Json
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_snapshot: Json
          mode?: string
          output_json: Json
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_snapshot?: Json
          mode?: string
          output_json?: Json
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_strategy_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_tasks: {
        Row: {
          college_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          link_url: string | null
          sort_order: number
          status: string
          student_id: string
          template_key: string | null
          title: string
          updated_at: string
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          link_url?: string | null
          sort_order?: number
          status?: string
          student_id: string
          template_key?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          college_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          link_url?: string | null
          sort_order?: number
          status?: string
          student_id?: string
          template_key?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_tasks_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "student_colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          advisor_id: string | null
          advisor_name: string | null
          advisor_payment_notes: string | null
          agreement_reminder_date: string | null
          amount_paid: number | null
          created_at: string
          degree_type: string
          did_not_continue: boolean | null
          discontinue_reason: string | null
          dismissed_from_attention: boolean | null
          email: string | null
          follow_up_reminder_date: string | null
          follow_up_reminder_dismissed: boolean | null
          follow_up_reminder_note: string | null
          graduation_year: string | null
          id: string
          interested_country: string | null
          interested_field: string | null
          is_from_website: boolean | null
          is_paid: boolean | null
          meeting_summary: string | null
          name: string
          package_cost: number | null
          package_notes: string | null
          payment_date: string | null
          payment_notes: string | null
          payment_reminder_date: string | null
          payment_type: string | null
          phase: string | null
          phone: string | null
          preferred_name: string | null
          program: string | null
          signed_agreement: boolean | null
          source: string | null
          start_date: string | null
          status: string
          target_country: string | null
          target_university: string | null
          website_inquiry: string | null
        }
        Insert: {
          advisor_id?: string | null
          advisor_name?: string | null
          advisor_payment_notes?: string | null
          agreement_reminder_date?: string | null
          amount_paid?: number | null
          created_at?: string
          degree_type?: string
          did_not_continue?: boolean | null
          discontinue_reason?: string | null
          dismissed_from_attention?: boolean | null
          email?: string | null
          follow_up_reminder_date?: string | null
          follow_up_reminder_dismissed?: boolean | null
          follow_up_reminder_note?: string | null
          graduation_year?: string | null
          id?: string
          interested_country?: string | null
          interested_field?: string | null
          is_from_website?: boolean | null
          is_paid?: boolean | null
          meeting_summary?: string | null
          name: string
          package_cost?: number | null
          package_notes?: string | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_reminder_date?: string | null
          payment_type?: string | null
          phase?: string | null
          phone?: string | null
          preferred_name?: string | null
          program?: string | null
          signed_agreement?: boolean | null
          source?: string | null
          start_date?: string | null
          status?: string
          target_country?: string | null
          target_university?: string | null
          website_inquiry?: string | null
        }
        Update: {
          advisor_id?: string | null
          advisor_name?: string | null
          advisor_payment_notes?: string | null
          agreement_reminder_date?: string | null
          amount_paid?: number | null
          created_at?: string
          degree_type?: string
          did_not_continue?: boolean | null
          discontinue_reason?: string | null
          dismissed_from_attention?: boolean | null
          email?: string | null
          follow_up_reminder_date?: string | null
          follow_up_reminder_dismissed?: boolean | null
          follow_up_reminder_note?: string | null
          graduation_year?: string | null
          id?: string
          interested_country?: string | null
          interested_field?: string | null
          is_from_website?: boolean | null
          is_paid?: boolean | null
          meeting_summary?: string | null
          name?: string
          package_cost?: number | null
          package_notes?: string | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_reminder_date?: string | null
          payment_type?: string | null
          phase?: string | null
          phone?: string | null
          preferred_name?: string | null
          program?: string | null
          signed_agreement?: boolean | null
          source?: string | null
          start_date?: string | null
          status?: string
          target_country?: string | null
          target_university?: string | null
          website_inquiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
        ]
      }
      target_university_options: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
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
