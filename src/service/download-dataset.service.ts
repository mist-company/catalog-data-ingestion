import { DATASETS } from '../util/datasets';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';
import os from 'node:os';
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as fastCSV from 'fast-csv';
import { Logger } from 'pino';

export type DownloadDatasetServiceInput = {
  dataset: string;
};

export type DownloadDatasetServiceOutput = {
  zipFilePath: string;
  csvFilePath: string;
};

export class DownloadDatasetService {
  private readonly logger: Logger;

  constructor(props: { logger: Logger }) {
    this.logger = props.logger.child({ service: DownloadDatasetService.name });
  }

  async execute(input: DownloadDatasetServiceInput): Promise<DownloadDatasetServiceOutput> {
    const dataset = DATASETS.find((dataset) => dataset.name === input.dataset);
    const zipFileUrl = new URL(`https://datasets.imdbws.com/${dataset.file}`);
    const zipFilePath = `${os.tmpdir()}/${dataset.file}`;
    const csvFilePath = zipFilePath.replace('.gz', '');
    await this.downloadFile(zipFileUrl, zipFilePath);
    await this.extractFile(zipFilePath, csvFilePath);
    return { zipFilePath, csvFilePath };
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
