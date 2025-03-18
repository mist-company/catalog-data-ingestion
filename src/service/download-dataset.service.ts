import pino from 'pino';
import { DATASETS } from '../util/datasets';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';
import os from 'node:os';
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as fastCSV from 'fast-csv';
import { IMPORT_DATASET_JOB_NAME, queue } from '../util/queue';
import { Queue } from 'bullmq';

export type DownloadDatasetServiceInput = {
  datasetName: string;
};

export type DownloadDatasetServiceOutput = {
  datasetName: string;
  zipFilePath: string;
  csvFilePath: string;
};

export class DownloadDatasetService {
  private readonly logger = pino({
    name: 'raw-data-ingestion:download-dataset-service',
    level: process.env.LOG_LEVEL || 'info',
  });

  async execute(input: DownloadDatasetServiceInput): Promise<DownloadDatasetServiceOutput> {
    const dataset = DATASETS.find((dataset) => dataset.name === input.datasetName);
    const zipFileUrl = new URL(`https://datasets.imdbws.com/${dataset.file}`);
    const zipFilePath = `${os.tmpdir()}/${dataset.file}`;
    this.logger.info(input, `downloading dataset ${dataset.name}`);
    await this.downloadFile(zipFileUrl, zipFilePath);
    this.logger.info(input, `dataset downloaded ${dataset.name}`);
    const csvFilePath = zipFilePath.replace('.gz', '');
    this.logger.info(input, `extracting dataset ${dataset.name}`);
    await this.extractFile(zipFilePath, csvFilePath);
    this.logger.info(input, `dataset extracted ${dataset.name}`);
    await queue.add(
      IMPORT_DATASET_JOB_NAME,
      { datasetName: dataset.name, csvFilePath },
      { deduplication: { id: `${IMPORT_DATASET_JOB_NAME}:${dataset.name}` } },
    );
    return { datasetName: dataset.name, zipFilePath, csvFilePath };
  }

  private async downloadFile(fileUrl: URL, filePath: string): Promise<void> {
    const { data } = await axios.get(fileUrl.toString(), { responseType: 'stream' });
    await pipeline(data, fs.createWriteStream(filePath));
  }

  private async extractFile(zipFilePath: string, csvFilePath: string): Promise<void> {
    await pipeline(
      fs.createReadStream(zipFilePath),
      zlib.createUnzip(),
      fastCSV.parse({ delimiter: '\t', quote: null, headers: true, ignoreEmpty: true }),
      fastCSV.format({ delimiter: '\t' }),
      fs.createWriteStream(csvFilePath, { flags: 'w' }),
    );
  }
}
