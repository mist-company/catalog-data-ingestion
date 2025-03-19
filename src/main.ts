import { DATASETS } from './util/datasets';
import { DownloadDatasetService } from './service/download-dataset.service';
import { ImportDatasetService } from './service/import-dataset.service';
import {
  queue,
  IMPORT_DATASET_JOB_NAME,
  DOWNLOAD_DATASET_JOB_NAME,
  CATALOG_DATA_INGESTION_QUEUE_NAME,
  CATALOG_DATA_INGESTION_QUEUE_CONCURRENCY,
} from './util/queue';
import { Job, Worker } from 'bullmq';
import pino from 'pino';

const logger = pino({
  name: 'catalog-data-ingestion:main',
  level: process.env.LOG_LEVEL || 'info',
});

const downloadDatasetService = new DownloadDatasetService();
const importDatasetService = new ImportDatasetService();

(async () => {
  await Promise.all(
    DATASETS.map((dataset) =>
      queue.add(
        DOWNLOAD_DATASET_JOB_NAME,
        { datasetName: dataset.name },
        { deduplication: { id: `${DOWNLOAD_DATASET_JOB_NAME}:${dataset.name}` } },
      ),
    ),
  );
  const worker = new Worker(
    CATALOG_DATA_INGESTION_QUEUE_NAME,
    async (job: Job) => {
      switch (job.name) {
        case DOWNLOAD_DATASET_JOB_NAME:
          await downloadDatasetService.execute({ datasetName: job.data.datasetName });
          break;
        case IMPORT_DATASET_JOB_NAME:
          await importDatasetService.execute({ datasetName: job.data.datasetName, csvFilePath: job.data.csvFilePath });
          break;
        default:
          throw new Error(`unknown job name: ${job.name}`);
      }
    },
    {
      autorun: false,
      concurrency: CATALOG_DATA_INGESTION_QUEUE_CONCURRENCY,
      connection: { url: process.env.REDIS_URL },
    },
  );
  logger.info(
    `worker started successfully - waiting for jobs - concurrency:${CATALOG_DATA_INGESTION_QUEUE_CONCURRENCY}`,
  );
  await worker
    .on('failed', (job: Job, err: Error) => logger.error(job.data, `job ${job.name} failed: ${err.message}`))
    .run();
})();
