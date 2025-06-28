'use strict';

var homebridge;
var Characteristic;
var NetatmoAccessory;
var path = require('path');

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    NetatmoAccessory = require('../lib/netatmo-accessory')(homebridge);
    Characteristic = homebridge.hap.Characteristic;
  }

  class EveatmoRainAccessory extends NetatmoAccessory {
    constructor(deviceData, netatmoDevice) {
      var accessoryConfig = {
        'id': deviceData._id,
        'model': 'Eve Rain',
        'netatmoType': deviceData.type,
        'firmware': String(deviceData.firmware),
        'name': deviceData._name || 'Eveatmo ' + netatmoDevice.deviceType + ' ' + deviceData._id,
        'hasBattery': (deviceData.battery_vp) ? true : false,
      };

      super(homebridge, accessoryConfig, netatmoDevice);
      this.buildServices(accessoryConfig);

      this.rainLevel = 0;
      this.rainLevelSum1 = 0;
      this.rainLevelSum24 = 0;

      this.refreshData((err, data) => {});
    }

    buildServices(accessoryConfig) {
      var serviceDir = path.dirname(__dirname) + '/service';
      try {
        var EveatmoRainService = require(serviceDir + '/eveatmo-rain')(homebridge);
        var serviceRain = new EveatmoRainService(this);
        serviceRain.isPrimaryService = true;
        this.addService(serviceRain);

        if (accessoryConfig.hasBattery) {
          var EveatmoBatteryService = require(serviceDir + '/eveatmo-battery')(homebridge);
          var serviceBattery = new EveatmoBatteryService(this);
          this.addService(serviceBattery);
        }

      } catch (err) {
        this.log.warn('Could not process service files for ' + accessoryConfig.name);
        this.log.warn(err);
        this.log.warn(err.stack);
      }
    }

    notifyUpdate(deviceData, force) {
      var accessoryData = this.extractAccessoryData(deviceData);
      if(!accessoryData.reachable && !force) {
        return;
      }

      var weatherData = this.mapAccessoryDataToWeatherData(accessoryData);
      this.applyWeatherData(weatherData);
    }

    mapAccessoryDataToWeatherData(accessoryData) {
      var result = {};
      var dashboardData = accessoryData.dashboard_data;
      if (dashboardData) {
        if (dashboardData.hasOwnProperty('Rain')) {
          result.rainLevel = Math.round(dashboardData.Rain * 1000) / 1000;
        }
        if (dashboardData.hasOwnProperty('sum_rain_1')) {
          result.rainLevelSum1 = Math.round(dashboardData.sum_rain_1 * 1000) / 1000;
        }
        if (dashboardData.hasOwnProperty('sum_rain_24')) {
          result.rainLevelSum24 = Math.round(dashboardData.sum_rain_24 * 1000) / 1000;
        }
      }

      result.batteryPercent = accessoryData.battery_percent;
      if (!result.batteryPercent) {
        result.batteryPercent = 100;
      }
      result.lowBattery = (result.batteryPercent <= 20) ? true : false;

      return result;
    }

    applyWeatherData(weatherData) {
      var dataChanged = false;

      if (weatherData.hasOwnProperty('rainLevel') && this.rainLevel != weatherData.rainLevel) {
        this.rainLevel = weatherData.rainLevel;
        dataChanged = true;
      }
      if (weatherData.hasOwnProperty('rainLevelSum1') && this.rainLevelSum1 != weatherData.rainLevelSum1) {
        this.rainLevelSum1 = weatherData.rainLevelSum1;
        dataChanged = true;
      }
      if (weatherData.hasOwnProperty('rainLevelSum24') && this.rainLevelSum24 != weatherData.rainLevelSum24) {
        this.rainLevelSum24 = weatherData.rainLevelSum24;
        dataChanged = true;
      }

      if (weatherData.batteryPercent && this.batteryPercent != weatherData.batteryPercent) {
        this.batteryPercent = weatherData.batteryPercent;
        dataChanged = true;
      }
      if (this.lowBattery != weatherData.lowBattery) {
        this.lowBattery = weatherData.lowBattery;
        dataChanged = true;
      }

      if (dataChanged) {
        this.getServices().forEach(
          (svc) => {
            var call = svc.updateCharacteristics && svc.updateCharacteristics();
          },
        );
      }
    }
  }
  return EveatmoRainAccessory;
};
