'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { stubFakegatoHistory } = require('../../test-helpers/stub-fakegato-history');
stubFakegatoHistory();

const { homebridge } = require('../../test-helpers/hap');
const { createLog } = require('../../test-helpers/log');

const NetatmoAPIMock = require('../../lib/netatmo-api-mock');
const WeatherstationDeviceType = require('../../device/weatherstation-device')(homebridge);
/* eslint-enable @typescript-eslint/no-require-imports */

const OUTDOOR_MODULE_ID = '02:00:00:01:23:45';

function runBuild(device, methodName) {
  return new Promise((resolve, reject) => {
    device[methodName]((err, accessories) => {
      /* eslint-disable-next-line no-undef */
      clearInterval(device.runCheckInterval);
      if (err) {
        reject(err);
        return;
      }
      resolve(accessories);
    });
  });
}

function buildAccessoriesForDevices(config) {
  const device = new WeatherstationDeviceType(createLog(), NetatmoAPIMock('eveatmo'), config);
  return runBuild(device, 'buildAccessoriesForDevices');
}

test('maps the outdoor (NAModule1) device to a weather accessory', async () => {
  const accessories = await buildAccessoriesForDevices({
    ttl: 300,
    module_suffix: '',
    whitelist: [OUTDOOR_MODULE_ID],
  });

  assert.equal(accessories.length, 1);
  assert.equal(accessories[0].constructor.name, 'EveatmoWeatherAccessory');
  assert.equal(accessories[0].id, OUTDOOR_MODULE_ID);
});

function buildAccessoriesFromDeviceMap(config, deviceMap) {
  const device = new WeatherstationDeviceType(createLog(), NetatmoAPIMock('eveatmo'), config);
  device.deviceData = deviceMap;
  return runBuild(device, 'buildAccessories');
}

function outdoorModule(id, temperature) {
  return {
    _id: id,
    _name: 'Test Outdoor ' + id,
    type: 'NAModule1',
    reachable: true,
    firmware: 1,
    dashboard_data: { Temperature: temperature, Humidity: 50 },
  };
}

test('whitelist limits accessories to the listed device IDs', async () => {
  const deviceMap = {
    'outdoor-1': outdoorModule('outdoor-1', 20),
    'outdoor-2': outdoorModule('outdoor-2', 18),
  };

  const accessories = await buildAccessoriesFromDeviceMap(
    { ttl: 300, module_suffix: '', whitelist: ['outdoor-1'] },
    deviceMap,
  );

  assert.equal(accessories.length, 1);
  assert.equal(accessories[0].id, 'outdoor-1');
});

test('blacklist excludes the listed device IDs', async () => {
  const deviceMap = {
    'outdoor-1': outdoorModule('outdoor-1', 20),
    'outdoor-2': outdoorModule('outdoor-2', 18),
  };

  const accessories = await buildAccessoriesFromDeviceMap(
    { ttl: 300, module_suffix: '', blacklist: ['outdoor-1'] },
    deviceMap,
  );

  assert.equal(accessories.length, 1);
  assert.equal(accessories[0].id, 'outdoor-2');
});
