// The tests' one dependency, playwright-core, comes from a scaffolded film's tools/ (the tests have
// no node_modules of their own): INK_FILM_TOOLS names that folder. check.sh sets it to one of its
// films' tools/ before running focus.mjs, extras.mjs, exact.mjs and latefont.mjs; scaffold.sh and
// example.sh set it to a film they scaffolded.
import { createRequire } from 'node:module';
import path from 'node:path';

const tools = process.env.INK_FILM_TOOLS;
if (!tools) {
  console.error("INK_FILM_TOOLS must name a film's tools/ folder with node_modules installed (tests/check.sh sets it to one of its films' tools/)");
  process.exit(2);
}
export const { chromium } = createRequire(path.join(path.resolve(tools), 'package.json'))('playwright-core');
