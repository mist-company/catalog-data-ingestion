import fs from 'node:fs';
import { Logger } from 'pino';

export type CleanupFilesServiceInput = {
  files: string[];
};

export class CleanupFilesService {
  private readonly logger: Logger;

  constructor(props: { logger: Logger }) {
    this.logger = props.logger.child({ service: CleanupFilesService.name });
  }

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
