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
				});

			this.getCharacteristic(Characteristic.StatusLowBattery)
				.setProps({
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				});

			this.getCharacteristic(Characteristic.ChargingState)
				.setProps({
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				});
		}

		updateCharacteristics() {
			this.setCharacteristic(Characteristic.BatteryLevel, this.accessory.batteryPercent);
			this.setCharacteristic(Characteristic.StatusLowBattery, this.accessory.lowBattery ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
		}
	}

	return EveatmoBatteryService;
};
