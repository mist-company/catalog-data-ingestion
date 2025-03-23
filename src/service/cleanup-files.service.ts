import fs from 'node:fs';
import { logger } from '../util/logger';
import { BaseService } from './base.sevice';

export type CleanupFilesServiceInput = {
  files: string[];
};

export class CleanupFilesService implements BaseService<CleanupFilesServiceInput, void> {
  private readonly logger = logger.child({ name: CleanupFilesService.name });

  async execute(input: CleanupFilesServiceInput): Promise<void> {
    await Promise.all(
      input.files.map(async (file) => {
        this.logger.info({ file }, 'cleaning up files');
        await fs.promises.unlink(file);
        this.logger.info({ file }, 'files cleaned up');
      }),
    );
  }
}
