'use strict';

/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const fixture = require('../mockapi_calls/getstationsdata-eveatmo.json');

function buildDeviceDataMap() {
  const station = JSON.parse(JSON.stringify(fixture.body.devices[0]));
  station._name = station.station_name + ' ' + station.module_name;
  const map = { [station._id]: station };
  station.modules.forEach((module) => {
    module._name = station.station_name + ' ' + module.module_name;
    map[module._id] = module;
  });
  return map;
}

function findModuleByType(deviceDataMap, type) {
  return Object.values(deviceDataMap).find((device) => device.type === type);
}

module.exports = { buildDeviceDataMap, findModuleByType };
