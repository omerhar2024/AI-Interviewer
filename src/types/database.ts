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
          email: string;
          subscription_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          subscription_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          subscription_status?: string;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          text: string;
          type: "product_sense" | "behavioral";
          created_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          type: "product_sense" | "behavioral";
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          type?: "product_sense" | "behavioral";
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          audio_url: string;
          transcript: string | null;
          situation: string | null;
          task: string | null;
          action: string | null;
          result: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          audio_url: string;
          transcript?: string | null;
          situation?: string | null;
          task?: string | null;
          action?: string | null;
          result?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          audio_url?: string;
          transcript?: string | null;
          situation?: string | null;
          task?: string | null;
          action?: string | null;
          result?: string | null;
          created_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          response_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          text?: string;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          response_id: string;
          score: number;
          text: string;
          rating: number;
          situation_score: number | null;
          task_score: number | null;
          action_score: number | null;
          result_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          score: number;
          text: string;
          rating: number;
          situation_score?: number | null;
          task_score?: number | null;
          action_score?: number | null;
          result_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          score?: number;
          text?: string;
          rating?: number;
          situation_score?: number | null;
          task_score?: number | null;
          action_score?: number | null;
          result_score?: number | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: string;
          start_date: string;
          end_date: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: string;
          start_date: string;
          end_date: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: string;
          start_date?: string;
          end_date?: string;
        };
      };
    };
  };
}
