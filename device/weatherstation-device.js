'use strict';

var NetatmoDevice = require("../lib/netatmo-device");

var homebridge;
var EveatmoRoomAccessory;
var EveatmoWeatherAccessory;
var EveatmoRainAccessory;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		EveatmoRoomAccessory = require("../accessory/eveatmo-room-accessory")(homebridge);
		EveatmoWeatherAccessory = require("../accessory/eveatmo-weather-accessory")(homebridge);
		EveatmoRainAccessory = require("../accessory/eveatmo-rain-accessory")(homebridge);
	}

	class WeatherstationDeviceType extends NetatmoDevice {
		constructor(log, api, config) {
			super(log, api, config);
			this.log.debug("Creating Weatherstation Devices");
			this.deviceType = "weatherstation";
		}

		loadDeviceData(callback) {
			this.api.getStationsData(function(err, devices) {
				if (!err) {
					var deviceMap = {};
					devices.forEach(function(device) {
						deviceMap[device._id] = device;
						device._name = device.station_name + " " + device.module_name;
						if (device.modules) {
							device.modules.forEach(function(module) {
								module._name = device.station_name + " " + module.module_name;
								deviceMap[module._id] = module;
							}.bind(this));
						}
					}.bind(this));
					this.cache.set(this.deviceType, deviceMap);
					this.cache.set(this.deviceType+"_l2", deviceMap, this.ttl+60);

					/*if (this.accessories) {
						this.accessories.forEach(function(accessory) {
							accessory.notifyUpdate(data);
						}.bind(this));
					}*/

					this.l2cache = false;
					console.log("L2 off");
					this.deviceData = deviceMap;
				}
				callback(err, this.deviceData);
			}.bind(this));
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
			}
			return false;
		}
	}

	return WeatherstationDeviceType;

};
