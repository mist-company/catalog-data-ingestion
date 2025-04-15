import { pipeline } from 'node:stream/promises';
import axios from 'axios';
import os from 'node:os';
import fs from 'node:fs';
import zlib from 'node:zlib';

import { Logger } from 'pino';
import { Dataset } from '../util/datasets';

export type DownloadDatasetServiceInput = {
  dataset: Dataset;
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
    const zipFileUrl = new URL(`https://datasets.imdbws.com/${input.dataset.file}`);
    const zipFilePath = `${os.tmpdir()}/${input.dataset.file}`;
    const csvFilePath = zipFilePath.replace('.gz', '');
    if (!fs.existsSync(zipFilePath)) {
      await this.downloadFile(zipFileUrl, zipFilePath);
    }
    if (!fs.existsSync(csvFilePath)) {
      await this.extractFile(zipFilePath, csvFilePath);
    }
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
      fs.createWriteStream(csvFilePath, { flags: 'w' }),
    );
    this.logger.info({ zipFilePath, csvFilePath }, 'file extracted');
  }
}
