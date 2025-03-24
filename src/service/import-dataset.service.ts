import fs from 'node:fs';
import * as pgCopy from 'pg-copy-streams';
import { DATASETS } from '../util/datasets';
import { pipeline } from 'node:stream/promises';
import { logger } from '../util/logger';
import { Logger } from 'pino';
import { PGHelper } from '../util/pg-helper';

export type ImportDatasetServiceProps = {
  db: PGHelper;
  logger: Logger;
};

export type ImportDatasetServiceInput = {
  dataset: string;
  file: string;
};

export class ImportDatasetService {
  private readonly db: PGHelper;
  private readonly logger: Logger;

  constructor(private readonly props: ImportDatasetServiceProps) {
    this.db = props.db;
    this.logger = logger.child({ service: ImportDatasetService.name });
  }

  async execute(input: ImportDatasetServiceInput): Promise<void> {
    const dataset = DATASETS.find((dataset) => dataset.name === input.dataset);
    this.logger.info(input, 'importing dataset');
    await this.db.client.query(`CREATE TABLE IF NOT EXISTS ${dataset.name}(${dataset.columns.join(',')});`);
    await this.db.client.query(`TRUNCATE ${dataset.name};`);
    await Promise.all(
      dataset.indexes.map((index) =>
        this.db.client.query(`CREATE INDEX IF NOT EXISTS ${dataset.name}_${index}_idx ON ${dataset.name}(${index});`),
      ),
    );
    const ingestStream = this.db.client.query(pgCopy.from(`COPY ${dataset.name} FROM STDIN`));
    const sourceStream = fs.createReadStream(input.file, { highWaterMark: 64 * 1024 }); // 64KB chunks for better performance
    await pipeline(sourceStream, ingestStream);
    this.logger.info(input, 'dataset imported');
  }
}
