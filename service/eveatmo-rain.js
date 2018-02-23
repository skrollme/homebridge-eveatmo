'use strict';

var homebridge;
var Characteristic;

const RAIN_LEVEL_STYPE_ID = "D92D5391-92AF-4824-AF4A-356F25F25EA1";
const RAIN_LEVEL_CTYPE_ID = "C53F35CE-C615-4AA4-9112-EBF679C5EB14";
const RAIN_LEVEL_SUM_1H_CTYPE_ID = "11646117-878C-456B-A770-3924151F773D";
const RAIN_LEVEL_SUM_24H_CTYPE_ID = "E67DDC66-BEB7-4D0C-BD0C-022DB570DABC";

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

	class RainLevelCharacteristic extends Characteristic {
		constructor(accessory) {
			super('Currently', RAIN_LEVEL_CTYPE_ID);
			this.setProps({
				format: Characteristic.Formats.FLOAT,
				unit: "mm",
				minValue: 0,
				maxValue: 1000,
				minStep: 0.001,
				perms: [
					Characteristic.Perms.READ,
					Characteristic.Perms.NOTIFY
				]
			});
			this.value = this.getDefaultValue();
		}
	}

	class RainLevelSum1Characteristic extends Characteristic {
		constructor(accessory) {
			super('1h', RAIN_LEVEL_SUM_1H_CTYPE_ID);
			this.setProps({
				format: Characteristic.Formats.FLOAT,
				unit: "mm",
				minValue: 0,
				maxValue: 1000,
				minStep: 0.001,
				perms: [
					Characteristic.Perms.READ,
					Characteristic.Perms.NOTIFY
				]
			});
			this.value = this.getDefaultValue();
		}
	}

	class RainLevelSum24Characteristic extends Characteristic {
		constructor(accessory) {
			super('24h', RAIN_LEVEL_SUM_24H_CTYPE_ID);
			this.setProps({
				format: Characteristic.Formats.FLOAT,
				unit: "mm",
				minValue: 0,
				maxValue: 1000,
				minStep: 0.001,
				perms: [
					Characteristic.Perms.READ,
					Characteristic.Perms.NOTIFY
				]
			});
			this.value = this.getDefaultValue();
		}
	}

	class EveatmoRainService extends homebridge.hap.Service {
		constructor(accessory) {
			super(accessory.name, RAIN_LEVEL_STYPE_ID);
			this.accessory = accessory;

			this.addCharacteristic(RainLevelCharacteristic);
			this.addCharacteristic(RainLevelSum1Characteristic);
			this.addCharacteristic(RainLevelSum24Characteristic);
		}

		updateCharacteristics() {
			this.setCharacteristic(RainLevelCharacteristic, this.accessory.rainLevel);
			this.setCharacteristic(RainLevelSum1Characteristic, this.accessory.rainLevelSum1);
			this.setCharacteristic(RainLevelSum24Characteristic, this.accessory.rainLevelSum24);
		}
	}

	return EveatmoRainService;
};
