declare module "pg" {
  export interface QueryResult<Row = unknown> {
    rows: Row[];
  }

  export class PoolClient {
    query<Row = unknown>(text: string, params?: unknown[]): Promise<QueryResult<Row>>;
    release(): void;
  }

  export class Pool {
    constructor(config: {
      connectionString: string;
      ssl?: boolean | { rejectUnauthorized: boolean };
    });

    query<Row = unknown>(text: string, params?: unknown[]): Promise<QueryResult<Row>>;
    connect(): Promise<PoolClient>;
  }
}
