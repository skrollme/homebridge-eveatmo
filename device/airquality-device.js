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

					if(this.config.module_suffix != "") {
						device._name = "Air Quality " + this.config.module_suffix;
					} else {
						device._name = device.station_name + " Air Quality";
					}
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
	}

	return AirQualityDeviceType;

};
