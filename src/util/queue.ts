import { Queue } from 'bullmq';
import { CATALOG_QUEUE_NAME } from '../config';

export const queue = new Queue(CATALOG_QUEUE_NAME, { connection: { url: process.env.REDIS_URL } });
