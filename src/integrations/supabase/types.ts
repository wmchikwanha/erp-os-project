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
      activities: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          due_date: string | null
          id: string
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          type?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_tag: string | null
          assigned_to: string | null
          category: string
          condition: string
          created_at: string
          current_value: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          po_id: string | null
          project_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          site_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_tag?: string | null
          assigned_to?: string | null
          category?: string
          condition?: string
          created_at?: string
          current_value?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          po_id?: string | null
          project_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          site_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_tag?: string | null
          assigned_to?: string | null
          category?: string
          condition?: string
          created_at?: string
          current_value?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          po_id?: string | null
          project_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          site_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          category: string
          created_at: string
          currency: string
          id: string
          kind: string
          label: string | null
          notes: string | null
          period: string
          planned_amount: number
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          label?: string | null
          notes?: string | null
          period: string
          planned_amount?: number
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          label?: string | null
          notes?: string | null
          period?: string
          planned_amount?: number
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          applied_date: string
          created_at: string
          cv_file_path: string | null
          cv_file_size: number | null
          department: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_date?: string
          created_at?: string
          cv_file_path?: string | null
          cv_file_size?: number | null
          department?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_date?: string
          created_at?: string
          cv_file_path?: string | null
          cv_file_size?: number | null
          department?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          created_at: string
          currency: string
          effective_date: string
          id: string
          official_rate: number
          parallel_rate: number
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          effective_date?: string
          id?: string
          official_rate?: number
          parallel_rate?: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          effective_date?: string
          id?: string
          official_rate?: number
          parallel_rate?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          actual_close: string | null
          contact_id: string | null
          created_at: string
          currency: string
          expected_close: string | null
          id: string
          probability: number
          stage: string
          title: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          actual_close?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          expected_close?: string | null
          id?: string
          probability?: number
          stage?: string
          title: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          actual_close?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          expected_close?: string | null
          id?: string
          probability?: number
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_config: {
        Row: {
          demo_user_id: string
          id: boolean
        }
        Insert: {
          demo_user_id: string
          id?: boolean
        }
        Update: {
          demo_user_id?: string
          id?: boolean
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          category: string
          created_at: string
          employee_id: string
          expiry_date: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          notes: string | null
          updated_at: string
          uploaded_by: string
          user_id: string
          version: number
        }
        Insert: {
          category?: string
          created_at?: string
          employee_id: string
          expiry_date?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          uploaded_by: string
          user_id: string
          version?: number
        }
        Update: {
          category?: string
          created_at?: string
          employee_id?: string
          expiry_date?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          uploaded_by?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          app_role: Database["public"]["Enums"]["app_role"] | null
          contact_id: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          job_title: string | null
          leave_balance: number
          manager_id: string | null
          name: string
          role: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_role?: Database["public"]["Enums"]["app_role"] | null
          contact_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          job_title?: string | null
          leave_balance?: number
          manager_id?: string | null
          name: string
          role?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_role?: Database["public"]["Enums"]["app_role"] | null
          contact_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          job_title?: string | null
          leave_balance?: number
          manager_id?: string | null
          name?: string
          role?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_checkouts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by_worker: boolean
          actual_return_date: string | null
          asset_id: string
          checked_out_by: string | null
          checked_out_to: string
          checkout_condition: string | null
          checkout_date: string
          checkout_notes: string | null
          created_at: string
          expected_return_date: string | null
          id: string
          project_id: string | null
          return_condition: string | null
          return_notes: string | null
          site_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by_worker?: boolean
          actual_return_date?: string | null
          asset_id: string
          checked_out_by?: string | null
          checked_out_to: string
          checkout_condition?: string | null
          checkout_date?: string
          checkout_notes?: string | null
          created_at?: string
          expected_return_date?: string | null
          id?: string
          project_id?: string | null
          return_condition?: string | null
          return_notes?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by_worker?: boolean
          actual_return_date?: string | null
          asset_id?: string
          checked_out_by?: string | null
          checked_out_to?: string
          checkout_condition?: string | null
          checkout_date?: string
          checkout_notes?: string | null
          created_at?: string
          expected_return_date?: string | null
          id?: string
          project_id?: string | null
          return_condition?: string | null
          return_notes?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_checkouts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_checked_out_to_fkey"
            columns: ["checked_out_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string
          description: string | null
          employee_id: string | null
          expense_date: string
          id: string
          project_id: string | null
          receipt_path: string | null
          site_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          id?: string
          project_id?: string | null
          receipt_path?: string | null
          site_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          id?: string
          project_id?: string | null
          receipt_path?: string | null
          site_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string | null
          id: string
          message: string
          name: string | null
          page: string | null
          role_context: string | null
          status: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name?: string | null
          page?: string | null
          role_context?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string | null
          page?: string | null
          role_context?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_consumption: {
        Row: {
          consumed_by: string | null
          consumption_date: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          project_id: string | null
          quantity: number
          site_id: string | null
          user_id: string
        }
        Insert: {
          consumed_by?: string | null
          consumption_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          project_id?: string | null
          quantity?: number
          site_id?: string | null
          user_id: string
        }
        Update: {
          consumed_by?: string | null
          consumption_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          project_id?: string | null
          quantity?: number
          site_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_consumption_consumed_by_fkey"
            columns: ["consumed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      invoices: {
        Row: {
          contact_id: string | null
          created_at: string
          deal_id: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          line_items: Json
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          line_items?: Json
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          line_items?: Json
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      job_positions: {
        Row: {
          created_at: string
          department: string
          description: string | null
          id: string
          requirements: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string
          description?: string | null
          id?: string
          requirements?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          description?: string | null
          id?: string
          requirements?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          employee_id: string | null
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          employee_id?: string | null
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          employee_id?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      load_shedding_schedule: {
        Row: {
          created_at: string
          end_time: string
          id: string
          source: string | null
          start_time: string
          zone: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          source?: string | null
          start_time: string
          zone: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          source?: string | null
          start_time?: string
          zone?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          asset_id: string
          cost: number | null
          created_at: string
          description: string | null
          downtime_hours: number | null
          id: string
          maintenance_type: string
          next_due_date: string | null
          notes: string | null
          performed_by: string | null
          performed_date: string
          status: string
          user_id: string
        }
        Insert: {
          asset_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          downtime_hours?: number | null
          id?: string
          maintenance_type?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_date?: string
          status?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          downtime_hours?: number | null
          id?: string
          maintenance_type?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      material_baskets: {
        Row: {
          created_at: string
          id: string
          items: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notice_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          notice_id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          notice_id: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          notice_id?: string
          user_id?: string
        }
        Relationships: []
      }
      outage_action_plans: {
        Row: {
          approval_status: Database["public"]["Enums"]["plan_approval_status"]
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          rationale_action: string | null
          rationale_inputs: string | null
          rationale_logic: string | null
          recommendation_key: string
          rejection_reason: string | null
          severity: string
          source_collision_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["plan_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          rationale_action?: string | null
          rationale_inputs?: string | null
          rationale_logic?: string | null
          recommendation_key: string
          rejection_reason?: string | null
          severity?: string
          source_collision_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["plan_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          rationale_action?: string | null
          rationale_inputs?: string | null
          rationale_logic?: string | null
          recommendation_key?: string
          rejection_reason?: string | null
          severity?: string
          source_collision_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          method: string | null
          payment_date: string
          reference: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          payment_date?: string
          reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          payment_date?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          areas_for_improvement: string | null
          comments: string | null
          created_at: string
          employee_id: string
          goals: string | null
          id: string
          rating: number
          review_date: string
          review_period: string
          reviewer_id: string
          strengths: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_id: string
          goals?: string | null
          id?: string
          rating: number
          review_date?: string
          review_period: string
          reviewer_id: string
          strengths?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_id?: string
          goals?: string | null
          id?: string
          rating?: number
          review_date?: string
          review_period?: string
          reviewer_id?: string
          strengths?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_approval_settings: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["app_role"][]
          allowed_user_ids: string[]
          created_at: string
          department: string
          label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          allowed_user_ids?: string[]
          created_at?: string
          department: string
          label: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          allowed_user_ids?: string[]
          created_at?: string
          department?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          reorder_level: number
          sku: string | null
          stock_quantity: number
          supplier_id: string | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          reorder_level?: number
          sku?: string | null
          stock_quantity?: number
          supplier_id?: string | null
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          reorder_level?: number
          sku?: string | null
          stock_quantity?: number
          supplier_id?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          industry_dna: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          industry_dna?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          industry_dna?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_cost: number | null
          budget: number | null
          created_at: string
          deal_id: string | null
          description: string | null
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          priority: string
          progress: number
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          budget?: number | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost?: number | null
          budget?: number | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          description: string | null
          id: string
          po_id: string
          product_id: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          po_id: string
          product_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          description?: string | null
          id?: string
          po_id?: string
          product_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          notes: string | null
          po_number: string
          requested_by: string | null
          status: string
          supplier_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          po_number: string
          requested_by?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          po_number?: string
          requested_by?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_notices: {
        Row: {
          affected_modules: string[] | null
          created_at: string
          effective_date: string | null
          id: string
          si_number: string | null
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          affected_modules?: string[] | null
          created_at?: string
          effective_date?: string | null
          id?: string
          si_number?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          affected_modules?: string[] | null
          created_at?: string
          effective_date?: string | null
          id?: string
          si_number?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      sae_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      sae_overrides: {
        Row: {
          created_at: string
          id: string
          original_action: string
          override_action: string | null
          reason: string | null
          recommendation_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_action: string
          override_action?: string | null
          reason?: string | null
          recommendation_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_action?: string
          override_action?: string | null
          reason?: string | null
          recommendation_key?: string
          user_id?: string
        }
        Relationships: []
      }
      shift_collision_rules: {
        Row: {
          auto_shift_minutes: number
          created_at: string
          enabled: boolean
          id: string
          ignore_zones: string[]
          min_overlap_hours: number
          severity_threshold_hours: number
          updated_at: string
          urgent_collision_count: number
          user_id: string
        }
        Insert: {
          auto_shift_minutes?: number
          created_at?: string
          enabled?: boolean
          id?: string
          ignore_zones?: string[]
          min_overlap_hours?: number
          severity_threshold_hours?: number
          updated_at?: string
          urgent_collision_count?: number
          user_id: string
        }
        Update: {
          auto_shift_minutes?: number
          created_at?: string
          enabled?: boolean
          id?: string
          ignore_zones?: string[]
          min_overlap_hours?: number
          severity_threshold_hours?: number
          updated_at?: string
          urgent_collision_count?: number
          user_id?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          notes: string | null
          start_date: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotes: {
        Row: {
          created_at: string
          currency: string
          id: string
          item: string
          lead_time_days: number
          notes: string | null
          quoted_at: string
          supplier_id: string | null
          supplier_name: string | null
          unit_price: number
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          item: string
          lead_time_days?: number
          notes?: string | null
          quoted_at?: string
          supplier_id?: string | null
          supplier_name?: string | null
          unit_price?: number
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          item?: string
          lead_time_days?: number
          notes?: string | null
          quoted_at?: string
          supplier_id?: string | null
          supplier_name?: string | null
          unit_price?: number
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      tax_obligations: {
        Row: {
          amount: number
          authority: string
          created_at: string
          currency: string
          due_date: string
          id: string
          name: string
          notes: string | null
          recurrence: string
          reminder_days_before: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          authority?: string
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          name: string
          notes?: string | null
          recurrence?: string
          reminder_days_before?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          authority?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          name?: string
          notes?: string | null
          recurrence?: string
          reminder_days_before?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          approved_by: string | null
          created_at: string
          description: string | null
          employee_id: string | null
          hours_worked: number
          id: string
          project_id: string | null
          site_id: string | null
          status: string
          user_id: string
          work_date: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          hours_worked?: number
          id?: string
          project_id?: string | null
          site_id?: string | null
          status?: string
          user_id: string
          work_date: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          hours_worked?: number
          id?: string
          project_id?: string | null
          site_id?: string | null
          status?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          project_id: string | null
          schedule_date: string
          shift_end: string | null
          shift_start: string | null
          site_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          project_id?: string | null
          schedule_date: string
          shift_end?: string | null
          shift_start?: string | null
          site_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          schedule_date?: string
          shift_end?: string | null
          shift_start?: string | null
          site_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_approve_plan: {
        Args: { _department: string; _user_id: string }
        Returns: boolean
      }
      get_auth_email: { Args: never; Returns: string }
      get_my_employee_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_demo_row: { Args: { _user_id: string }; Returns: boolean }
      is_manager_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "employee"
        | "procurement_manager"
        | "hr_manager"
        | "project_manager"
        | "finance_manager"
      plan_approval_status: "pending_approval" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "employee",
        "procurement_manager",
        "hr_manager",
        "project_manager",
        "finance_manager",
      ],
      plan_approval_status: ["pending_approval", "approved", "rejected"],
    },
  },
} as const
