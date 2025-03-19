import pino from 'pino';
import pg from 'pg';
import fs from 'node:fs';
import * as pgCopy from 'pg-copy-streams';
import { DATASETS } from '../util/datasets';
import { pipeline } from 'node:stream/promises';

export type ImportDatasetServiceInput = {
  datasetName: string;
  csvFilePath: string;
};

export class ImportDatasetService {
  private readonly pg = new pg.Pool({ connectionString: process.env.POSTGRES_URL });
  private readonly logger = pino({
    name: 'catalog-data-ingestion:import-dataset-service',
    level: process.env.LOG_LEVEL || 'info',
  });

  async execute(input: ImportDatasetServiceInput): Promise<void> {
    const db = await this.pg.connect();
    try {
      const dataset = DATASETS.find((dataset) => dataset.name === input.datasetName);
      this.logger.info(input, `importing dataset ${dataset.name}`);
      await db.query(`CREATE TABLE IF NOT EXISTS ${dataset.name}(${dataset.columns.join(',')});`);
      await db.query(`TRUNCATE ${dataset.name};`);
      const ingestStream = db.query(pgCopy.from(`COPY ${dataset.name} FROM STDIN`));
      const sourceStream = fs.createReadStream(input.csvFilePath, { highWaterMark: 64 * 1024 }); // 64KB chunks for better performance
      await pipeline(sourceStream, ingestStream);
      this.logger.info(input, `dataset imported ${dataset.name}`);
    } finally {
      db.release();
    }
  }
}
