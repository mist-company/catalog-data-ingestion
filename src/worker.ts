import { Job, Worker } from 'bullmq';
import { DownloadDatasetService } from './service/download-dataset.service';
import { ImportDatasetService } from './service/import-dataset.service';
import { CleanupFilesService } from './service/cleanup-files.service';
import {
  CATALOG_DATA_INGESTION_QUEUE_CONCURRENCY,
  CATALOG_DATA_INGESTION_QUEUE_NAME,
  CLEANUP_FILES_JOB_NAME,
  DOWNLOAD_DATASET_JOB_NAME,
  IMPORT_DATASET_JOB_NAME,
} from './config';
import { BaseService } from './service/base.sevice';

const services: Record<string, BaseService> = {
  [DOWNLOAD_DATASET_JOB_NAME]: new DownloadDatasetService(),
  [IMPORT_DATASET_JOB_NAME]: new ImportDatasetService(),
  [CLEANUP_FILES_JOB_NAME]: new CleanupFilesService(),
};

export const worker = new Worker(
  CATALOG_DATA_INGESTION_QUEUE_NAME,
  async (job: Job) => {
    const service = services[job.name];
    if (!service) {
      throw new Error(`service not found for job ${job.name}`);
    }
    await service.execute(job.data);
  },
  {
    autorun: false,
    concurrency: CATALOG_DATA_INGESTION_QUEUE_CONCURRENCY,
    connection: { url: process.env.REDIS_URL },
  },
);
