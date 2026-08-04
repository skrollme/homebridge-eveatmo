'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const os = require('os');
const path = require('path');
/* eslint-enable @typescript-eslint/no-require-imports */

function createScratchStoragePath() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'eveatmo-test-'));
}

module.exports = { createScratchStoragePath };
