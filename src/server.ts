import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import { queue } from './util/queue';

const bullBoardExpressAdapter = new ExpressAdapter();
bullBoardExpressAdapter.setBasePath('/ui');

createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter: bullBoardExpressAdapter,
});

const app = express();
app.use('/ui', bullBoardExpressAdapter.getRouter());

export default app;
