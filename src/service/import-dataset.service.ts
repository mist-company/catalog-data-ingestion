import pg from 'pg';
import fs from 'node:fs';
import * as pgCopy from 'pg-copy-streams';
import { DATASETS } from '../util/datasets';
import { pipeline } from 'node:stream/promises';
import { queue } from '../util/queue';
import { CLEANUP_FILES_JOB_NAME } from '../config';
import { logger } from '../util/logger';
import { BaseService } from './base.sevice';

export type ImportDatasetServiceInput = {
  dataset: string;
  file: string;
};

export class ImportDatasetService implements BaseService<ImportDatasetServiceInput, void> {
  private readonly pg = new pg.Pool({ connectionString: process.env.POSTGRES_URL });
  private readonly logger = logger.child({ name: ImportDatasetService.name });

  async execute(input: ImportDatasetServiceInput): Promise<void> {
    const db = await this.pg.connect();
    try {
      const dataset = DATASETS.find((dataset) => dataset.name === input.dataset);
      this.logger.info(input, 'importing dataset');
      await db.query(`CREATE TABLE IF NOT EXISTS ${dataset.name}(${dataset.columns.join(',')});`);
      await db.query(`TRUNCATE ${dataset.name};`);
      await Promise.all(
        dataset.indexes.map((index) =>
          db.query(`CREATE INDEX IF NOT EXISTS ${dataset.name}_${index}_idx ON ${dataset.name}(${index});`),
        ),
      );
      const ingestStream = db.query(pgCopy.from(`COPY ${dataset.name} FROM STDIN`));
      const sourceStream = fs.createReadStream(input.file, { highWaterMark: 64 * 1024 }); // 64KB chunks for better performance
      await pipeline(sourceStream, ingestStream);
      await queue.add(CLEANUP_FILES_JOB_NAME, { files: [input.file] });
      this.logger.info(input, 'dataset imported');
    } finally {
      db.release();
    }
  }
}
