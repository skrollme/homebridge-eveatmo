'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

	class HumidityService extends homebridge.hap.Service.HumiditySensor {
		constructor(accessory) {
			super(accessory.name + " Humidity");
			this.accessory = accessory;

			this.getCharacteristic(Characteristic.CurrentRelativeHumidity);
		}

		updateCharacteristics() {
			this.setCharacteristic(Characteristic.CurrentRelativeHumidity, this.accessory.humidity);
		}
	}

	return HumidityService;
};
