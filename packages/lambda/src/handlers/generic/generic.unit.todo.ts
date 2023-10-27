import { createToolkit } from '../../toolkit/index.js';
import { GenericHandler } from './handler.js';

const toolkit = createToolkit('test');

const runnerFn = toolkit.create(GenericHandler, {
  onRequestStart: async ({ logger }) => {
    logger.info('onRequestStart');
    return { foo: 'bar' };
  },
});

export const handler = runnerFn(async ({ event }) => {
  return event;
});
