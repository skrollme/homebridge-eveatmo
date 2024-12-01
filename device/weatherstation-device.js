'use strict';

var NetatmoDevice = require('../lib/netatmo-device');

var homebridge;
var EveatmoRoomAccessory;
var EveatmoWeatherAccessory;
var EveatmoRainAccessory;
var EveatmoWindAccessory;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    EveatmoRoomAccessory = require('../accessory/eveatmo-room-accessory')(homebridge);
    EveatmoWeatherAccessory = require('../accessory/eveatmo-weather-accessory')(homebridge);
    EveatmoRainAccessory = require('../accessory/eveatmo-rain-accessory')(homebridge);
    EveatmoWindAccessory = require('../accessory/eveatmo-wind-accessory')(homebridge);
  }

  class WeatherstationDeviceType extends NetatmoDevice {
    constructor(log, api, config) {
      super(log, api, config);
      this.log.debug('Creating Weatherstation Devices');
      this.deviceType = 'weatherstation';
    }

    loadDeviceData(callback) {
      this.api.getStationsData((err, devices) => {
        var deviceMap = {};
        devices.forEach((device) => {
          deviceMap[device._id] = device;
          device._name = this.buildDeviceName(device, this.config.module_suffix);

          if (device.modules) {
            device.modules.forEach((module) => {
              module._name = this.buildModuleName(device, module, this.config.module_suffix);
              deviceMap[module._id] = module;
            });
          }
        });
        this.log.debug('Setting cache with key: '+this.deviceType);
        this.cache.set(this.deviceType, deviceMap);
        this.deviceData = deviceMap;

        if (this.accessories) {
          this.accessories.forEach((accessory) => {
            accessory.notifyUpdate(this.deviceData);
          });
        }
        callback(null, this.deviceData);
      });
    }

    buildAccessory(deviceData) {
      if(deviceData.type == 'NAMain') { // Basestation
        return new EveatmoRoomAccessory(deviceData, this);
      } else if(deviceData.type == 'NAModule4') { // Indoor
        return new EveatmoRoomAccessory(deviceData, this);
      } else if(deviceData.type == 'NAModule1') { // Outdoor
        return new EveatmoWeatherAccessory(deviceData, this);
      } else if(deviceData.type == 'NAModule3') { // Rain
        return new EveatmoRainAccessory(deviceData, this);
      } else if(deviceData.type == 'NAModule2') { // Wind
        return new EveatmoWindAccessory(deviceData, this);
      }
      return false;
    }

    buildDeviceName(device, suffix) {
      if (suffix != '') {
        return device.module_name + ' ' + suffix;
      } else {
        return device.station_name.substring(0, device.station_name.indexOf(' ')) + ' ' + device.module_name;
      }
    }

    buildModuleName(device, module, suffix) {
      if (suffix != '') {
        return module.module_name + ' ' + suffix;
      } else {
        return device.station_name.substring(0, device.station_name.indexOf('(')-1) + ' ' + module.module_name;
      }
    }
  }

  return WeatherstationDeviceType;

};
