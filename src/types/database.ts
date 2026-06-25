export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];


export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          code: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_roles: {
        Row: {
          code: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          role_code: string;
          permission_code: string;
          created_at: string;
        };
        Insert: {
          role_code: string;
          permission_code: string;
          created_at?: string;
        };
        Update: {
          role_code?: string;
          permission_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          occurred_at: string;
          actor_id: string | null;
          actor_name: string | null;
          actor_email: string | null;
          actor_role: string | null;
          entity_type: string;
          entity_id: string | null;
          entity_label: string | null;
          event_type: string;
          message: string;
          details: Json;
          source: string;
        };
        Insert: {
          id?: never;
          occurred_at?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_email?: string | null;
          actor_role?: string | null;
          entity_type: string;
          entity_id?: string | null;
          entity_label?: string | null;
          event_type: string;
          message: string;
          details?: Json;
          source?: string;
        };
        Update: {
          id?: never;
          occurred_at?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_email?: string | null;
          actor_role?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          entity_label?: string | null;
          event_type?: string;
          message?: string;
          details?: Json;
          source?: string;
        };
        Relationships: [];
      };
      priority_levels: {
        Row: {
          code: string;
          name: string;
          sort_order: number;
          tone: string;
          sla_days: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          name: string;
          sort_order: number;
          tone?: string;
          sla_days?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          sort_order?: number;
          tone?: string;
          sla_days?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      action_statuses: {
        Row: {
          code: string;
          name: string;
          sort_order: number;
          tone: string;
          is_terminal: boolean;
          requires_completion_date: boolean;
          requires_verification_date: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          name: string;
          sort_order: number;
          tone?: string;
          is_terminal?: boolean;
          requires_completion_date?: boolean;
          requires_verification_date?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          sort_order?: number;
          tone?: string;
          is_terminal?: boolean;
          requires_completion_date?: boolean;
          requires_verification_date?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      source_types: {
        Row: {
          code: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          name: string;
          sort_order: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommendation_categories: {
        Row: {
          id: string;
          code: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          employee_code: string | null;
          full_name: string;
          email: string;
          department_id: string | null;
          role_code: string;
          job_title: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_code?: string | null;
          full_name: string;
          email: string;
          department_id?: string | null;
          role_code: string;
          job_title?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_code?: string | null;
          full_name?: string;
          email?: string;
          department_id?: string | null;
          role_code?: string;
          job_title?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          }
        ];
      };
      sources: {
        Row: {
          id: string;
          source_no: string;
          source_type_code: string;
          title: string;
          reference_no: string | null;
          source_date: string;
          department_id: string | null;
          summary: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_no: string;
          source_type_code: string;
          title: string;
          reference_no?: string | null;
          source_date: string;
          department_id?: string | null;
          summary?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_no?: string;
          source_type_code?: string;
          title?: string;
          reference_no?: string | null;
          source_date?: string;
          department_id?: string | null;
          summary?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          source_id: string;
          recommendation_no: string;
          recommendation_text: string;
          category_id: string | null;
          priority_code: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          recommendation_no: string;
          recommendation_text: string;
          category_id?: string | null;
          priority_code?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          recommendation_no?: string;
          recommendation_text?: string;
          category_id?: string | null;
          priority_code?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      actions: {
        Row: {
          id: string;
          recommendation_id: string;
          action_no: string;
          title: string;
          description: string | null;
          responsible_user_id: string | null;
          responsible_name_manual: string | null;
          owner_user_id: string | null;
          owner_name_manual: string | null;
          verifier_user_id: string | null;
          verifier_name_manual: string | null;
          priority_code: string;
          status_code: string;
          start_date: string | null;
          due_date: string;
          completed_date: string | null;
          verified_date: string | null;
          progress_percent: number;
          latest_extension_until: string | null;
          extension_reason: string | null;
          evidence_summary: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recommendation_id: string;
          action_no: string;
          title: string;
          description?: string | null;
          responsible_user_id?: string | null;
          responsible_name_manual?: string | null;
          owner_user_id?: string | null;
          owner_name_manual?: string | null;
          verifier_user_id?: string | null;
          verifier_name_manual?: string | null;
          priority_code: string;
          status_code: string;
          start_date?: string | null;
          due_date: string;
          completed_date?: string | null;
          verified_date?: string | null;
          progress_percent?: number;
          latest_extension_until?: string | null;
          extension_reason?: string | null;
          evidence_summary?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recommendation_id?: string;
          action_no?: string;
          title?: string;
          description?: string | null;
          responsible_user_id?: string | null;
          responsible_name_manual?: string | null;
          owner_user_id?: string | null;
          owner_name_manual?: string | null;
          verifier_user_id?: string | null;
          verifier_name_manual?: string | null;
          priority_code?: string;
          status_code?: string;
          start_date?: string | null;
          due_date?: string;
          completed_date?: string | null;
          verified_date?: string | null;
          progress_percent?: number;
          latest_extension_until?: string | null;
          extension_reason?: string | null;
          evidence_summary?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      action_updates: {
        Row: {
          id: string;
          action_id: string;
          update_date: string;
          progress_note: string;
          progress_percent: number | null;
          status_code: string | null;
          next_follow_up_date: string | null;
          updated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action_id: string;
          update_date?: string;
          progress_note: string;
          progress_percent?: number | null;
          status_code?: string | null;
          next_follow_up_date?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action_id?: string;
          update_date?: string;
          progress_note?: string;
          progress_percent?: number | null;
          status_code?: string | null;
          next_follow_up_date?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      action_attachments: {
        Row: {
          id: string;
          action_id: string;
          bucket_name: string;
          file_name: string;
          file_path: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          description: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          action_id: string;
          bucket_name?: string;
          file_name: string;
          file_path: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          description?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          action_id?: string;
          bucket_name?: string;
          file_name?: string;
          file_path?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          description?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      action_extension_requests: {
        Row: {
          id: string;
          action_id: string;
          requested_until: string;
          previous_due_date: string | null;
          reason: string;
          request_status: "pending" | "approved" | "rejected" | "cancelled";
          requested_by: string | null;
          decided_by: string | null;
          decided_at: string | null;
          decision_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          action_id: string;
          requested_until: string;
          previous_due_date?: string | null;
          reason: string;
          request_status?: "pending" | "approved" | "rejected" | "cancelled";
          requested_by?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          decision_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          action_id?: string;
          requested_until?: string;
          previous_due_date?: string | null;
          reason?: string;
          request_status?: "pending" | "approved" | "rejected" | "cancelled";
          requested_by?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          decision_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      action_history: {
        Row: {
          id: number;
          action_id: string;
          field_name: string;
          old_value: Json | null;
          new_value: Json | null;
          changed_by: string | null;
          changed_at: string;
          change_source: string;
        };
        Insert: {
          id?: never;
          action_id: string;
          field_name: string;
          old_value?: Json | null;
          new_value?: Json | null;
          changed_by?: string | null;
          changed_at?: string;
          change_source?: string;
        };
        Update: {
          id?: never;
          action_id?: string;
          field_name?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          changed_by?: string | null;
          changed_at?: string;
          change_source?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_action_summary: {
        Row: {
          action_id: string;
          action_no: string;
          action_title: string;
          action_description: string | null;
          status_code: string;
          status_name: string | null;
          priority_code: string;
          priority_name: string | null;
          priority_sort_order: number | null;
          progress_percent: number;
          start_date: string | null;
          due_date: string;
          completed_date: string | null;
          verified_date: string | null;
          latest_extension_until: string | null;
          extension_reason: string | null;
          evidence_summary: string | null;
          days_to_due: number | null;
          is_overdue: boolean | null;
          created_at: string;
          updated_at: string;
          recommendation_id: string;
          recommendation_no: string;
          recommendation_text: string;
          category_code: string | null;
          category_name: string | null;
          source_id: string;
          source_no: string;
          source_title: string;
          reference_no: string | null;
          source_date: string;
          source_type_code: string;
          source_type_name: string | null;
          department_code: string | null;
          department_name: string | null;
          responsible_user_id: string | null;
          responsible_name: string | null;
          owner_user_id: string | null;
          owner_name: string | null;
          verifier_user_id: string | null;
          verifier_name: string | null;
        };
        Relationships: [];
      };
      v_overdue_actions: {
        Row: {
          action_id: string;
          action_no: string;
          action_title: string;
          action_description: string | null;
          status_code: string;
          status_name: string | null;
          priority_code: string;
          priority_name: string | null;
          priority_sort_order: number | null;
          progress_percent: number;
          start_date: string | null;
          due_date: string;
          completed_date: string | null;
          verified_date: string | null;
          latest_extension_until: string | null;
          extension_reason: string | null;
          evidence_summary: string | null;
          days_to_due: number | null;
          is_overdue: boolean | null;
          created_at: string;
          updated_at: string;
          recommendation_id: string;
          recommendation_no: string;
          recommendation_text: string;
          category_code: string | null;
          category_name: string | null;
          source_id: string;
          source_no: string;
          source_title: string;
          reference_no: string | null;
          source_date: string;
          source_type_code: string;
          source_type_name: string | null;
          department_code: string | null;
          department_name: string | null;
          responsible_user_id: string | null;
          responsible_name: string | null;
          owner_user_id: string | null;
          owner_name: string | null;
          verifier_user_id: string | null;
          verifier_name: string | null;
        };
        Relationships: [];
      };
      v_source_progress_summary: {
        Row: {
          source_id: string;
          source_no: string;
          source_title: string;
          source_date: string;
          source_type_code: string;
          source_type_name: string | null;
          department_code: string | null;
          department_name: string | null;
          total_actions: number;
          open_actions: number;
          closed_actions: number;
          verified_actions: number;
          overdue_actions: number;
          closure_percent: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      has_role_permission: {
        Args: {
          p_permission_code: string;
        };
        Returns: boolean;
      };
      is_admin_or_manager: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_action_participant: {
        Args: {
          p_action_id: string;
        };
        Returns: boolean;
      };
      set_role_permissions: {
        Args: {
          p_role_code: string;
          p_permission_codes: string[];
        };
        Returns: undefined;
      };
      preview_source_number: {
        Args: {
          p_source_type_code: string;
          p_source_date: string;
        };
        Returns: string;
      };
      preview_source_number_v2: {
        Args: {
          p_source_date: string;
          p_source_type_code: string;
        };
        Returns: string;
      };
      preview_recommendation_number: {
        Args: {
          p_source_id: string;
        };
        Returns: string;
      };
      preview_recommendation_number_v2: {
        Args: {
          p_source_id: string;
        };
        Returns: string;
      };
      preview_action_number: {
        Args: {
          p_recommendation_id: string;
        };
        Returns: string;
      };
      preview_action_number_v2: {
        Args: {
          p_recommendation_id: string;
        };
        Returns: string;
      };
      write_audit_log: {
        Args: {
          p_entity_type: string;
          p_event_type: string;
          p_entity_id?: string | null;
          p_entity_label?: string | null;
          p_message?: string | null;
          p_details?: Json;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
