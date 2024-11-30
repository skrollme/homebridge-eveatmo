'use strict';

var homebridge;
var Characteristic;
var Perms;
var Formats;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
		Perms = homebridge.hap.Perms;
		Formats = homebridge.hap.Formats;
	}

	class EveatmoBatteryService extends homebridge.hap.Service.Battery {
		constructor(accessory) {
			super(accessory.name + " Battery");
			this.accessory = accessory;

			this.getCharacteristic(Characteristic.BatteryLevel)
				.setProps({
					perms: [
						Perms.READ,
						Perms.HIDDEN
					]
				})
				.on('get', this.getBatteryLevel.bind(this))
				.eventEnabled = true;
			this.getCharacteristic(Characteristic.StatusLowBattery)
				.setProps({
					perms: [
						Perms.READ,
						Perms.HIDDEN
					]
				})
				.on('get', this.getStatusLowBattery.bind(this))
				.eventEnabled = true;
			this.getCharacteristic(Characteristic.ChargingState)
				.setProps({
					perms: [
						Perms.READ,
						Perms.HIDDEN
					]
				})
				.on('get', this.getChargingState.bind(this));
		}

		getBatteryLevel(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.batteryPercent ? this.accessory.batteryPercent : 100);
			}.bind(this));
		}

		getStatusLowBattery(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.lowBattery ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
			}.bind(this));
		}

		getChargingState(callback) {
			callback(null, Characteristic.ChargingState.NOT_CHARGING);
		}

		updateCharacteristics() {
			this.getCharacteristic(Characteristic.BatteryLevel)
				.updateValue(this.accessory.batteryPercent);
			this.getCharacteristic(Characteristic.StatusLowBattery)
				.updateValue(this.accessory.lowBattery ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
		}
	}

	return EveatmoBatteryService;
};
