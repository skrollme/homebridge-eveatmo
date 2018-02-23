'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

	class AtmosphericPressureCharacteristic extends Characteristic {
		constructor(accessory) {
			super('Atmospheric Pressure', 'E863F10F-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				unit: "hPA",
				minValue: 500,
				maxValue: 2000,
				minStep: 0.1,
				perms: [
					Characteristic.Perms.READ,
					Characteristic.Perms.NOTIFY
				]
			});
		}
	}

	class S1T1Characteristic extends Characteristic {
		constructor(accessory) {
			super('S1T1', 'E863F11E-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.READ,
					Characteristic.Perms.WRITE,
                    Characteristic.Perms.HIDDEN
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
					Characteristic.Perms.WRITE,
                    Characteristic.Perms.HIDDEN
				]
			});
		}
	}

	class EveatmoWeatherPressureService extends homebridge.hap.Service {
		constructor(accessory) {
			super(accessory.name + " Weather Main", 'E863F001-079E-48FF-8F27-9C2605A29F52'); // WEATHER
			this.accessory = accessory;

			this.addCharacteristic(Characteristic.CurrentTemperature)
				.setProps({
					minValue: -100,
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				});

			this.addCharacteristic(Characteristic.CurrentRelativeHumidity)
				.setProps({
					perms: [
						Characteristic.Perms.READ,
						Characteristic.Perms.HIDDEN
					]
				});

			this.addCharacteristic(AtmosphericPressureCharacteristic);
			this.addCharacteristic(S1T1Characteristic);
			this.addCharacteristic(S1T2Characteristic);
		}

		hexToBase64(val) {
			return new Buffer(('' + val).replace(/[^0-9A-F]/ig, ''), 'hex').toString('base64');
		}

		swap16(val) {
			return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
		}

		hPAtoHex(val) {
			return this.swap16(Math.round(val)).toString(16);
		}

		updateCharacteristics() {
			this.setCharacteristic(Characteristic.CurrentTemperature, this.accessory.currentTemperature);
			this.setCharacteristic(Characteristic.CurrentRelativeHumidity, this.accessory.humidity);
			this.setCharacteristic(AtmosphericPressureCharacteristic, this.hexToBase64(this.hPAtoHex(parseInt(this.accessory.pressure * 10))));
			this.setCharacteristic(S1T1Characteristic, this.hexToBase64(''));
			this.setCharacteristic(S1T2Characteristic, this.hexToBase64('00000000'));
		}
	}

	return EveatmoWeatherPressureService;
};
