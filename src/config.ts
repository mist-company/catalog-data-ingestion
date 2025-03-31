export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'debug';
export const DB_NAME = process.env.DB_NAME ?? 'catalog-local';
export const DB_URL = process.env.DB_URL;
export const REDIS_URL = process.env.REDIS_URL;
export const PORT = process.env.PORT ?? 3000;
export const CATALOG_QUEUE_NAME = process.env.CATALOG_QUEUE_NAME ?? 'catalog-queue-local';
export const ETL_JOB_NAME = process.env.ETL_JOB_NAME ?? 'etl-job-local';
