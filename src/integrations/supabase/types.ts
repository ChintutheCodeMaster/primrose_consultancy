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
    PostgrestVersion: "13.0.5"
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
          is_paid: boolean | null
          meeting_summary: string | null
          name: string
          package_cost: number | null
          package_notes: string | null
          payment_date: string | null
          payment_notes: string | null
          payment_reminder_date: string | null
          payment_type: string | null
          phone: string | null
          program: string | null
          signed_agreement: boolean | null
          source: string | null
          start_date: string | null
          status: string
          target_country: string | null
          target_university: string | null
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
          is_paid?: boolean | null
          meeting_summary?: string | null
          name: string
          package_cost?: number | null
          package_notes?: string | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_reminder_date?: string | null
          payment_type?: string | null
          phone?: string | null
          program?: string | null
          signed_agreement?: boolean | null
          source?: string | null
          start_date?: string | null
          status?: string
          target_country?: string | null
          target_university?: string | null
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
          is_paid?: boolean | null
          meeting_summary?: string | null
          name?: string
          package_cost?: number | null
          package_notes?: string | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_reminder_date?: string | null
          payment_type?: string | null
          phone?: string | null
          program?: string | null
          signed_agreement?: boolean | null
          source?: string | null
          start_date?: string | null
          status?: string
          target_country?: string | null
          target_university?: string | null
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
