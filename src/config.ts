import os from 'node:os';

export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'debug';
export const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
export const DOWNLOAD_DATASET_JOB_NAME = 'DOWNLOAD_DATASET';
export const IMPORT_DATASET_JOB_NAME = 'IMPORT_DATASET';
export const CLEANUP_FILES_JOB_NAME = 'CLEANUP_FILES';

export const CATALOG_DATA_INGESTION_QUEUE_NAME = 'CATALOG_DATA_INGESTION';
export const CATALOG_DATA_INGESTION_QUEUE_CONCURRENCY = os.cpus().length;
