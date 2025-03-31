import { Job } from 'bullmq';
import { PORT } from './config';
import { worker } from './worker';
import { logger } from './util/logger';
import server from './server';

(async () => {
  server.listen(PORT, () => logger.info(`server listening on port ${PORT}`));
  await worker
    .on('ready', () => logger.info('waiting for jobs'))
    .on('failed', (job: Job, err: Error) => logger.error(job.data, `job ${job.name} failed: ${err.message}`))
    .run();
})();
