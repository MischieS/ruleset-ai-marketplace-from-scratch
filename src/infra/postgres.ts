import { Pool } from "pg";

export class PostgresEventSink {
  private pool: Pool | null = null;
  private ready = false;

  constructor(private readonly connectionString = process.env.DATABASE_URL ?? "") {}

  get enabled(): boolean {
    return this.connectionString.length > 0;
  }

  async init(): Promise<void> {
    if (!this.enabled || this.ready) return;

    this.pool = new Pool({ connectionString: this.connectionString, ssl: { rejectUnauthorized: false } });
    await this.pool.query(`
      create table if not exists market_events (
        id bigserial primary key,
        event_type text not null,
        payload jsonb not null,
        created_at timestamptz not null default now()
      );
    `);
    await this.pool.query(`
      create table if not exists market_scores (
        id bigserial primary key,
        score_type text not null,
        entity_id text not null,
        score_value numeric not null,
        metadata jsonb not null,
        created_at timestamptz not null default now()
      );
    `);

    this.ready = true;
  }

  async logEvent(eventType: string, payload: unknown): Promise<void> {
    if (!this.pool) return;
    await this.pool.query(
      "insert into market_events (event_type, payload) values ($1, $2)",
      [eventType, JSON.stringify(payload)],
    );
  }

  async logScore(scoreType: string, entityId: string, scoreValue: number, metadata: unknown): Promise<void> {
    if (!this.pool) return;
    await this.pool.query(
      "insert into market_scores (score_type, entity_id, score_value, metadata) values ($1, $2, $3, $4)",
      [scoreType, entityId, scoreValue, JSON.stringify(metadata)],
    );
  }
}
