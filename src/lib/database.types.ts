export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      tone_presets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          preset_type: "system" | "custom";
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          preset_type?: "system" | "custom";
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          preset_type?: "system" | "custom";
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tone_preset_examples: {
        Row: {
          id: string;
          preset_id: string;
          content: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          preset_id: string;
          content: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          preset_id?: string;
          content?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
    };
  };
}
