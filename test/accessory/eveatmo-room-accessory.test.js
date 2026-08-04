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

const EveatmoRoomAccessory = require('../../accessory/eveatmo-room-accessory')(homebridge);
/* eslint-enable @typescript-eslint/no-require-imports */

function buildAccessory(config) {
  const deviceDataMap = buildDeviceDataMap();
  const indoorModule = findModuleByType(deviceDataMap, 'NAModule4');
  const netatmoDevice = createNetatmoDeviceStub(deviceDataMap, config);
  const accessory = new EveatmoRoomAccessory(indoorModule, netatmoDevice);
  return { accessory, deviceDataMap, indoorModule };
}

test('maps indoor module data onto HAP characteristics by default', () => {
  const { accessory } = buildAccessory({});

  const temperature = accessory.getService(Service.TemperatureSensor).getCharacteristic(Characteristic.CurrentTemperature).value;
  const humidity = accessory.getService(Service.HumiditySensor).getCharacteristic(Characteristic.CurrentRelativeHumidity).value;
  const batteryLevel = accessory.getService(Service.Battery).getCharacteristic(Characteristic.BatteryLevel).value;

  assert.ok(Math.abs(temperature - 22.6) < 0.0001, 'temperature should be ~22.6, got ' + temperature);
  assert.equal(humidity, 63);
  assert.equal(batteryLevel, 77);
});

test('does not add CO2 or air-quality services by default', () => {
  const { accessory } = buildAccessory({});

  assert.equal(accessory.getService(Service.CarbonDioxideSensor), undefined);
  assert.equal(accessory.getService(Service.AirQualitySensor), undefined);
});

test('adds CO2 and air-quality services when extra_co2_sensor/extra_aq_sensor are enabled', () => {
  const { accessory } = buildAccessory({ extra_co2_sensor: true, extra_aq_sensor: true, co2_alert_threshold: 1000 });

  const co2Service = accessory.getService(Service.CarbonDioxideSensor);
  const airQualityService = accessory.getService(Service.AirQualitySensor);

  const co2Level = co2Service.getCharacteristic(Characteristic.CarbonDioxideLevel).value;
  const co2Detected = co2Service.getCharacteristic(Characteristic.CarbonDioxideDetected).value;
  const airQuality = airQualityService.getCharacteristic(Characteristic.AirQuality).value;

  assert.equal(co2Level, 842);
  assert.equal(co2Detected, Characteristic.CarbonDioxideDetected.CO2_LEVELS_NORMAL);
  assert.equal(airQuality, Characteristic.AirQuality.GOOD);
});
