'use strict';

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { stubFakegatoHistory } = require('../../test-helpers/stub-fakegato-history');
stubFakegatoHistory();

const { homebridge, hap } = require('../../test-helpers/hap');
const { buildDeviceDataMap, findModuleByType } = require('../../test-helpers/weatherstation-fixture');
const { createNetatmoDeviceStub } = require('../../test-helpers/netatmo-device-stub');
const { Service, Characteristic } = hap;

const EveatmoRainAccessory = require('../../accessory/eveatmo-rain-accessory')(homebridge);
/* eslint-enable @typescript-eslint/no-require-imports */

function buildAccessory() {
  const deviceDataMap = buildDeviceDataMap();
  const rainModule = findModuleByType(deviceDataMap, 'NAModule3');
  const netatmoDevice = createNetatmoDeviceStub(deviceDataMap);
  const accessory = new EveatmoRainAccessory(rainModule, netatmoDevice);
  return { accessory, deviceDataMap, rainModule };
}

test('maps rain module data onto the rain service characteristics', () => {
  const { accessory } = buildAccessory();

  const rainService = accessory.getService(accessory.name);
  const rainLevel = rainService.getCharacteristic('Rain Level').value;
  const sum1h = rainService.getCharacteristic('1h').value;
  const sum24h = rainService.getCharacteristic('24h').value;

  assert.equal(rainLevel, 0);
  assert.equal(sum1h, 2.5);
  assert.equal(sum24h, 5);
});

test('maps rain module battery data onto the Battery service', () => {
  const { accessory } = buildAccessory();

  const batteryLevel = accessory.getService(Service.Battery).getCharacteristic(Characteristic.BatteryLevel).value;
  const lowBattery = accessory.getService(Service.Battery).getCharacteristic(Characteristic.StatusLowBattery).value;

  assert.equal(batteryLevel, 21);
  assert.equal(lowBattery, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
});
