import { Queue } from 'bullmq';
import { CATALOG_DATA_INGESTION_QUEUE_NAME, REDIS_URL } from '../config';

export const queue = new Queue(CATALOG_DATA_INGESTION_QUEUE_NAME, { connection: { url: REDIS_URL } });
