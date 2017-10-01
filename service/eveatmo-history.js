'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

    var hexToBase64 = function(val) {
        return new Buffer((''+val).replace(/[^0-9A-F]/ig, ''), 'hex').toString('base64');
    }

    var base64ToHex = function(val) {
        if(!val) return val;
        return new Buffer(val, 'base64').toString('hex');
    }

    var swap16 = function (val) {
        return ((val & 0xFF) << 8)
            | ((val >>> 8) & 0xFF);
    }

    var swap32 = function (val) {
        return ((val & 0xFF) << 24)
            | ((val & 0xFF00) << 8)
            | ((val >>> 8) & 0xFF00)
            | ((val >>> 24) & 0xFF);
    }

    var hexToHPA = function(val) {
        return parseInt(swap16(val), 10);
    }

    var hPAtoHex = function(val) {
        return swap16(Math.round(val)).toString(16);
    }

    var numToHex = function(val, len) {
        var s = Number(val>>>0).toString(16);
        if(s.length % 2 != 0) {
            s = '0' + s;
        }
        if(len) {
            return ('0000000000000' + s).slice(-1 * len);
        }
        return s;
    }
	
	class S2R1Characteristic extends Characteristic {
		constructor(accessory) {
			super('S2R1', 'E863F116-079E-48FF-8F27-9C2605A29F52');
			this.setProps({
				format: Characteristic.Formats.DATA,
				perms: [
					Characteristic.Perms.READ,
                    Characteristic.Perms.HIDDEN
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
					Characteristic.Perms.READ,
                    Characteristic.Perms.HIDDEN
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
					Characteristic.Perms.WRITE,
                    Characteristic.Perms.HIDDEN
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
					Characteristic.Perms.WRITE,
                    Characteristic.Perms.HIDDEN
				]
			});
		}
	}

	class EveatmoHistoryService extends homebridge.hap.Service {
		constructor(accessory, accessoryType) {
			super(accessory.name + " History", 'E863F007-079E-48FF-8F27-9C2605A29F52'); // WEATHER
			this.accessory = accessory;

            switch (accessoryType)
            {
                case "weather":
                    this.accessoryType116 = "03";
                    this.accessoryType117 = "07";
                    break;
                case "energy":
                    this.accessoryType116 = "07";
                    this.accessoryType117 = "1f";
                    break;
                case "room":
                    this.accessoryType116 = "04";
                    this.accessoryType117 = "0f";
                    break;
            }

            this.accessoryType=accessoryType;
            this.nextAvailableEntry = 1;
            this.history = [];
            this.maxHistory = 50; //4032; //4 weeks
            this.usedMemory = 1;
            this.currentEntry = 1;
            this.transfer=false;
            this.setTime=true;
            this.refTime=0;
            this.emptyingHistory=false;

			this.addCharacteristic(S2R1Characteristic)
				.on('get', this.getCurrentS2R1.bind(this));
				
			this.addCharacteristic(S2R2Characteristic)
				.on('get', this.getCurrentS2R2.bind(this));
				
			this.addCharacteristic(S2W1Characteristic)
				.on('set', this.setCurrentS2W1.bind(this));
				
			this.addCharacteristic(S2W2Characteristic)
				.on('set', this.setCurrentS2W2.bind(this));
		}

		updateCharacteristics() {
			this.getCharacteristic(S2R1Characteristic)
				.updateValue(hexToBase64('01010000 FF000000 3C0F0000 03010202 0203021D 00F50F00 00000000 000000'));
			this.getCharacteristic(S2R1Characteristic)
				.updateValue(hexToBase64('1500 0000  0000 0000  0081 7870  F51E 0000  0000 0000  00'));
		}
		
		getCurrentS2R1(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, hexToBase64('01010000 FF000000 3C0F0000 03010202 0203021D 00F50F00 00000000 000000'));
			}.bind(this));
		}
		
		getCurrentS2R2(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, hexToBase64('1500 0000  0000 0000  0081 7870  F51E 0000  0000 0000  00'));
			}.bind(this));
		}
		
		setCurrentS2W1(val, callback) {
			callback(null,val);
            this.log.debug("Data request " + this.accessoryType + ": "+ base64ToHex(val));
            var valHex = base64ToHex(val);
            var substring = valHex.substring(4,12);
            var valInt = parseInt(substring,16);
            var address = swap32(valInt);
            var hexAddress= address.toString('16');

            this.log.debug("Address requested " + this.accessoryType + ": "+ hexAddress);
            if (this.transfer==false && this.accessoryType == 'weather')
            {
            	this.log.debug("Do send");
                //this.sendHistory(address);
            }
		}
		
		setCurrentS2W2(val, callback) {
            this.log.debug("Clock adjust: "+ base64ToHex(val));
			callback(null,val);
		}
	}

	return EveatmoHistoryService;
};
