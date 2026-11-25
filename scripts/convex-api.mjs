// Writes `utils/generated/convex-api.ts` from the sibling `features-backend`
// checkout's validators, or with `--check` fails when it's behind them.
// Run with Bun (`bun run api:generate`), which runs the generator too.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TARGET = 'utils/generated/convex-api.ts';
const check = process.argv.includes('--check');
const output = check ? '.wxt/convex-api.check.ts' : TARGET;

const bun = (...args) =>
  execFileSync(process.execPath, args, {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
bun('../features-backend/scripts/extension-api.ts', output);
bun('x', 'oxfmt', output);

// A checkout may have turned the committed file's line endings into CRLF.
const read = (path) => readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
if (check && read(output) !== read(TARGET)) {
  console.error(
    `${TARGET} is behind the backend; run \`bun run api:generate\`.`,
  );
  process.exit(1);
}
