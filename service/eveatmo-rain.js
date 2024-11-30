'use strict';

var homebridge;
var Characteristic;
var Perms;
var Formats;

const RAIN_LEVEL_STYPE_ID = "D92D5391-92AF-4824-AF4A-356F25F25EA1";
const RAIN_LEVEL_CTYPE_ID = "C53F35CE-C615-4AA4-9112-EBF679C5EB14";
const RAIN_LEVEL_SUM_1H_CTYPE_ID = "10c88f40-7ec4-478c-8d5a-bd0c3cce14b7";
const RAIN_LEVEL_SUM_24H_CTYPE_ID = "ccc04890-565b-4376-b39a-3113341d9e0f";

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
		Perms = homebridge.hap.Perms;
		Formats = homebridge.hap.Formats;
	}

	class RainLevelCharacteristic extends Characteristic {
		constructor(accessory) {
			super('Rain Level', RAIN_LEVEL_CTYPE_ID);
			this.setProps({
				format: Formats.FLOAT,
				unit: "mm",
				minValue: 0,
				maxValue: 1000,
				minStep: 0.001,
				perms: [
					Perms.READ,
					Perms.NOTIFY
				]
			});
			this.value = this.getDefaultValue();
		}
	}

	class RainLevelSum1Characteristic extends Characteristic {
		constructor(accessory) {
			super('1h', RAIN_LEVEL_SUM_1H_CTYPE_ID);
			this.setProps({
				format: Formats.FLOAT,
				unit: "mm",
				minValue: 0,
				maxValue: 1000,
				minStep: 0.001,
				perms: [
					Perms.READ,
					Perms.NOTIFY
				]
			});
			this.value = this.getDefaultValue();
		}
	}

	class RainLevelSum24Characteristic extends Characteristic {
		constructor(accessory) {
			super('24h', RAIN_LEVEL_SUM_24H_CTYPE_ID);
			this.setProps({
				format: Formats.FLOAT,
				unit: "mm",
				minValue: 0,
				maxValue: 1000,
				minStep: 0.001,
				perms: [
					Perms.READ,
					Perms.NOTIFY
				]
			});
			this.value = this.getDefaultValue();
		}
	}

	class EveatmoRainService extends homebridge.hap.Service {
		constructor(accessory) {
			super(accessory.name, RAIN_LEVEL_STYPE_ID);
			this.accessory = accessory;

			this.addCharacteristic(RainLevelCharacteristic)
				.on('get', this.getRainLevel.bind(this))
				.eventEnabled = true;
			this.addCharacteristic(RainLevelSum1Characteristic)
				.on('get', this.getRainLevelSum1.bind(this))
				.eventEnabled = true;
			this.addCharacteristic(RainLevelSum24Characteristic)
				.on('get', this.getRainLevelSum24.bind(this))
				.eventEnabled = true;
		}

		updateCharacteristics() {
			this.getCharacteristic(RainLevelCharacteristic)
				.updateValue(this.accessory.rainLevel);
			this.getCharacteristic(RainLevelSum1Characteristic)
				.updateValue(this.accessory.rainLevelSum1);
			this.getCharacteristic(RainLevelSum24Characteristic)
				.updateValue(this.accessory.rainLevelSum24);
		}

		getRainLevel(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.rainLevel);
			}.bind(this));
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
