import { DATASETS } from '../util/datasets';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';
import os from 'node:os';
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as fastCSV from 'fast-csv';
import { CLEANUP_FILES_JOB_NAME, IMPORT_DATASET_JOB_NAME } from '../config';
import { queue } from '../util/queue';
import { logger } from '../util/logger';
import { BaseService } from './base.sevice';

export type DownloadDatasetServiceInput = {
  dataset: string;
};

export class DownloadDatasetService implements BaseService<DownloadDatasetServiceInput, void> {
  private readonly logger = logger.child({ name: DownloadDatasetService.name });

  async execute(input: DownloadDatasetServiceInput): Promise<void> {
    const dataset = DATASETS.find((dataset) => dataset.name === input.dataset);
    const zipFileUrl = new URL(`https://datasets.imdbws.com/${dataset.file}`);
    const zipFilePath = `${os.tmpdir()}/${dataset.file}`;
    const csvFilePath = zipFilePath.replace('.gz', '');
    await this.downloadFile(zipFileUrl, zipFilePath);
    await this.extractFile(zipFilePath, csvFilePath);
    await queue.add(
      IMPORT_DATASET_JOB_NAME,
      { dataset: dataset.name, file: csvFilePath },
      { deduplication: { id: `download:${dataset.name}` } },
    );
    await queue.add(CLEANUP_FILES_JOB_NAME, { files: [zipFilePath] });
  }

  private async downloadFile(fileUrl: URL, filePath: string): Promise<void> {
    this.logger.info({ fileUrl, filePath }, 'downloading file');
    const { data } = await axios.get(fileUrl.toString(), { responseType: 'stream' });
    await pipeline(data, fs.createWriteStream(filePath));
    this.logger.info({ fileUrl, filePath }, 'file downloaded');
  }

  private async extractFile(zipFilePath: string, csvFilePath: string): Promise<void> {
    this.logger.info({ zipFilePath, csvFilePath }, 'extracting file');
    await pipeline(
      fs.createReadStream(zipFilePath),
      zlib.createUnzip(),
      fastCSV.parse({ delimiter: '\t', quote: null, headers: true, ignoreEmpty: true }),
      fastCSV.format({ delimiter: '\t' }),
      fs.createWriteStream(csvFilePath, { flags: 'w' }),
    );
    this.logger.info({ zipFilePath, csvFilePath }, 'file extracted');
  }
}
