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

	class S1T3Characteristic extends Characteristic {
		constructor(accessory) {
			super('S1T3', 'E863F11B-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.READ
				]
			});
		}
	}

	class EveatmoWeatherMainService extends homebridge.hap.Service {
		constructor(accessory, hasPressure) {
			super(accessory.name + " Eve Weather S1", 'E863F001-079E-48FF-8F27-9C2605A29F52'); // WEATHER
			this.accessory = accessory;

			this.addCharacteristic(Characteristic.CurrentTemperature)
				.setProps({
					minValue: -100
				})
				.on('get', this.getCurrentTemperature.bind(this))
				.eventEnabled = true;

			this.addCharacteristic(Characteristic.CurrentRelativeHumidity)
				.on('get', this.getCurrentRelativeHumidity.bind(this))
				.eventEnabled = true;

			this.addCharacteristic(S1T1Characteristic)
				.on('get', this.getCurrentS1T1.bind(this))
				.eventEnabled = true;

			if (hasPressure) {
				this.addCharacteristic(AtmosphericPressureCharacteristic)
					.on('get', this.getAtmosphericPressure.bind(this))
					.eventEnabled = true;
			}

			this.addCharacteristic(Characteristic.AirQuality)
				.on('get', this.getAirQuality.bind(this))
				.eventEnabled = true;
				
			this.addCharacteristic(Characteristic.CarbonDioxideLevel)
				.on('get', this.getCarbonDioxideLevel.bind(this))
				.eventEnabled = true;

			this.addCharacteristic(S1T2Characteristic)
				.on('get', this.getCurrentS1T2.bind(this))
				.eventEnabled = true;

			this.addCharacteristic(S1T3Characteristic)
				.on('get', this.getCurrentS1T3.bind(this))
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

		updateCharacteristics() {
			this.getCharacteristic(Characteristic.CurrentTemperature)
				.updateValue(this.accessory.currentTemperature);

			this.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateValue(this.accessory.humidity);

			this.getCharacteristic(S1T1Characteristic)
				.updateValue(this.hexToBase64('01be00be 00f44fb8 0a000000'));

			this.getCharacteristic(S1T2Characteristic)
				.updateValue(this.hexToBase64('00000000'));

			this.getCharacteristic(S1T3Characteristic)
				.updateValue(this.hexToBase64('64'));
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

		getCurrentS1T2(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.hexToBase64('00000000'));
			}.bind(this));
		}

		getCurrentS1T3(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.hexToBase64('64'));
			}.bind(this));
		}
	}

	return EveatmoRoomMainService;
};
