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
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          manager_id: string
          name: string
          status: Database["public"]["Enums"]["category_status"]
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          manager_id: string
          name: string
          status: Database["public"]["Enums"]["category_status"]
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          manager_id?: string
          name?: string
          status?: Database["public"]["Enums"]["category_status"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          id: string
          is_active: boolean | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          id?: string
          is_active?: boolean | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          id?: string
          is_active?: boolean | null
          value?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      floors: {
        Row: {
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["floors_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["floors_status"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["floors_status"]
        }
        Relationships: []
      }
      kds_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          order_id: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          order_id: string
          status?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kds_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kds_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          is_completed_in_kitchen: boolean | null
          is_served: boolean | null
          order_id: string
          product_id: string | null
          quantity: number
          tax_rate: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed_in_kitchen?: boolean | null
          is_served?: boolean | null
          order_id: string
          product_id?: string | null
          quantity: number
          tax_rate: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          is_completed_in_kitchen?: boolean | null
          is_served?: boolean | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          tax_rate?: number
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
          customer_id: string | null
          discount_amount: number
          id: string
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          session_id: string
          status: string
          subtotal: number
          table_id: string | null
          tax: number
          total: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_number: string
          payment_method?: string | null
          payment_reference?: string | null
          session_id: string
          status?: string
          subtotal?: number
          table_id?: string | null
          tax?: number
          total?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          session_id?: string
          status?: string
          subtotal?: number
          table_id?: string | null
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          name: string
          upi_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          name: string
          upi_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          name?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_available: boolean
          manager_id: string
          name: string
          price: number
          status: Database["public"]["Enums"]["product_status"] | null
          tax: number
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_available?: boolean
          manager_id: string
          name: string
          price: number
          status?: Database["public"]["Enums"]["product_status"] | null
          tax: number
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_available?: boolean
          manager_id?: string
          name?: string
          price?: number
          status?: Database["public"]["Enums"]["product_status"] | null
          tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_banned: boolean
          manager_id: string | null
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_banned?: boolean
          manager_id?: string | null
          name: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_banned?: boolean
          manager_id?: string | null
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          discount_type: string
          id: string
          is_active: boolean | null
          min_order_amount: number | null
          min_quantity: number | null
          name: string
          trigger_product_id: string | null
          type: string
          value: number
        }
        Insert: {
          created_at?: string
          discount_type: string
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          min_quantity?: number | null
          name: string
          trigger_product_id?: string | null
          type: string
          value: number
        }
        Update: {
          created_at?: string
          discount_type?: string
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          min_quantity?: number | null
          name?: string
          trigger_product_id?: string | null
          type?: string
          value?: number
        }
        Relationships: []
      }
      sessions: {
        Row: {
          closed_at: string | null
          closing_balance: number | null
          id: string
          opened_at: string
          opened_by: string
          opening_balance: number
          status: string
        }
        Insert: {
          closed_at?: string | null
          closing_balance?: number | null
          id?: string
          opened_at?: string
          opened_by: string
          opening_balance: number
          status?: string
        }
        Update: {
          closed_at?: string | null
          closing_balance?: number | null
          id?: string
          opened_at?: string
          opened_by?: string
          opening_balance?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          floor_id: string
          id: string
          is_active: boolean | null
          seats: number
          table_number: string
        }
        Insert: {
          created_at?: string
          floor_id: string
          id?: string
          is_active?: boolean | null
          seats?: number
          table_number: string
        }
        Update: {
          created_at?: string
          floor_id?: string
          id?: string
          is_active?: boolean | null
          seats?: number
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
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
      category_status: "enable" | "disable"
      floors_status: "enable" | "disable"
      product_status: "enable" | "disable"
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
    Enums: {
      category_status: ["enable", "disable"],
      floors_status: ["enable", "disable"],
      product_status: ["enable", "disable"],
    },
  },
} as const
