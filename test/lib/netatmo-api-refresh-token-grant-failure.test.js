'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { createFakeAxios } = require('../../test-helpers/fake-axios');
const { stubAxios } = require('../../test-helpers/stub-axios');
const { createScratchStoragePath } = require('../../test-helpers/scratch-storage-path');
const { waitForEvent } = require('../../test-helpers/wait-for-event');

const fakeAxios = createFakeAxios();
stubAxios(fakeAxios);

const netatmo = require('../../lib/netatmo-api');
/* eslint-enable @typescript-eslint/no-require-imports */

test('refresh_token grant: surfaces auth failure and getStationsData calls back immediately with an error', async () => {
  const scratchDir = createScratchStoragePath();
  const homebridgeStub = { user: { storagePath: () => scratchDir } };

  fakeAxios.post = async (url) => {
    if (url.includes('/oauth2/token')) {
      const error = new Error('Request failed');
      error.response = { status: 400, data: { error: 'invalid_grant' }, headers: {} };
      throw error;
    }
    throw new Error('unexpected POST ' + url);
  };

  const client = new netatmo({
    grant_type: 'refresh_token',
    client_id: 'cid',
    client_secret: 'secret',
    refresh_token: 'bad-refresh-token',
  }, homebridgeStub);
  client.on('error', () => {});

  await waitForEvent(client, 'authentication-failed');

  const error = await new Promise((resolve) => {
    client.getStationsData((err) => resolve(err));
  });

  assert.ok(error instanceof Error);
});
