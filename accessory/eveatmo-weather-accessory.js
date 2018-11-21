'use strict';

var homebridge;
var Characteristic;
var NetatmoAccessory;
var path = require('path');
var mainDeviceId = false;
var FakeGatoHistoryService;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		NetatmoAccessory = require("../lib/netatmo-accessory")(homebridge);
		Characteristic = homebridge.hap.Characteristic;
        FakeGatoHistoryService = require('fakegato-history')(homebridge);
	}

	class EveatmoWeatherAccessory extends NetatmoAccessory {
		constructor(deviceData, netatmoDevice) {
			
			for (var deviceId in netatmoDevice.deviceData) {
				if (!netatmoDevice.deviceData.hasOwnProperty(deviceId)) continue;
				var device = netatmoDevice.deviceData[deviceId];
				
				if(device.dashboard_data && device.dashboard_data.Pressure) {
					mainDeviceId = deviceId;
				}
			}
			
			var accessoryConfig = {
				"id": deviceData._id,
				"model": "Eve Weather",
				"netatmoType": deviceData.type,
				"firmware": deviceData.firmware,
				"name": deviceData._name || "Eveatmo " + netatmoDevice.deviceType + " " + deviceData._id,
				"hasBattery": (deviceData.battery_vp)?true:false,
			};

			super(homebridge, accessoryConfig, netatmoDevice);
			this.buildServices(accessoryConfig);

			this.currentTemperature = 11.1;
			this.batteryPercent = 100;
			this.lowBattery = false;
			this.humidity = 50;
			this.pressure = 1000.0;

			this.refreshData(function(err, data) {});
		}

		buildServices(accessoryConfig) {
			var serviceDir = path.dirname(__dirname) + '/service';
			try {
				var TemperatureService = require(serviceDir + '/eveatmo-temperature')(homebridge);
				var serviceTemperature = new TemperatureService(this);
				this.addService(serviceTemperature);
				
				var HumidityService = require(serviceDir + '/eveatmo-humidity')(homebridge);
				var serviceHumidity = new HumidityService(this);
				this.addService(serviceHumidity);
				
				var EveatmoWeatherPressureService = require(serviceDir + '/eveatmo-weather-pressure')(homebridge);
				var servicePressure = new EveatmoWeatherPressureService(this);
				this.addService(servicePressure);
				
				if(accessoryConfig.hasBattery) {
					var EveatmoBatteryService = require(serviceDir + '/eveatmo-battery')(homebridge);
					var serviceBattery = new EveatmoBatteryService(this);
					this.addService(serviceBattery);
				}

                this.historyService = new FakeGatoHistoryService("weather", this, {storage:'fs'});

			} catch (err) {
				this.log.warn("Could not process service files for " + accessoryConfig.name);
				this.log.warn(err);
				this.log.warn(err.stack);
			}
		}

		notifyUpdate(deviceData) {
			var accessoryData = this.extractAccessoryData(deviceData);
			var weatherData = this.mapAccessoryDataToWeatherData(accessoryData);
			
			// transfer NAMain's pressure value to outdoor-module
			if(mainDeviceId) {
				if(deviceData[mainDeviceId]) {
					weatherData["pressure"] = deviceData[mainDeviceId].dashboard_data.Pressure;
				}
			}

            this.historyService.addEntry({
                time: new Date().getTime() / 1000,
                temp: weatherData["currentTemperature"],
                pressure: weatherData["pressure"],
                humidity: weatherData["humidity"]
            });
			
			this.applyWeatherData(weatherData);
		}

		mapAccessoryDataToWeatherData(accessoryData) {
			var result = {};
			var dashboardData = accessoryData.dashboard_data;
			if (dashboardData) {
				if (dashboardData.hasOwnProperty("Temperature")) {
					result.currentTemperature = dashboardData.Temperature;
				}
				if (dashboardData.Humidity) {
					result.humidity = dashboardData.Humidity;
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

			if (weatherData.hasOwnProperty("currentTemperature") && this.currentTemperature != weatherData.currentTemperature) {
				this.currentTemperature = weatherData.currentTemperature;
				dataChanged = true;
			}
			if (weatherData.humidity && this.humidity != weatherData.humidity) {
				this.humidity = weatherData.humidity;
				dataChanged = true;
			}
			if (weatherData.pressure && this.pressure != weatherData.pressure) {
				this.pressure = weatherData.pressure;
				dataChanged = true;
			}
			if (weatherData.batteryPercent && this.batteryPercent != weatherData.batteryPercent) {
				this.batteryPercent = weatherData.batteryPercent;
				dataChanged = true;
			}
			if (weatherData.lowBattery && this.lowBattery != weatherData.lowBattery) {
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
	return EveatmoWeatherAccessory;
};
