import os from 'node:os';
import { Queue } from 'bullmq';

export const DOWNLOAD_DATASET_JOB_NAME = 'DOWNLOAD_DATASET';
export const IMPORT_DATASET_JOB_NAME = 'IMPORT_DATASET';

export const RAW_DATA_INGESTION_QUEUE_NAME = 'RAW_DATA_INGESTION';
export const RAW_DATA_INGESTION_QUEUE_CONCURRENCY = os.cpus().length;

export const queue = new Queue(RAW_DATA_INGESTION_QUEUE_NAME, { connection: { url: process.env.REDIS_URL } });
