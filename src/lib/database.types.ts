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
      auction_bank_accounts: {
        Row: {
          account_holder: string;
          account_number: string;
          bank_id: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          notes: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          account_holder: string;
          account_number: string;
          bank_id: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          account_holder?: string;
          account_number?: string;
          bank_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "auction_bank_accounts_bank_id_fkey";
            columns: ["bank_id"];
            isOneToOne: false;
            referencedRelation: "banks";
            referencedColumns: ["id"];
          },
        ];
      };
      banks: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      item_categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      auction_items: {
        Row: {
          bid_increment: number;
          category: string | null;
          created_at: string;
          created_by: string | null;
          current_price: number;
          description: string;
          id: string;
          item_condition: string | null;
          item_name: string;
          lot_number: string;
          payment_confirmed: boolean;
          payment_confirmed_at: string | null;
          period_id: string;
          starting_price: number;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          bid_increment?: number;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_price?: number;
          description: string;
          id?: string;
          item_condition?: string | null;
          item_name: string;
          lot_number: string;
          payment_confirmed?: boolean;
          payment_confirmed_at?: string | null;
          period_id: string;
          starting_price?: number;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          bid_increment?: number;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_price?: number;
          description?: string;
          id?: string;
          item_condition?: string | null;
          item_name?: string;
          lot_number?: string;
          payment_confirmed?: boolean;
          payment_confirmed_at?: string | null;
          period_id?: string;
          starting_price?: number;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      auction_periods: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          end_at: string;
          id: string;
          start_at: string;
          status: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          winner_emails_sent_at: string | null;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_at: string;
          id?: string;
          start_at: string;
          status?: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          winner_emails_sent_at?: string | null;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_at?: string;
          id?: string;
          start_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          winner_emails_sent_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          id: number;
          new_data: Json | null;
          old_data: Json | null;
          record_id: string | null;
          table_name: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: never;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          table_name: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: never;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          table_name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      bidder_profiles: {
        Row: {
          auth_user_id: string | null;
          company_id: string;
          created_at: string;
          employee_nik: string;
          full_name: string;
          id: string;
          is_active: boolean;
          ktp_hash: string;
          public_alias: string;
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          company_id: string;
          created_at?: string;
          employee_nik: string;
          full_name: string;
          id?: string;
          is_active?: boolean;
          ktp_hash: string;
          public_alias: string;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          company_id?: string;
          created_at?: string;
          employee_nik?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          ktp_hash?: string;
          public_alias?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bids: {
        Row: {
          amount: number;
          bidder_id: string;
          created_at: string;
          id: string;
          item_id: string;
          status: string;
        };
        Insert: {
          amount: number;
          bidder_id: string;
          created_at?: string;
          id?: string;
          item_id: string;
          status?: string;
        };
        Update: {
          amount?: number;
          bidder_id?: string;
          created_at?: string;
          id?: string;
          item_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      item_photos: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          sort_order: number;
          storage_path: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          sort_order?: number;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          sort_order?: number;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name: string;
          short_name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          short_name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          short_name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          company_id: string;
          created_at: string;
          employee_nik: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          role: string;
          updated_at: string;
          username: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          employee_nik?: string | null;
          full_name: string;
          id: string;
          is_active?: boolean;
          role: string;
          updated_at?: string;
          username: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          employee_nik?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          role?: string;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      registration_otps: {
        Row: {
          id: string;
          email: string;
          otp_hash: string;
          employee_nik: string;
          full_name: string;
          attempts: number;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          otp_hash: string;
          employee_nik: string;
          full_name: string;
          attempts?: number;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          otp_hash?: string;
          employee_nik?: string;
          full_name?: string;
          attempts?: number;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      password_reset_otps: {
        Row: {
          id: string;
          employee_nik: string;
          email: string;
          otp_hash: string;
          attempts: number;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_nik: string;
          email: string;
          otp_hash: string;
          attempts?: number;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_nik?: string;
          email?: string;
          otp_hash?: string;
          attempts?: number;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          company_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: string };
      get_period_winner_notifications: {
        Args: { p_period_id: string };
        Returns: {
          bidder_id: string;
          bidder_email: string | null;
          bidder_name: string;
          public_alias: string;
          item_id: string;
          lot_number: string;
          item_name: string;
          last_price: number;
        }[];
      };
      get_period_winners: {
        Args: { p_period_id: string };
        Returns: {
          item_id: string;
          lot_number: string;
          item_name: string;
          starting_price: number;
          last_price: number;
          winner_name: string | null;
          winner_alias: string | null;
          photo_path: string | null;
        }[];
      };
      get_public_bid_feed: {
        Args: { p_item_id: string };
        Returns: {
          amount: number;
          bid_status: string;
          bid_time: string;
          bidder_alias: string;
        }[];
      };
      place_public_bid: {
        Args: {
          p_amount: number;
          p_employee_nik: string;
          p_item_id: string;
          p_ktp: string;
        };
        Returns: Json;
      };
      register_bidder_profile: {
        Args: {
          p_employee_nik: string;
          p_full_name: string;
        };
        Returns: string;
      };
      sync_bidder_profile_from_auth: {
        Args: Record<string, never>;
        Returns: string;
      };
      email_exists: {
        Args: { p_email: string };
        Returns: boolean;
      };
      place_authenticated_bid: {
        Args: {
          p_item_id: string;
          p_amount: number;
        };
        Returns: Json;
      };
      admin_delete_bid: {
        Args: { p_bid_id: string };
        Returns: undefined;
      };
      allocate_next_lot_number: {
        Args: { p_period_id: string };
        Returns: string;
      };
      admin_create_auction_item: {
        Args: {
          p_period_id: string;
          p_item_name: string;
          p_category?: string | null;
          p_description?: string;
          p_item_condition?: string | null;
          p_status?: string;
          p_starting_price?: number;
          p_bid_increment?: number;
        };
        Returns: Database["public"]["Tables"]["auction_items"]["Row"];
      };
      upsert_bidder: {
        Args: {
          p_employee_nik: string;
          p_full_name: string;
          p_is_active?: boolean;
          p_ktp: string;
          p_public_alias: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Bank = Database["public"]["Tables"]["banks"]["Row"];
export type AuctionBankAccount = Database["public"]["Tables"]["auction_bank_accounts"]["Row"];
export type BankAccountWithBank = AuctionBankAccount & {
  banks: Pick<Bank, "id" | "code" | "name"> | null;
};
export type ItemCategory = Database["public"]["Tables"]["item_categories"]["Row"];
export type AuctionItem = Database["public"]["Tables"]["auction_items"]["Row"];
export type AuctionPeriod = Database["public"]["Tables"]["auction_periods"]["Row"];
export type BidderProfile = Database["public"]["Tables"]["bidder_profiles"]["Row"];
export type Bid = Database["public"]["Tables"]["bids"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type ItemPhoto = Database["public"]["Tables"]["item_photos"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PushSubscription = Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type BidFeedEntry = Database["public"]["Functions"]["get_public_bid_feed"]["Returns"][number];
export type UserRole = "ga" | "accounting" | "ga_accounting" | "bidder";
