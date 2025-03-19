import os from 'node:os';
import { Queue } from 'bullmq';

export const DOWNLOAD_DATASET_JOB_NAME = 'DOWNLOAD_DATASET';
export const IMPORT_DATASET_JOB_NAME = 'IMPORT_DATASET';

export const CATALOG_DATA_INGESTION_QUEUE_NAME = 'CATALOG_DATA_INGESTION';
export const CATALOG_DATA_INGESTION_QUEUE_CONCURRENCY = os.cpus().length;

export const queue = new Queue(CATALOG_DATA_INGESTION_QUEUE_NAME, { connection: { url: process.env.REDIS_URL } });
