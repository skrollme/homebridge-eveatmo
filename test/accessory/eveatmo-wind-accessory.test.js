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

const EveatmoWindAccessory = require('../../accessory/eveatmo-wind-accessory')(homebridge);
/* eslint-enable @typescript-eslint/no-require-imports */

function buildAccessory() {
  const deviceDataMap = buildDeviceDataMap();
  const windModule = findModuleByType(deviceDataMap, 'NAModule2');
  const netatmoDevice = createNetatmoDeviceStub(deviceDataMap);
  const accessory = new EveatmoWindAccessory(windModule, netatmoDevice);
  return { accessory, deviceDataMap, windModule };
}

test('maps wind module data onto the wind service characteristics', () => {
  const { accessory } = buildAccessory();

  const windService = accessory.getService(accessory.name + ' Wind Sensor');
  const windStrength = windService.getCharacteristic('Wind Strength').value;
  const gustStrength = windService.getCharacteristic('Gust Strength').value;
  const windAngle = windService.getCharacteristic('Wind Angle').value;

  assert.equal(windStrength, 6);
  assert.equal(gustStrength, 15);
  assert.equal(windAngle, 'S');
});

test('maps wind module battery data onto the Battery service', () => {
  const { accessory } = buildAccessory();

  const batteryLevel = accessory.getService(Service.Battery).getCharacteristic(Characteristic.BatteryLevel).value;
  const lowBattery = accessory.getService(Service.Battery).getCharacteristic(Characteristic.StatusLowBattery).value;

  assert.equal(batteryLevel, 97);
  assert.equal(lowBattery, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
});
