'use strict';

/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { createLog } = require('./log');

function createNetatmoDeviceStub(deviceDataMap, config) {
  return {
    deviceData: deviceDataMap,
    log: createLog(),
    config: config || {},
    deviceType: 'weatherstation',
    refreshDeviceData(callback) {
      callback(null, this.deviceData);
    },
  };
}

module.exports = { createNetatmoDeviceStub };
