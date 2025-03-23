import { DOWNLOAD_DATASET_JOB_NAME } from './config';
import { DATASETS } from './util/datasets';
import { logger } from './util/logger';
import { queue } from './util/queue';
import { worker } from './worker';

(async () => {
  const datasetDownloadJobMessages = DATASETS.map((dataset) =>
    queue.add(
      DOWNLOAD_DATASET_JOB_NAME,
      { dataset: dataset.name },
      { deduplication: { id: `${DOWNLOAD_DATASET_JOB_NAME}:${dataset.name}` } },
    ),
  );
  await Promise.all(datasetDownloadJobMessages);
  worker.on('failed', (job, err) => {
    logger.error({ name: job.name, err }, 'job failed');
  });
  await worker.run();
})();
