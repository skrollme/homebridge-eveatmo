'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { createFakeAxios } = require('../../test-helpers/fake-axios');
const { stubAxios } = require('../../test-helpers/stub-axios');
const { waitForEvent } = require('../../test-helpers/wait-for-event');

const fakeAxios = createFakeAxios();
stubAxios(fakeAxios);

const netatmo = require('../../lib/netatmo-api');
/* eslint-enable @typescript-eslint/no-require-imports */

test('getHealthyHomeCoachData calls back with an error when the request fails', async () => {
  fakeAxios.post = async (url) => {
    if (url.includes('/oauth2/token')) {
      return { data: { access_token: 'token-1' } };
    }
    throw new Error('unexpected POST ' + url);
  };

  fakeAxios.get = async () => {
    const error = new Error('network down');
    error.response = { status: 500, data: {}, headers: {} };
    throw error;
  };

  const client = new netatmo({
    grant_type: 'password',
    client_id: 'cid',
    client_secret: 'secret',
    username: 'user@example.com',
    password: 'pw',
  }, {});
  client.on('error', () => {});
  client.on('warning', () => {});

  await waitForEvent(client, 'authenticated');

  const error = await new Promise((resolve) => {
    client.getHealthyHomeCoachData((err) => resolve(err));
  });

  assert.ok(error instanceof Error);
  assert.match(error.message, /getHealthyHomeCoachData error/);
});
