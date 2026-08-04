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

test('password grant: authenticates and fetches healthy home coach data', async () => {
  fakeAxios.post = async (url, params) => {
    if (url.includes('/oauth2/token')) {
      assert.equal(params.get('grant_type'), 'password');
      assert.equal(params.get('username'), 'user@example.com');
      return { data: { access_token: 'pw-access-token' } };
    }
    throw new Error('unexpected POST ' + url);
  };

  let capturedUrl = null;
  fakeAxios.get = async (url) => {
    capturedUrl = url;
    return { data: { body: { devices: [{ _id: 'nhc-1' }] } } };
  };

  const client = new netatmo({
    grant_type: 'password',
    client_id: 'cid',
    client_secret: 'secret',
    username: 'user@example.com',
    password: 'pw',
  }, {});
  client.on('error', () => {});

  await waitForEvent(client, 'authenticated');

  const devices = await new Promise((resolve, reject) => {
    client.getHealthyHomeCoachData((err, result) => (err ? reject(err) : resolve(result)));
  });

  assert.equal(devices.length, 1);
  assert.equal(devices[0]._id, 'nhc-1');
  assert.ok(capturedUrl.includes('access_token=pw-access-token'));
});
