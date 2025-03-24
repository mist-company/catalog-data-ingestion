import pg from 'pg';

export class PGHelper {
  private readonly pool: pg.Pool;
  public client: pg.PoolClient | null = null;

  constructor() {
    this.pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL });
  }

  async connect(): Promise<void> {
    this.client = await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
    await this.pool.end();
  }
}
