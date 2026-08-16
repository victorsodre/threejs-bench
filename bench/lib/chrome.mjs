import { existsSync } from 'node:fs';

// Resolve a Chrome/Chromium executable. puppeteer-core does not bundle a
// browser, so we look at CHROME_PATH first, then common install locations on
// macOS and Linux. Set CHROME_PATH to override.
const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];

export const resolveChrome = () => {
  const found = CANDIDATES.find((p) => p && existsSync(p));
  if (!found) {
    throw new Error(
      'No Chrome/Chromium executable found. Install Google Chrome or set CHROME_PATH ' +
        'to the browser binary (e.g. export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").'
    );
  }
  return found;
};
