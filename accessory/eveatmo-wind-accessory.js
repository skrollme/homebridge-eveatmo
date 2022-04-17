'use strict';

var homebridge;
var Characteristic;
var NetatmoAccessory;
var path = require('path');

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		NetatmoAccessory = require("../lib/netatmo-accessory")(homebridge);
		Characteristic = homebridge.hap.Characteristic;
	}

	class EveatmoWindAccessory extends NetatmoAccessory {
		constructor(deviceData, netatmoDevice) {
			var accessoryConfig = {
				"id": deviceData._id,
				"model": "Eve Wind",
				"netatmoType": deviceData.type,
				"firmware": String(deviceData.firmware),
				"name": deviceData._name || "Eveatmo " + netatmoDevice.deviceType + " " + deviceData._id,
				"hasBattery": (deviceData.battery_vp) ? true : false,
			};

			super(homebridge, accessoryConfig, netatmoDevice);
			this.buildServices(accessoryConfig);

			this.windStrength = 0.0;
			this.gustStrength = 0.0;
			this.windAngle = 0;

			this.refreshData(function(err, data) {});
		}

		buildServices(accessoryConfig) {
			var serviceDir = path.dirname(__dirname) + '/service';
			try {
				var EveatmoWindService = require(serviceDir + '/eveatmo-wind')(homebridge);
				var serviceWind = new EveatmoWindService(this);
                serviceWind.isPrimaryService = true;
				this.addService(serviceWind);

				if (accessoryConfig.hasBattery) {
					var EveatmoBatteryService = require(serviceDir + '/eveatmo-battery')(homebridge);
					var serviceBattery = new EveatmoBatteryService(this);
					this.addService(serviceBattery);
				}

			} catch (err) {
				this.log.warn("Could not process service files for " + accessoryConfig.name);
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
				if (dashboardData.hasOwnProperty("WindStrength")) {
					result.windStrength = dashboardData.WindStrength;
				}
				if (dashboardData.hasOwnProperty("GustStrength")) {
					result.gustStrength = dashboardData.GustStrength;
				}
				if (dashboardData.hasOwnProperty("WindAngle")) {
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

			if (weatherData.hasOwnProperty("windStrength") && this.windStrength != weatherData.windStrength) {
				this.windStrength = weatherData.windStrength;
				dataChanged = true;
			}
			if (weatherData.hasOwnProperty("gustStrength") && this.gustStrength != weatherData.gustStrength) {
				this.gustStrength = weatherData.gustStrength;
				dataChanged = true;
			}
			if (weatherData.hasOwnProperty("windAngle") && this.windAngle != weatherData.windAngle) {
				this.windAngle = weatherData.windAngle;
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
					function(svc) {
						var call = svc.updateCharacteristics && svc.updateCharacteristics();
					}
				);
			}
		}
	}
	return EveatmoWindAccessory;
};
