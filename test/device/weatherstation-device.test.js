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
const WeatherstationDeviceType = require('../../device/weatherstation-device')(homebridge);
/* eslint-enable @typescript-eslint/no-require-imports */

const MAIN_STATION_ID = '70:00:00:01:23:45';
const OUTDOOR_MODULE_ID = '02:00:00:01:23:45';
const WIND_MODULE_ID = '10:00:00:00:00:05';
const INDOOR_MODULE_ID = '03:00:00:01:23:45';
const RAIN_MODULE_ID = '05:00:00:01:23:45';

function buildAccessoriesForDevices(config) {
  const device = new WeatherstationDeviceType(createLog(), NetatmoAPIMock('eveatmo'), config);
  return runBuild(device, 'buildAccessoriesForDevices');
}

test('maps every known Netatmo module type to its matching accessory class', async () => {
  const accessories = await buildAccessoriesForDevices({ ttl: 300, module_suffix: '' });

  const accessoryClassById = {};
  accessories.forEach((accessory) => {
    accessoryClassById[accessory.id] = accessory.constructor.name;
  });

  assert.equal(accessoryClassById[MAIN_STATION_ID], 'EveatmoRoomAccessory');
  assert.equal(accessoryClassById[INDOOR_MODULE_ID], 'EveatmoRoomAccessory');
  assert.equal(accessoryClassById[OUTDOOR_MODULE_ID], 'EveatmoWeatherAccessory');
  assert.equal(accessoryClassById[WIND_MODULE_ID], 'EveatmoWindAccessory');
  assert.equal(accessoryClassById[RAIN_MODULE_ID], 'EveatmoRainAccessory');
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
