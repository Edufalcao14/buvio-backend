import { fixtures } from './fixtures';
import { helpers } from './helpers';
import { setup } from './setup/setup';

export const tests = {
  setup,
  fixtures,
  helpers,
} as const;

export type Tests = typeof tests;
