'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

	class S1T1Characteristic extends Characteristic {
		constructor(accessory) {
			super('S1T1', 'E863F11E-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.READ,
					Characteristic.Perms.WRITE
				]
			});
		}
	}

	class S1T2Characteristic extends Characteristic {
		constructor(accessory) {
			super('S1T2', 'E863F112-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.READ,
					Characteristic.Perms.WRITE
				]
			});
		}
	}

	class EveatmoRoomMainService extends homebridge.hap.Service {
		constructor(accessory, hasPressure) {
			super(accessory.name + " Room Main", 'E863F002-079E-48FF-8F27-9C2605A29F52'); // ROOM
			this.accessory = accessory;

			this.addCharacteristic(Characteristic.CurrentTemperature)
				.setProps({
					minValue: -100,
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				})
				.on('get', this.getCurrentTemperature.bind(this))
				.eventEnabled = true;

			this.addCharacteristic(Characteristic.CurrentRelativeHumidity)
				.setProps({
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				})
				.on('get', this.getCurrentRelativeHumidity.bind(this))
				.eventEnabled = true;

			this.addCharacteristic(S1T1Characteristic)
				.on('get', this.getCurrentS1T1.bind(this))
				.eventEnabled = true;

			this.addCharacteristic(Characteristic.AirQuality)
				.on('get', this.getAirQuality.bind(this))
				.eventEnabled = true;
				
			/*this.addCharacteristic(Characteristic.CarbonDioxideLevel)
				.on('get', this.getCarbonDioxideLevel.bind(this))
				.eventEnabled = true;*/

			this.addCharacteristic(S1T2Characteristic)
				.on('get', this.getCurrentS1T2.bind(this))
				.eventEnabled = true;

			//this.addOptionalCharacteristic(Characteristic.Name);
		}

		hexToBase64(val) {
			return new Buffer(('' + val).replace(/[^0-9A-F]/ig, ''), 'hex').toString('base64');
		}

		swap16(val) {
			return ((val & 0xFF) << 8) |
				((val >> 8) & 0xFF);
		}

		hPAtoHex(val) {
			return this.swap16(Math.round(val)).toString(16);
		}

		transformCO2ToAirQuality() {
			var level = this.accessory.co2;
			var quality = Characteristic.AirQuality.UNKNOWN;

			if (level > 2000) quality = Characteristic.AirQuality.POOR;
			else if (level > 1500) quality = Characteristic.AirQuality.INFERIOR;
			else if (level > 1000) quality = Characteristic.AirQuality.FAIR;
			else if (level > 500) quality = Characteristic.AirQuality.GOOD;
			else if (level > 0) quality = Characteristic.AirQuality.EXCELLENT;

			return quality;
		}

		updateCharacteristics() {
			this.getCharacteristic(Characteristic.CurrentTemperature)
				.updateValue(this.accessory.currentTemperature);

			this.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateValue(this.accessory.humidity);

			this.getCharacteristic(S1T1Characteristic)
				.updateValue(this.hexToBase64('01be00be 00f44fb8 0a000000'));

			this.getCharacteristic(Characteristic.AirQuality)
				.updateValue(this.transformCO2ToAirQuality());
				
			/*this.getCharacteristic(Characteristic.CarbonDioxideLevel)
				.updateValue(this.accessory.co2);*/

			this.getCharacteristic(S1T2Characteristic)
				.updateValue(this.hexToBase64('00000000'));
		}

		getCurrentTemperature(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.currentTemperature);
			}.bind(this));
		}

		getCurrentRelativeHumidity(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.humidity);
			}.bind(this));
		}

		getCurrentS1T1(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.hexToBase64('01be00be 00f44fb8 0a000000'));
			}.bind(this));
		}

		getAirQuality(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.transformCO2ToAirQuality());
			}.bind(this));
		}
		
		/*getCarbonDioxideLevel(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.accessory.co2);
			}.bind(this));
		}*/

		getCurrentS1T2(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.hexToBase64('00000000'));
			}.bind(this));
		}
	}

	return EveatmoRoomMainService;
};
