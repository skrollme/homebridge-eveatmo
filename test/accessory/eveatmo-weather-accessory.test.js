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

const EveatmoWeatherAccessory = require('../../accessory/eveatmo-weather-accessory')(homebridge);
/* eslint-enable @typescript-eslint/no-require-imports */

function buildAccessory() {
  const deviceDataMap = buildDeviceDataMap();
  const outdoorModule = findModuleByType(deviceDataMap, 'NAModule1');
  const netatmoDevice = createNetatmoDeviceStub(deviceDataMap);
  const accessory = new EveatmoWeatherAccessory(outdoorModule, netatmoDevice);
  return { accessory, deviceDataMap, outdoorModule };
}

test('maps outdoor module data onto HAP characteristics on construction', () => {
  const { accessory } = buildAccessory();

  const temperature = accessory.getService(Service.TemperatureSensor).getCharacteristic(Characteristic.CurrentTemperature).value;
  const humidity = accessory.getService(Service.HumiditySensor).getCharacteristic(Characteristic.CurrentRelativeHumidity).value;

  assert.ok(Math.abs(temperature - 21.5) < 0.0001, 'temperature should be ~21.5, got ' + temperature);
  assert.equal(humidity, 76);
});

test('maps outdoor module battery data onto the Battery service', () => {
  const { accessory } = buildAccessory();

  const batteryLevel = accessory.getService(Service.Battery).getCharacteristic(Characteristic.BatteryLevel).value;
  const lowBattery = accessory.getService(Service.Battery).getCharacteristic(Characteristic.StatusLowBattery).value;

  assert.equal(batteryLevel, 91);
  assert.equal(lowBattery, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
});

test('overrides pressure from the main station on the custom Eve weather characteristic', () => {
  const { accessory } = buildAccessory();

  const pressureService = accessory.getService(accessory.name + ' Weather Main');
  const pressure = pressureService.getCharacteristic('Atmospheric Pressure').value;

  assert.equal(pressure, 10071);
});

test('updates HAP characteristics when notifyUpdate is called again with new data', () => {
  const { accessory, deviceDataMap, outdoorModule } = buildAccessory();

  const updatedMap = JSON.parse(JSON.stringify(deviceDataMap));
  updatedMap[outdoorModule._id].dashboard_data.Temperature = 15.2;
  updatedMap[outdoorModule._id].dashboard_data.Humidity = 60;

  accessory.notifyUpdate(updatedMap);

  const temperature = accessory.getService(Service.TemperatureSensor).getCharacteristic(Characteristic.CurrentTemperature).value;
  const humidity = accessory.getService(Service.HumiditySensor).getCharacteristic(Characteristic.CurrentRelativeHumidity).value;

  assert.ok(Math.abs(temperature - 15.2) < 0.0001, 'temperature should be ~15.2, got ' + temperature);
  assert.equal(humidity, 60);
});
