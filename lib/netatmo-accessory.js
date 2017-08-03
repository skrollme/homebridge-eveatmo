'use strict';

var inherits = require('util').inherits;
var Accessory, Service, Characteristic, uuid;
var homebridge;

var glob = require('glob'),
	path = require('path');

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
		Accessory = homebridge.hap.Accessory;
		Service = homebridge.hap.Service;
	}

	class NetatmoAccessory extends Accessory {
		constructor(homebridge, accessoryConfig, netatmoDevice) {
			var name = accessoryConfig.name || "Netatmo " + netatmoDevice.deviceType + " " + accessoryConfig.id;
			var uid = homebridge.hap.uuid.generate('netatmo.' + accessoryConfig.netatmoType + '.' + accessoryConfig.id);
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

		getServices() {
			return this.services;
		}

		_configureAccessoryInformationService() {
			var accessoryInformationService = this.getService(Service.AccessoryInformation);

			var fwChar = accessoryInformationService.getCharacteristic(Characteristic.FirmwareRevision) ||
				accessoryInformationService.addCharacteristic(Characteristic.FirmwareRevision);

			accessoryInformationService
				//.setCharacteristic(Characteristic.Model, "Netatmo " + this.deviceType + " (" + this.netatmoType + ")")
				.setCharacteristic(Characteristic.Model, this.model)
				.setCharacteristic(Characteristic.SerialNumber, this.id)
				.setCharacteristic(Characteristic.Manufacturer, "Fakegato")
				.setCharacteristic(Characteristic.FirmwareRevision, this.firmware);
		}

		notifyUpdate(deviceData) {
			console.log("Method notifyUpdate should have been overriden " + this.name);
		}
		
		getLowBatteryLevel() {
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
		}
	}
	return NetatmoAccessory;
};