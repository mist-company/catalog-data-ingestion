import { CleanupFilesService } from './service/cleanup-files.service';
import { DownloadDatasetService } from './service/download-dataset.service';
import { ImportDatasetService } from './service/import-dataset.service';
import { DATASETS } from './util/datasets';
import { logger } from './util/logger';
import { PGHelper } from './util/pg-helper';

const db = new PGHelper();
const downloadDatasetService = new DownloadDatasetService({ logger });
const importDatasetService = new ImportDatasetService({ db, logger });
const cleanupFilesService = new CleanupFilesService({ logger });

(async () => {
  logger.info('data ingestion started');
  try {
    await db.connect();
    logger.debug('connected to database successfully');
    await Promise.all(
      DATASETS.map(async (dataset) => {
        const { zipFilePath, csvFilePath } = await downloadDatasetService.execute({ dataset: dataset.name });
        await importDatasetService.execute({ dataset: dataset.name, file: csvFilePath });
        await cleanupFilesService.execute({ files: [zipFilePath, csvFilePath] });
      }),
    );
  } catch (error) {
    logger.error(error, 'data ingestion failed');
  } finally {
    await db.disconnect();
    logger.debug('disconnected from database');
  }
  logger.info('data ingestion completed');
})();
