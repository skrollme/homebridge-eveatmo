'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

	class TemperatureService extends homebridge.hap.Service.TemperatureSensor {
		constructor(accessory) {
			super(accessory.name + " Temperature");
			this.accessory = accessory;

			this.getCharacteristic(Characteristic.CurrentTemperature)
				.setProps({
					minValue: -100
				})
				.eventEnabled = true;
		}

		updateCharacteristics() {
			this.setCharacteristic(Characteristic.CurrentTemperature, this.accessory.currentTemperature);
		}
	}

	return TemperatureService;
};
