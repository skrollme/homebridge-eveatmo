'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}
	
	class S2R1Characteristic extends Characteristic {
		constructor(accessory) {
			super('S2R1', 'E863F116-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.READ
				]
			});
		}
	}
	
	class S2R2Characteristic extends Characteristic {
		constructor(accessory) {
			super('S2R2', 'E863F117-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.READ
				]
			});
		}
	}
	
	class S2W1Characteristic extends Characteristic {
		constructor(accessory) {
			super('S2W1', 'E863F11C-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.WRITE
				]
			});
		}
	}
	
	class S2W2Characteristic extends Characteristic {
		constructor(accessory) {
			super('S2W2', 'E863F121-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.WRITE
				]
			});
		}
	}

	class EveatmoHistoryService extends homebridge.hap.Service {
		constructor(accessory) {
			super(accessory.name + " History", 'E863F007-079E-48FF-8F27-9C2605A29F52'); // WEATHER
			this.accessory = accessory;

			this.addCharacteristic(S2R1Characteristic)
				.on('get', this.getCurrentS2R1.bind(this));
				
			this.addCharacteristic(S2R2Characteristic)
				.on('get', this.getCurrentS2R2.bind(this));
				
			this.addCharacteristic(S2W1Characteristic)
				.on('set', this.setCurrentS2W1.bind(this));
				
			this.addCharacteristic(S2W2Characteristic)
				.on('set', this.setCurrentS2W2.bind(this));
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
			this.getCharacteristic(S2R1Characteristic)
				.updateValue(this.hexToBase64('01010000 FF000000 3C0F0000 03010202 0203021D 00F50F00 00000000 000000'));
			this.getCharacteristic(S2R1Characteristic)
				.updateValue(this.hexToBase64('1500 0000  0000 0000  0081 7870  F51E 0000  0000 0000  00'));
		}
		
		getCurrentS2R1(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.hexToBase64('01010000 FF000000 3C0F0000 03010202 0203021D 00F50F00 00000000 000000'));
			}.bind(this));
		}
		
		getCurrentS2R2(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.hexToBase64('1500 0000  0000 0000  0081 7870  F51E 0000  0000 0000  00'));
			}.bind(this));
		}
		
		setCurrentS2W1(val, callback) {
			callback(null,val);
		}
		
		setCurrentS2W2(val, callback) {
			callback(null,val);
		}
	}

	return EveatmoHistoryService;
};
