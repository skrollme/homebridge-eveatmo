'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { createFakeAxios } = require('../../test-helpers/fake-axios');
const { stubAxios } = require('../../test-helpers/stub-axios');
const { createScratchStoragePath } = require('../../test-helpers/scratch-storage-path');
const { waitForEvent } = require('../../test-helpers/wait-for-event');

const fakeAxios = createFakeAxios();
stubAxios(fakeAxios);

const netatmo = require('../../lib/netatmo-api');
/* eslint-enable @typescript-eslint/no-require-imports */

test('refresh_token grant: authenticates, persists the new refresh token, and fetches station data', async () => {
  const scratchDir = createScratchStoragePath();
  const homebridgeStub = { user: { storagePath: () => scratchDir } };

  let capturedAccessToken = null;

  fakeAxios.post = async (url, params) => {
    if (url.includes('/oauth2/token')) {
      assert.equal(params.get('grant_type'), 'refresh_token');
      assert.equal(params.get('refresh_token'), 'old-refresh-token');
      return { data: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' } };
    }
    if (url.includes('/api/getstationsdata')) {
      capturedAccessToken = params.get('access_token');
      return { data: { body: { devices: [{ _id: 'station-1' }] } } };
    }
    throw new Error('unexpected POST ' + url);
  };

  const client = new netatmo({
    grant_type: 'refresh_token',
    client_id: 'cid',
    client_secret: 'secret',
    refresh_token: 'old-refresh-token',
  }, homebridgeStub);
  client.on('error', () => {});

  await waitForEvent(client, 'authenticated');

  const persisted = JSON.parse(fs.readFileSync(path.join(scratchDir, 'netatmo-token.json'), 'utf8'));
  assert.equal(persisted.refresh_token, 'new-refresh-token');
  assert.equal(persisted.access_token, undefined);

  const devices = await new Promise((resolve, reject) => {
    client.getStationsData((err, result) => (err ? reject(err) : resolve(result)));
  });

  assert.equal(devices.length, 1);
  assert.equal(devices[0]._id, 'station-1');
  assert.equal(capturedAccessToken, 'new-access-token');
});
