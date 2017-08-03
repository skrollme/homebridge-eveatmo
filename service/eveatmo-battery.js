'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

	class EveatmoBatteryService extends homebridge.hap.Service.BatteryService {
		constructor(accessory) {
			super(accessory.name + " Battery");
			this.accessory = accessory;

			this.getCharacteristic(Characteristic.BatteryLevel)
				.setProps({
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				})
				.on('get', this.getBatteryLevel.bind(this))
				.eventEnabled = true;
			this.getCharacteristic(Characteristic.StatusLowBattery)
				.setProps({
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				})
				.on('get', this.getStatusLowBattery.bind(this))
				.eventEnabled = true;
			this.getCharacteristic(Characteristic.ChargingState)
				.setProps({
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				})
				.on('get', this.getChargingState.bind(this));
		}

		getBatteryLevel(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.batteryPercent);
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
