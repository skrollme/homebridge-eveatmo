'use strict';

var NetatmoDevice = require("../lib/netatmo-device");

var homebridge;
var EveatmoRoomAccessory;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		EveatmoRoomAccessory = require("../accessory/eveatmo-room-accessory")(homebridge);
	}

	class AirQualityDeviceType extends NetatmoDevice {
		constructor(log, api, config) {
			super(log, api, config);
			this.log.debug("Creating Air Quality Devices");
			this.deviceType = "airquality";
		}

		loadDeviceData(callback) {
			this.api.getHealthyHomeCoachData(function(err, devices) {
				var deviceMap = {};
				devices.forEach(function(device) {
					deviceMap[device._id] = device;
					device._name = this.buildDeviceName(device, this.config.module_suffix);
				}.bind(this));
				this.log.debug("Setting cache with key: "+this.deviceType);
				this.cache.set(this.deviceType, deviceMap);
				this.deviceData = deviceMap;

				if (this.accessories) {
					this.accessories.forEach(function(accessory) {
						accessory.notifyUpdate(this.deviceData);
					}.bind(this));
				}
				callback(null, this.deviceData);
			}.bind(this));
		}

		buildAccessory(deviceData) {
			if(deviceData.type == 'NHC') {
				return new EveatmoRoomAccessory(deviceData, this);
			}
			return false;
		}

		buildDeviceName(device, suffix) {
			if (suffix != "") {
				return "Air Quality " + suffix;
			} else {
				return device.station_name.substring(0, device.station_name.indexOf('(')-1) + " Air Quality";
			}
		}
	}

	return AirQualityDeviceType;

};
