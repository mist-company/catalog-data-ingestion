import { Job, Worker } from 'bullmq';
import { logger } from './util/logger';
import { CATALOG_QUEUE_NAME, ETL_JOB_NAME } from './config';
import { CleanupFilesService } from './service/cleanup-files.service';
import { DownloadDatasetService } from './service/download-dataset.service';
import { ImportDatasetService } from './service/import-dataset.service';
import { datasets } from './util/datasets';

const downloadDatasetService = new DownloadDatasetService({ logger });
const importDatasetService = new ImportDatasetService({ logger });
const cleanupFilesService = new CleanupFilesService({ logger });

async function runEtlJob(job: Job) {
  const dataset = datasets.find((d) => d.collection === job.data.collection);
  if (!dataset) {
    logger.error(`dataset not found for collection: ${job.data.collection}`);
    return;
  }
  const { zipFilePath, csvFilePath } = await downloadDatasetService.execute({ dataset });
  await importDatasetService.execute({ dataset, csv: csvFilePath });
  await cleanupFilesService.execute({ files: [zipFilePath, csvFilePath] });
}

export const worker = new Worker(
  CATALOG_QUEUE_NAME,
  async (job: Job) => {
    if (job.name === ETL_JOB_NAME) {
      await runEtlJob(job);
      return;
    }
    logger.error(`unknown job name: ${job.name}`);
  },
  {
    autorun: false,
    connection: { url: process.env.REDIS_URL },
  },
);
