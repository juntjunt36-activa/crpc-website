// Hand-written Supabase types matching supabase/migrations/0001_initial.sql.
// Regenerate via `supabase gen types typescript` once the CLI is wired up.

export interface PointBalanceHistoryRow {
  id: string;
  recorded_at: string;
  j_value: number;
  v_value: number;
  param_a: number;
  param_b: number;
  param_c: number;
  inserted_by: string;
  note: string | null;
}

export interface MarketPriceSnapshotRow {
  id: string;
  recorded_at: string;
  price_usd: number;
  source: 'digifinex' | (string & {});
  raw_payload: unknown;
}

export interface AuditLogRow {
  id: string;
  occurred_at: string;
  actor_id: string | null;
  action: string;
  payload: unknown;
}

export interface Database {
  public: {
    Tables: {
      point_balance_history: {
        Row: PointBalanceHistoryRow;
        Insert: Omit<PointBalanceHistoryRow, 'id' | 'recorded_at' | 'note'> & {
          id?: string;
          recorded_at?: string;
          note?: string | null;
        };
        Update: Partial<PointBalanceHistoryRow>;
      };
      market_price_snapshots: {
        Row: MarketPriceSnapshotRow;
        Insert: Omit<MarketPriceSnapshotRow, 'id' | 'recorded_at' | 'raw_payload'> & {
          id?: string;
          recorded_at?: string;
          raw_payload?: unknown;
        };
        Update: Partial<MarketPriceSnapshotRow>;
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, 'id' | 'occurred_at'> & {
          id?: string;
          occurred_at?: string;
        };
        Update: Partial<AuditLogRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
