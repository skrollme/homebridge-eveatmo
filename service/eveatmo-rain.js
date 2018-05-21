'use strict';

var homebridge;
var Characteristic;

const RAIN_LEVEL_STYPE_ID = "D92D5391-92AF-4824-AF4A-356F25F25EA1";
const RAIN_LEVEL_SUM_1H_CTYPE_ID = "10c88f40-7ec4-478c-8d5a-bd0c3cce14b7";
const RAIN_LEVEL_SUM_24H_CTYPE_ID = "ccc04890-565b-4376-b39a-3113341d9e0f";

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
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

			this.addCharacteristic(RainLevelSum1Characteristic)
				.on('get', this.getRainLevelSum1.bind(this))
				.eventEnabled = true;
			this.addCharacteristic(RainLevelSum24Characteristic)
				.on('get', this.getRainLevelSum24.bind(this))
				.eventEnabled = true;
		}

		updateCharacteristics() {
			this.getCharacteristic(RainLevelSum1Characteristic)
				.updateValue(this.accessory.rainLevelSum1);
			this.getCharacteristic(RainLevelSum24Characteristic)
				.updateValue(this.accessory.rainLevelSum24);
		}

		getRainLevelSum1(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.rainLevelSum1);
			}.bind(this));
		}

		getRainLevelSum24(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.rainLevelSum24);
			}.bind(this));
		}
	}

	return EveatmoRainService;
};
