'use strict';

var homebridge;
var Characteristic;
var NetatmoAccessory;
var path = require('path');
var FakeGatoHistoryService;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		NetatmoAccessory = require("../lib/netatmo-accessory")(homebridge);
		Characteristic = homebridge.hap.Characteristic;
        FakeGatoHistoryService = require('fakegato-history')(homebridge);
	}

	class EveatmoRoomAccessory extends NetatmoAccessory {
		constructor(deviceData, netatmoDevice) {
			var accessoryConfig = {
				"id": deviceData._id,
				"model": "Eve Room",
				"netatmoType": deviceData.type,
				"firmware": deviceData.firmware,
				"name": deviceData._name || "Eveatmo " + netatmoDevice.deviceType + " " + deviceData._id,
				"hasBattery": (deviceData.battery_vp)?true:false,
				"hasPressure": (deviceData.data_type.indexOf("Pressure") >= 0)?true:false,
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
				var TemperatureService = require(serviceDir + '/eveatmo-temperature')(homebridge);
				var serviceTemperature = new TemperatureService(this);
				this.addService(serviceTemperature);
				
				var HumidityService = require(serviceDir + '/eveatmo-humidity')(homebridge);
				var serviceHumidity = new HumidityService(this);
				this.addService(serviceHumidity);
				
				var EveatmoRoomAirqualityService = require(serviceDir + '/eveatmo-room-airquality')(homebridge);
                var serviceAirquality = new EveatmoRoomAirqualityService(this, accessoryConfig.hasPressure, this.config.extra_co2_sensor);
                this.addService(serviceAirquality);

                if(this.config.extra_co2_sensor) {
                    var EveatmoRoomCo2Service = require(serviceDir + '/eveatmo-co2')(homebridge);
                    var serviceCo2 = new EveatmoRoomCo2Service(this);
                    this.addService(serviceCo2);
                }
				
				if(accessoryConfig.hasBattery) {
					var EveatmoBatteryService = require(serviceDir + '/eveatmo-battery')(homebridge);
					var serviceBattery = new EveatmoBatteryService(this);
					this.addService(serviceBattery);
				}

                this.historyService = new FakeGatoHistoryService("room", this, {size: 4032, storage:'fs'});
				
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

            this.historyService.addEntry({
                time: new Date().getTime() / 1000,
                temp: weatherData["currentTemperature"],
                humidity: weatherData["humidity"],
                ppm: weatherData["co2"]
            });

			this.applyWeatherData(weatherData);
		}

		extractAccessoryData(deviceData) {
			return deviceData[this.id];
		}

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

			result.batteryPercent = accessoryData.battery_percent;
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
			}

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
	return EveatmoRoomAccessory;
};
