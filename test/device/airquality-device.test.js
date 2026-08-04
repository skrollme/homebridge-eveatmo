'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { stubFakegatoHistory } = require('../../test-helpers/stub-fakegato-history');
stubFakegatoHistory();

const { homebridge } = require('../../test-helpers/hap');
const { createLog } = require('../../test-helpers/log');
const { runBuild } = require('../../test-helpers/run-build');

const NetatmoAPIMock = require('../../lib/netatmo-api-mock');
const AirQualityDeviceType = require('../../device/airquality-device')(homebridge);
/* eslint-enable @typescript-eslint/no-require-imports */

const NHC_STATION_ID = '70:00:00:01:23:45';

function buildAccessoriesForDevices(config) {
  const device = new AirQualityDeviceType(createLog(), NetatmoAPIMock('eveatmo'), config);
  return runBuild(device, 'buildAccessoriesForDevices');
}

test('maps the NHC (Healthy Home Coach) device to a room accessory', async () => {
  const accessories = await buildAccessoriesForDevices({ ttl: 300, module_suffix: '' });

  assert.equal(accessories.length, 1);
  assert.equal(accessories[0].constructor.name, 'EveatmoRoomAccessory');
  assert.equal(accessories[0].id, NHC_STATION_ID);
});
