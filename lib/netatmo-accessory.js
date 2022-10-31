'use strict';

var inherits = require('util').inherits;
var Accessory, Service, Characteristic, uuid;
var homebridge;

var path = require('path');

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
		Accessory = homebridge.hap.Accessory;
		Service = homebridge.hap.Service;
	}

	class NetatmoAccessory extends Accessory {
		constructor(homebridge, accessoryConfig, netatmoDevice) {
			var name = accessoryConfig.name || "Eveatmo " + netatmoDevice.deviceType + " " + accessoryConfig.id;
			var uid = homebridge.hap.uuid.generate('eveatmo.' + accessoryConfig.netatmoType + '.' + accessoryConfig.id);
			super(name, uid);

			this.log = netatmoDevice.log;
			this.config = netatmoDevice.config;
			this.device = netatmoDevice;
			this.id = accessoryConfig.id;
			this.name = name;
			this.deviceType = netatmoDevice.deviceType;
			this.netatmoType = accessoryConfig.netatmoType;
			this.firmware = accessoryConfig.firmware;
			this.dataTypes = accessoryConfig.dataTypes;
			this.model = accessoryConfig.model;

			this._configureAccessoryInformationService();
		}

		identify(callback) {
			this.log("Identify " + this.name);
			callback();
		}

		getServices() {
			return this.services;
		}

		_configureAccessoryInformationService() {
			var accessoryInformationService = this.getService(Service.AccessoryInformation);

			var fwChar = accessoryInformationService.getCharacteristic(Characteristic.FirmwareRevision) ||
				accessoryInformationService.addCharacteristic(Characteristic.FirmwareRevision);

			accessoryInformationService
				.setCharacteristic(Characteristic.Name, this.name)
				.setCharacteristic(Characteristic.Model, this.model)
				.setCharacteristic(Characteristic.SerialNumber, this.id)
				.setCharacteristic(Characteristic.Manufacturer, "Eveatmo")
				.setCharacteristic(Characteristic.FirmwareRevision, this.firmware);
		}

		notifyUpdate(deviceData) {
			console.log("Method notifyUpdate should have been overridden " + this.name);
		}

        refreshData(callback) {
            this.device.refreshDeviceData(function(err, deviceData) {
            	this.notifyUpdate(deviceData);
                callback(err, deviceData);
            }.bind(this),false);
        }

        extractAccessoryData(deviceData) {
            return deviceData[this.id];
        }
	}
	return NetatmoAccessory;
};
