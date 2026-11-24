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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          detail: string
          entity_id: string
          id: string
          org_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          detail?: string
          entity_id: string
          id?: string
          org_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          detail?: string
          entity_id?: string
          id?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mitigation_decisions: {
        Row: {
          decided_at: string
          decided_by: string
          decision: string
          mitigation_id: string
          reason: string
          shortage_id: string
        }
        Insert: {
          decided_at?: string
          decided_by: string
          decision: string
          mitigation_id: string
          reason?: string
          shortage_id: string
        }
        Update: {
          decided_at?: string
          decided_by?: string
          decision?: string
          mitigation_id?: string
          reason?: string
          shortage_id?: string
        }
        Relationships: []
      }
      mitigation_reviews: {
        Row: {
          decided_at: string
          decided_by: string
          decision: string
          mitigation_id: string
          org_id: string
          reason: string
          shortage_id: string
        }
        Insert: {
          decided_at?: string
          decided_by: string
          decision: string
          mitigation_id: string
          org_id: string
          reason?: string
          shortage_id: string
        }
        Update: {
          decided_at?: string
          decided_by?: string
          decision?: string
          mitigation_id?: string
          org_id?: string
          reason?: string
          shortage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitigation_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_datasets: {
        Row: {
          kind: string
          org_id: string
          payload: Json
          row_count: number
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          kind: string
          org_id: string
          payload: Json
          row_count: number
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          kind?: string
          org_id?: string
          payload?: Json
          row_count?: number
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_datasets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          joined_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          join_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          join_code?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          join_code?: string
          name?: string
        }
        Relationships: []
      }
      plan_bom: {
        Row: {
          component_sku_id: string
          org_id: string
          parent_sku_id: string
          qty_per_parent: number
          uom: string
        }
        Insert: {
          component_sku_id: string
          org_id: string
          parent_sku_id: string
          qty_per_parent: number
          uom: string
        }
        Update: {
          component_sku_id?: string
          org_id?: string
          parent_sku_id?: string
          qty_per_parent?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_bom_org_id_component_sku_id_fkey"
            columns: ["org_id", "component_sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
          {
            foreignKeyName: "plan_bom_org_id_parent_sku_id_fkey"
            columns: ["org_id", "parent_sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
        ]
      }
      plan_forecast_demand: {
        Row: {
          demand_id: string
          forecast_qty: number
          is_spike: boolean
          location_id: string
          org_id: string
          sku_id: string
          week: number
        }
        Insert: {
          demand_id: string
          forecast_qty: number
          is_spike?: boolean
          location_id: string
          org_id: string
          sku_id: string
          week: number
        }
        Update: {
          demand_id?: string
          forecast_qty?: number
          is_spike?: boolean
          location_id?: string
          org_id?: string
          sku_id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_forecast_demand_org_id_location_id_fkey"
            columns: ["org_id", "location_id"]
            isOneToOne: false
            referencedRelation: "plan_locations"
            referencedColumns: ["org_id", "location_id"]
          },
          {
            foreignKeyName: "plan_forecast_demand_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
        ]
      }
      plan_generation_runs: {
        Row: {
          checksums: Json
          created_at: string
          created_by: string
          detection: Json
          id: string
          org_id: string
          row_counts: Json
          scale: string
          seed: number
        }
        Insert: {
          checksums: Json
          created_at?: string
          created_by: string
          detection: Json
          id?: string
          org_id: string
          row_counts: Json
          scale: string
          seed: number
        }
        Update: {
          checksums?: Json
          created_at?: string
          created_by?: string
          detection?: Json
          id?: string
          org_id?: string
          row_counts?: Json
          scale?: string
          seed?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_generation_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_ground_truth: {
        Row: {
          expected_detection: string
          issue_type: string
          org_id: string
          record_ref: string
        }
        Insert: {
          expected_detection: string
          issue_type: string
          org_id: string
          record_ref: string
        }
        Update: {
          expected_detection?: string
          issue_type?: string
          org_id?: string
          record_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_ground_truth_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_inventory: {
        Row: {
          as_of_date: string
          inventory_id: string
          location_id: string
          on_hand_qty: number
          org_id: string
          sku_id: string
        }
        Insert: {
          as_of_date: string
          inventory_id: string
          location_id: string
          on_hand_qty: number
          org_id: string
          sku_id: string
        }
        Update: {
          as_of_date?: string
          inventory_id?: string
          location_id?: string
          on_hand_qty?: number
          org_id?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_inventory_org_id_location_id_fkey"
            columns: ["org_id", "location_id"]
            isOneToOne: false
            referencedRelation: "plan_locations"
            referencedColumns: ["org_id", "location_id"]
          },
          {
            foreignKeyName: "plan_inventory_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
        ]
      }
      plan_lead_times: {
        Row: {
          effective_from: string
          effective_to: string | null
          lead_time_days: number
          lead_time_id: string
          location_id: string
          org_id: string
          sku_id: string
          supplier_id: string
        }
        Insert: {
          effective_from: string
          effective_to?: string | null
          lead_time_days: number
          lead_time_id: string
          location_id: string
          org_id: string
          sku_id: string
          supplier_id: string
        }
        Update: {
          effective_from?: string
          effective_to?: string | null
          lead_time_days?: number
          lead_time_id?: string
          location_id?: string
          org_id?: string
          sku_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_lead_times_org_id_location_id_fkey"
            columns: ["org_id", "location_id"]
            isOneToOne: false
            referencedRelation: "plan_locations"
            referencedColumns: ["org_id", "location_id"]
          },
          {
            foreignKeyName: "plan_lead_times_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
          {
            foreignKeyName: "plan_lead_times_org_id_supplier_id_fkey"
            columns: ["org_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "plan_suppliers"
            referencedColumns: ["org_id", "supplier_id"]
          },
        ]
      }
      plan_locations: {
        Row: {
          location_id: string
          name: string
          org_id: string
          region: string
        }
        Insert: {
          location_id: string
          name: string
          org_id: string
          region: string
        }
        Update: {
          location_id?: string
          name?: string
          org_id?: string
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_mitigation_options: {
        Row: {
          cost_usd: number
          lead_time_days: number
          mitigation_id: string
          org_id: string
          policy_compliant: boolean
          policy_notes: string
          recovered_units: number
          service_level_after: number
          shortage_id: string
          type: string
        }
        Insert: {
          cost_usd: number
          lead_time_days: number
          mitigation_id: string
          org_id: string
          policy_compliant: boolean
          policy_notes?: string
          recovered_units: number
          service_level_after: number
          shortage_id: string
          type: string
        }
        Update: {
          cost_usd?: number
          lead_time_days?: number
          mitigation_id?: string
          org_id?: string
          policy_compliant?: boolean
          policy_notes?: string
          recovered_units?: number
          service_level_after?: number
          shortage_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_mitigation_options_org_id_shortage_id_fkey"
            columns: ["org_id", "shortage_id"]
            isOneToOne: false
            referencedRelation: "plan_shortages"
            referencedColumns: ["org_id", "shortage_id"]
          },
        ]
      }
      plan_po_events: {
        Row: {
          actor_role: string
          event_id: string
          from_status: string | null
          occurred_on: string
          org_id: string
          po_id: string
          to_status: string
        }
        Insert: {
          actor_role: string
          event_id: string
          from_status?: string | null
          occurred_on: string
          org_id: string
          po_id: string
          to_status: string
        }
        Update: {
          actor_role?: string
          event_id?: string
          from_status?: string | null
          occurred_on?: string
          org_id?: string
          po_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_po_events_org_id_po_id_fkey"
            columns: ["org_id", "po_id"]
            isOneToOne: false
            referencedRelation: "plan_purchase_orders"
            referencedColumns: ["org_id", "po_id"]
          },
        ]
      }
      plan_production_plans: {
        Row: {
          capacity_qty: number
          location_id: string
          org_id: string
          plan_id: string
          planned_qty: number
          sku_id: string
          status: string
          week: number
        }
        Insert: {
          capacity_qty: number
          location_id: string
          org_id: string
          plan_id: string
          planned_qty: number
          sku_id: string
          status: string
          week: number
        }
        Update: {
          capacity_qty?: number
          location_id?: string
          org_id?: string
          plan_id?: string
          planned_qty?: number
          sku_id?: string
          status?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_production_plans_org_id_location_id_fkey"
            columns: ["org_id", "location_id"]
            isOneToOne: false
            referencedRelation: "plan_locations"
            referencedColumns: ["org_id", "location_id"]
          },
          {
            foreignKeyName: "plan_production_plans_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
        ]
      }
      plan_purchase_orders: {
        Row: {
          actual_receipt_date: string | null
          location_id: string
          order_date: string
          ordered_qty: number
          org_id: string
          po_id: string
          promised_date: string
          sku_id: string
          status: string
          supplier_id: string
          transport_delay_days: number
          uom: string
        }
        Insert: {
          actual_receipt_date?: string | null
          location_id: string
          order_date: string
          ordered_qty: number
          org_id: string
          po_id: string
          promised_date: string
          sku_id: string
          status: string
          supplier_id: string
          transport_delay_days?: number
          uom: string
        }
        Update: {
          actual_receipt_date?: string | null
          location_id?: string
          order_date?: string
          ordered_qty?: number
          org_id?: string
          po_id?: string
          promised_date?: string
          sku_id?: string
          status?: string
          supplier_id?: string
          transport_delay_days?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_purchase_orders_org_id_location_id_fkey"
            columns: ["org_id", "location_id"]
            isOneToOne: false
            referencedRelation: "plan_locations"
            referencedColumns: ["org_id", "location_id"]
          },
          {
            foreignKeyName: "plan_purchase_orders_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
          {
            foreignKeyName: "plan_purchase_orders_org_id_supplier_id_fkey"
            columns: ["org_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "plan_suppliers"
            referencedColumns: ["org_id", "supplier_id"]
          },
        ]
      }
      plan_shortage_events: {
        Row: {
          actor_role: string
          event_id: string
          from_status: string | null
          occurred_on: string
          org_id: string
          shortage_id: string
          to_status: string
        }
        Insert: {
          actor_role: string
          event_id: string
          from_status?: string | null
          occurred_on: string
          org_id: string
          shortage_id: string
          to_status: string
        }
        Update: {
          actor_role?: string
          event_id?: string
          from_status?: string | null
          occurred_on?: string
          org_id?: string
          shortage_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_shortage_events_org_id_shortage_id_fkey"
            columns: ["org_id", "shortage_id"]
            isOneToOne: false
            referencedRelation: "plan_shortages"
            referencedColumns: ["org_id", "shortage_id"]
          },
        ]
      }
      plan_shortage_po_refs: {
        Row: {
          org_id: string
          po_id: string
          shortage_id: string
        }
        Insert: {
          org_id: string
          po_id: string
          shortage_id: string
        }
        Update: {
          org_id?: string
          po_id?: string
          shortage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_shortage_po_refs_org_id_po_id_fkey"
            columns: ["org_id", "po_id"]
            isOneToOne: false
            referencedRelation: "plan_purchase_orders"
            referencedColumns: ["org_id", "po_id"]
          },
          {
            foreignKeyName: "plan_shortage_po_refs_org_id_shortage_id_fkey"
            columns: ["org_id", "shortage_id"]
            isOneToOne: false
            referencedRelation: "plan_shortages"
            referencedColumns: ["org_id", "shortage_id"]
          },
        ]
      }
      plan_shortages: {
        Row: {
          cause_code: string
          demand_id: string
          lead_time_basis_days: number
          location_id: string
          org_id: string
          priority_components: Json
          priority_score: number
          shortage_id: string
          shortage_qty: number
          sku_id: string
          status: string
          supplier_id: string
          week: number
        }
        Insert: {
          cause_code: string
          demand_id: string
          lead_time_basis_days: number
          location_id: string
          org_id: string
          priority_components: Json
          priority_score: number
          shortage_id: string
          shortage_qty: number
          sku_id: string
          status: string
          supplier_id: string
          week: number
        }
        Update: {
          cause_code?: string
          demand_id?: string
          lead_time_basis_days?: number
          location_id?: string
          org_id?: string
          priority_components?: Json
          priority_score?: number
          shortage_id?: string
          shortage_qty?: number
          sku_id?: string
          status?: string
          supplier_id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_shortages_org_id_demand_id_fkey"
            columns: ["org_id", "demand_id"]
            isOneToOne: false
            referencedRelation: "plan_forecast_demand"
            referencedColumns: ["org_id", "demand_id"]
          },
          {
            foreignKeyName: "plan_shortages_org_id_location_id_fkey"
            columns: ["org_id", "location_id"]
            isOneToOne: false
            referencedRelation: "plan_locations"
            referencedColumns: ["org_id", "location_id"]
          },
          {
            foreignKeyName: "plan_shortages_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
          {
            foreignKeyName: "plan_shortages_org_id_supplier_id_fkey"
            columns: ["org_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "plan_suppliers"
            referencedColumns: ["org_id", "supplier_id"]
          },
        ]
      }
      plan_sku_substitutes: {
        Row: {
          approved: boolean
          approved_on: string | null
          org_id: string
          sku_id: string
          substitute_sku_id: string
        }
        Insert: {
          approved: boolean
          approved_on?: string | null
          org_id: string
          sku_id: string
          substitute_sku_id: string
        }
        Update: {
          approved?: boolean
          approved_on?: string | null
          org_id?: string
          sku_id?: string
          substitute_sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_sku_substitutes_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
          {
            foreignKeyName: "plan_sku_substitutes_org_id_substitute_sku_id_fkey"
            columns: ["org_id", "substitute_sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
        ]
      }
      plan_skus: {
        Row: {
          description: string
          org_id: string
          sku_id: string
          uom: string
        }
        Insert: {
          description: string
          org_id: string
          sku_id: string
          uom: string
        }
        Update: {
          description?: string
          org_id?: string
          sku_id?: string
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_skus_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_supplier_capacity: {
        Row: {
          capacity_id: string
          capacity_per_week: number
          effective_from: string
          effective_to: string | null
          min_order_qty: number
          org_id: string
          sku_id: string
          supplier_id: string
        }
        Insert: {
          capacity_id: string
          capacity_per_week: number
          effective_from: string
          effective_to?: string | null
          min_order_qty: number
          org_id: string
          sku_id: string
          supplier_id: string
        }
        Update: {
          capacity_id?: string
          capacity_per_week?: number
          effective_from?: string
          effective_to?: string | null
          min_order_qty?: number
          org_id?: string
          sku_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_supplier_capacity_org_id_sku_id_fkey"
            columns: ["org_id", "sku_id"]
            isOneToOne: false
            referencedRelation: "plan_skus"
            referencedColumns: ["org_id", "sku_id"]
          },
          {
            foreignKeyName: "plan_supplier_capacity_org_id_supplier_id_fkey"
            columns: ["org_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "plan_suppliers"
            referencedColumns: ["org_id", "supplier_id"]
          },
        ]
      }
      plan_suppliers: {
        Row: {
          capacity_per_week: number
          name: string
          org_id: string
          reliability_score: number
          supplier_id: string
        }
        Insert: {
          capacity_per_week: number
          name: string
          org_id: string
          reliability_score: number
          supplier_id: string
        }
        Update: {
          capacity_per_week?: number
          name?: string
          org_id?: string
          reliability_score?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      saved_scenarios: {
        Row: {
          created_at: string
          id: string
          location_id: string
          name: string
          org_id: string | null
          params: Json
          sku_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          name: string
          org_id?: string | null
          params: Json
          sku_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          name?: string
          org_id?: string | null
          params?: Json
          sku_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_scenarios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shortage_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          org_id: string | null
          shortage_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          org_id?: string | null
          shortage_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          org_id?: string | null
          shortage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortage_comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shortage_status: {
        Row: {
          org_id: string
          shortage_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          org_id: string
          shortage_id: string
          status: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          org_id?: string
          shortage_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortage_status_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shortage_workflow: {
        Row: {
          due_week: number | null
          owner_id: string | null
          shortage_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          due_week?: number | null
          owner_id?: string | null
          shortage_id: string
          status: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          due_week?: number | null
          owner_id?: string | null
          shortage_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: { Args: { _name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string; _user: string }; Returns: boolean }
      is_org_owner: { Args: { _org: string; _user: string }; Returns: boolean }
      join_organization: { Args: { _code: string }; Returns: string }
      org_planning_overview: { Args: { _org: string }; Returns: Json }
    }
    Enums: {
      app_role: "planner" | "admin"
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
      app_role: ["planner", "admin"],
    },
  },
} as const
