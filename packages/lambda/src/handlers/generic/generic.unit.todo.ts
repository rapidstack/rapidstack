import { createToolkit } from '../../toolkit/index.js';
import { GenericHandler } from './handler.js';
import { type CommonHookProps } from './lifecycle.js';

const toolkit = createToolkit('test');

// Guess I will have to use explicit types and pass them in as
// onRequestStart<MyEvent, MyReturn, MyExtra>() {}
// I don't like this option, but is the only way I see this working
// and keeping the factory options the way they are.
type MyEvent = {
  abc: number;
};
type MyExtra = { foo: string };
type MyReturnT = { bar: number };

const runnerFn = toolkit.create(GenericHandler, {
  onRequestStart: async ({ event, logger }: CommonHookProps<MyEvent>) => {
    logger.info({
      event: event.abc,
      msg: 'starting pre-request hook',
    });
    if (!event.abc) {
      return () =>
        ({
          bar: 123,
        }) as MyReturnT;
    }

    return { foo: 'bar' } as MyExtra;
  },
});

export const handler = runnerFn(async ({ event }) => {
  return event;
});
