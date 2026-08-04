'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { createFakeAxios } = require('../test-helpers/fake-axios');
const { stubAxios } = require('../test-helpers/stub-axios');
const { createScratchStoragePath } = require('../test-helpers/scratch-storage-path');
const { createRecordingLog } = require('../test-helpers/log');
const { loadPlatform } = require('../test-helpers/load-platform');
/* eslint-enable @typescript-eslint/no-require-imports */

const fakeAxios = createFakeAxios();
fakeAxios.post = async () => ({ data: { access_token: 'stub-token' } });
stubAxios(fakeAxios);

const scratchDir = createScratchStoragePath();
const EveatmoPlatform = loadPlatform({ user: { storagePath: () => scratchDir } });

function messagesFor(log, level) {
  return log.calls.filter((call) => call.level === level).map((call) => call.args[0]);
}

test('missing auth.client_id/client_secret is reported as a bad configuration', () => {
  const log = createRecordingLog();
  const platform = new EveatmoPlatform(log, { auth: { client_id: 'cid' } });

  assert.ok(messagesFor(log, 'error').some((msg) => msg.includes('\'client_id\' and \'client_secret\' are mandatory')));
  assert.equal(platform.api, undefined);
});

test('an unsupported grant_type is reported as a bad configuration', () => {
  const log = createRecordingLog();
  const platform = new EveatmoPlatform(log, {
    auth: { client_id: 'cid', client_secret: 'secret', grant_type: 'bogus' },
  });

  assert.ok(messagesFor(log, 'error').some((msg) => msg.includes('Unsupported or missing grant_type')));
  assert.equal(platform.api, undefined);
});

test('refresh_token grant without a refresh_token is reported as a bad configuration', () => {
  const log = createRecordingLog();
  const platform = new EveatmoPlatform(log, {
    auth: { client_id: 'cid', client_secret: 'secret', grant_type: 'refresh_token' },
  });

  assert.ok(messagesFor(log, 'error').some((msg) => msg.includes('\'refresh_token\' not set')));
  assert.equal(platform.api, undefined);
});

test('password grant without username/password is reported as a bad configuration', () => {
  const log = createRecordingLog();
  const platform = new EveatmoPlatform(log, {
    auth: { client_id: 'cid', client_secret: 'secret', grant_type: 'password' },
  });

  assert.ok(messagesFor(log, 'error').some((msg) => msg.includes('\'username\' and \'password\' are mandatory')));
  assert.equal(platform.api, undefined);
});

test('a well-formed refresh_token grant config constructs the API client', () => {
  const log = createRecordingLog();
  const platform = new EveatmoPlatform(log, {
    auth: { client_id: 'cid', client_secret: 'secret', grant_type: 'refresh_token', refresh_token: 'rt' },
  });

  assert.ok(platform.api);
  assert.equal(messagesFor(log, 'error').length, 0);
});

test('mockapi config bypasses auth validation and uses the mock API client', () => {
  const log = createRecordingLog();
  const platform = new EveatmoPlatform(log, { mockapi: 'eveatmo' });

  assert.ok(messagesFor(log, 'warn').some((msg) => msg.includes('CAUTION! USING FAKE NETATMO API: eveatmo')));
  assert.ok(platform.api);
  assert.equal(typeof platform.api.getStationsData, 'function');
});
