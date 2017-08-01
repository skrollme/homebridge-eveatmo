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

	class EveatmoRoomAccessory extends NetatmoAccessory {
		constructor(deviceData, netatmoDevice) {
			if (deviceData.battery_vp) {
				dataTypes.push("Battery");
			}

			var accessoryConfig = {
				"id": deviceData._id,
				"netatmoType": deviceData.type,
				"firmware": deviceData.firmware,
				"name": deviceData._name || "Netatmo " + netatmoDevice.deviceType + " " + deviceData._id,
			};

			super(homebridge, accessoryConfig, netatmoDevice);
			this.buildServices(accessoryConfig);

			this.currentTemperature = 11.1;
			this.co2 = 500;
			this.batteryPercent = 100;
			this.lowBattery = false;
			this.airPressure = 1000;
			this.humidity = 50;

			this.refreshData(function(err, data) {});
		}

		buildServices(accessoryConfig) {
			var serviceDir = path.dirname(__dirname) + '/service';
			try {
				var EveatmoRoomMainService = require(serviceDir + '/eveatmoroom-main')(homebridge);
				var serviceMain = new EveatmoRoomMainService(this);
				this.addService(serviceMain);
				
				var EveatmoRoomSecondService = require(serviceDir + '/eveatmoroom-second')(homebridge);
				var serviceSecond = new EveatmoRoomSecondService(this);
				this.addService(serviceSecond);
				
				// TODO Historyservice
				
			} catch (err) {
				this.log.warn("Could not process service files for " + accessoryConfig.name);
				this.log.warn(err);
				this.log.warn(err.stack);
			}
		}

		refreshData(callback) {
			this.device.refreshDeviceData(function(err, deviceData) {
				if (!err) {
					this.notifyUpdate(deviceData);
				}
				callback(err, deviceData);
			}.bind(this));
		}

		notifyUpdate(deviceData) {
			var accessoryData = this.extractAccessoryData(deviceData);
			var weatherData = this.mapAccessoryDataToWeatherData(accessoryData);
			this.applyWeatherData(weatherData);
		}

		extractAccessoryData(deviceData) {
			return deviceData[this.id];
		}

		/*getLowBatteryLevel() {
			var levels = {
				NAMain: 4560,
				NAModule1: 4000,
				NAModule2: 4360,
				NAModule3: 4000,
				NAModule4: 4560
			};

			if (levels[this.netatmoType]) {
				return levels[this.netatmoType];
			}
			return 4560;
		}

		getFullBatteryLevel() {
			var levels = {
				NAMain: 5640,
				NAModule1: 5500,
				NAModule2: 5590,
				NAModule3: 5500,
				NAModule4: 5640
			};

			if (levels[this.netatmoType]) {
				return levels[this.netatmoType];
			}
			return 5640;
		}*/

		mapAccessoryDataToWeatherData(accessoryData) {
			var result = {};

			var dashboardData = accessoryData.dashboard_data;
			if (dashboardData) {
				if (dashboardData.Temperature) {
					result.currentTemperature = dashboardData.Temperature;
				}
				if (dashboardData.CO2) {
					result.co2 = dashboardData.CO2;
				}
				if (dashboardData.Pressure) {
					result.airPressure = dashboardData.Pressure;
				}
				if (dashboardData.Humidity) {
					result.humidity = dashboardData.Humidity;
				}
			}

			/*result.batteryPercent = accessoryData.battery_percent;
			result.lowBattery = false;

			if (accessoryData.battery_vp) {
				if (!result.batteryPercent) {
					var minBatteryLevel = this.getLowBatteryLevel();
					result.batteryPercent = Math.min(Math.round(Math.max(accessoryData.battery_vp - minBatteryLevel, 0) / (this.getFullBatteryLevel() - minBatteryLevel) * 100), 100);
				}
				if (accessoryData.battery_vp < this.getLowBatteryLevel()) {
					result.lowBattery = true;
				}
			}

			if (!result.batteryPercent) {
				result.batteryPercent = 100;
			}*/

			return result;
		}

		applyWeatherData(weatherData) {
			var dataChanged = false;

			if (weatherData.currentTemperature && this.currentTemperature != weatherData.currentTemperature) {
				this.currentTemperature = weatherData.currentTemperature;
				dataChanged = true;
			}
			if (weatherData.co2 && this.co2 != weatherData.co2) {
				this.co2 = weatherData.co2;
				dataChanged = true;
			}
			if (weatherData.airPressure && this.airPressure != weatherData.airPressure) {
				this.airPressure = weatherData.airPressure;
				dataChanged = true;
			}
			if (weatherData.humidity && this.humidity != weatherData.humidity) {
				this.humidity = weatherData.humidity;
				dataChanged = true;
			}
			if (weatherData.batteryPercent && this.batteryPercent != weatherData.batteryPercent) {
				this.batteryPercent = weatherData.batteryPercent;
				dataChanged = true;
			}
			/*if (weatherData.lowBattery && this.lowBattery != weatherData.lowBattery) {
				this.lowBattery = weatherData.lowBattery;
				dataChanged = true;
			}*/

			if (dataChanged) {
				this.getServices().forEach(
					function(svc) {
						var call = svc.updateCharacteristics && svc.updateCharacteristics();
					}
				);
			}
		}

		/*isSupportedService(serviceType) {
			var isConfigured = this.configuredServices.indexOf(serviceType) > -1;
			if (!isConfigured) return false;

			var serviceBasetype = serviceType.split('-')[0];

			switch (serviceBasetype) {
				case "temperature":
					return this.dataTypes.indexOf("Temperature") > -1;
				case "airquality":
					return this.dataTypes.indexOf("CO2") > -1;
				case "co2":
					return this.dataTypes.indexOf("CO2") > -1;
				case "battery":
					return this.dataTypes.indexOf("Battery") > -1;
				case "humidity":
					return this.dataTypes.indexOf("Humidity") > -1;
				case "airpressure":
					return this.dataTypes.indexOf("Pressure") > -1;
			}
			return false;
		}*/

	}
	return EveatmoRoomAccessory;
};
