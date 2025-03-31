/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { logger } from '../util/logger';
import { Logger } from 'pino';
import { MongoClient } from 'mongodb';
import * as csv from '@fast-csv/parse';
import { Dataset } from '../util/datasets';
import { DB_NAME } from '../config';

export type ImportDatasetServiceProps = {
  logger: Logger;
};

export type ImportDatasetServiceInput = {
  dataset: Dataset;
  csv: string;
};

export class ImportDatasetService {
  private readonly logger: Logger;
  private readonly db: MongoClient;

  constructor(private readonly props: ImportDatasetServiceProps) {
    this.logger = logger.child({ service: ImportDatasetService.name });
    this.db = new MongoClient(process.env.DB_URL);
  }

  async execute(input: ImportDatasetServiceInput): Promise<void> {
    this.logger.info(input, 'importing dataset');
    const chunkSize = 10000;
    const totalRecordsCount = await this.countLines(input.csv);
    let importedRecordsCount = 0;
    const colletion = this.db.db(DB_NAME).collection(input.dataset.collection);
    await pipeline(
      fs.createReadStream(input.csv),
      csv.parse({ headers: true, delimiter: '\t', quote: null }).transform((row) => {
        for (const key in row) {
          if (row[key] === '\\N') row[key] = null;
        }
        return input.dataset.transform(row);
      }),
      async function* (source) {
        const buffer = [];
        for await (const row of source) {
          buffer.push(row);
          if (buffer.length === chunkSize) {
            yield buffer.splice(0, chunkSize);
          }
        }
        if (buffer.length > 0) {
          yield buffer;
        }
      },
      async (source) => {
        for await (const chunk of source) {
          await colletion.bulkWrite(
            chunk.map((row) => ({
              updateOne: {
                filter: { _id: row._id },
                update: { $set: row },
                upsert: true,
              },
            })),
            { ordered: false },
          );
          importedRecordsCount += chunk.length;
          const percentage = ((importedRecordsCount / totalRecordsCount) * 100).toFixed(1);
          this.logger.info(
            {
              importedRecordsCount,
              totalRecordsCount,
              percentage: `${percentage}%`,
              colletion: input.dataset.collection,
            },
            'importing dataset',
          );
        }
      },
    );
    this.db.close();
    this.logger.info(input, 'dataset imported');
  }

  private async countLines(filePath: string): Promise<number> {
    let count = 0;
    await pipeline(
      fs.createReadStream(filePath),
      csv.parse({ delimiter: '\t', quote: null, headers: true }),
      async (source) => {
        for await (const _row of source) count++;
      },
    );
    return count;
  }
}
