'use strict';

var homebridge;
var NetatmoAccessory;

/* eslint-disable-next-line no-undef */
module.exports = function (pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    /* eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef */
    NetatmoAccessory = require('../lib/netatmo-accessory')(homebridge);
  }

  class EveatmoWindAccessory extends NetatmoAccessory {
    constructor(deviceData, netatmoDevice) {
      var accessoryConfig = {
        'id': deviceData._id,
        'model': 'Eve Wind',
        'netatmoType': deviceData.type,
        'firmware': String(deviceData.firmware),
        'name': deviceData._name || 'Eveatmo ' + netatmoDevice.deviceType + ' ' + deviceData._id,
        'hasBattery': (deviceData.battery_vp) ? true : false,
      };

      super(homebridge, accessoryConfig, netatmoDevice);
      this.buildServices(accessoryConfig);

      this.windStrength = 0.0;
      this.gustStrength = 0.0;
      this.windAngle = 0;

      this.refreshData(() => { });
    }

    buildServices(accessoryConfig) {
      /* eslint-disable-next-line no-undef */
      var serviceDir = __dirname.replace('/accessory', '/service');
      try {
        /* eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef */
        var EveatmoWindService = require(serviceDir + '/eveatmo-wind')(homebridge);
        var serviceWind = new EveatmoWindService(this);
        serviceWind.isPrimaryService = true;
        this.addService(serviceWind);

        if (accessoryConfig.hasBattery) {
          /* eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef */
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
      if (!accessoryData.reachable && !force) {
        return;
      }

      var weatherData = this.mapAccessoryDataToWeatherData(accessoryData);
      this.applyWeatherData(weatherData);
    }

    mapAccessoryDataToWeatherData(accessoryData) {
      var result = {};
      var dashboardData = accessoryData.dashboard_data;
      if (dashboardData) {
        if (Object.prototype.hasOwnProperty.call(dashboardData, 'WindStrength')) {
          result.windStrength = dashboardData.WindStrength;
        }
        if (Object.prototype.hasOwnProperty.call(dashboardData, 'GustStrength')) {
          result.gustStrength = dashboardData.GustStrength;
        }
        if (Object.prototype.hasOwnProperty.call(dashboardData, 'WindAngle')) {
          result.windAngle = dashboardData.WindAngle;
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

      if (Object.prototype.hasOwnProperty.call(weatherData, 'windStrength') && this.windStrength !== weatherData.windStrength) {
        this.windStrength = weatherData.windStrength;
        dataChanged = true;
      }
      if (Object.prototype.hasOwnProperty.call(weatherData, 'gustStrength') && this.gustStrength !== weatherData.gustStrength) {
        this.gustStrength = weatherData.gustStrength;
        dataChanged = true;
      }
      if (Object.prototype.hasOwnProperty.call(weatherData, 'windAngle') && this.windAngle !== weatherData.windAngle) {
        this.windAngle = weatherData.windAngle;
        dataChanged = true;
      }

      if (weatherData.batteryPercent && this.batteryPercent !== weatherData.batteryPercent) {
        this.batteryPercent = weatherData.batteryPercent;
        dataChanged = true;
      }
      if (this.lowBattery !== weatherData.lowBattery) {
        this.lowBattery = weatherData.lowBattery;
        dataChanged = true;
      }

      if (dataChanged) {
        this.getServices().forEach(
          (svc) => {
            if (svc.updateCharacteristics) {
              svc.updateCharacteristics();
            }
          },
        );
      }
    }
  }
  return EveatmoWindAccessory;
};
