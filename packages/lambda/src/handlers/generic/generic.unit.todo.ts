import { createToolkit } from '../../toolkit/index.js';
import { GenericHandler } from './handler.js';

const toolkit = createToolkit('test');

// Guess I will have to use explicit types and pass them in as
// onRequestStart<MyEvent, MyReturn, MyExtra>() {}
// I don't like this option, but is the only way I see this working
// and keeping the factory options the way they are.
type MyEvent = {};
type MyExtra = { foo: string };
type MyReturn = { bar: number };

const runnerFn = toolkit.create(GenericHandler, {
  onRequestStart: async ({ logger }) => {
    logger.info('onRequestStart');
    return { foo: 'bar' };
  },
});

export const handler = runnerFn(async ({ event, foo }) => {
  return event;
});
