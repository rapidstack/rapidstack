import { createToolkit } from '../../toolkit/index.js';
import { GenericHandler } from './handler.js';

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
  name: 'TestHandler',
});

export const handler = runnerFn<MyEvent, MyReturnT, MyExtra>(
  async ({ event, foo, logger }) => {
    logger.info({ foo, msg: 'foo value' });
    return { bar: event.abc };
  },
  {
    onRequestStart: async ({ event }) => {
      if (!event)
        return () => {
          return { bar: 0 } as MyReturnT;
        };

      return { foo: 'bar' } as MyExtra;
    },
  }
);
