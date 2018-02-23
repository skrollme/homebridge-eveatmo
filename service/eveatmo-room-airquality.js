'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
	if (pHomebridge && !homebridge) {
		homebridge = pHomebridge;
		Characteristic = homebridge.hap.Characteristic;
	}

    class AQExtra1Characteristic extends Characteristic {
        constructor(accessory) {
            super('AQX1', 'E863F10B-079E-48FF-8F27-9C2605A29F52');
            this.setProps({
                format: Characteristic.Formats.UINT16,
                perms: [
                    Characteristic.Perms.READ,
                    Characteristic.Perms.HIDDEN
                ]
            });
        }
    }

    class AQExtra2Characteristic extends Characteristic {
        constructor(accessory) {
            super('AQX2', 'E863F132-079E-48FF-8F27-9C2605A29F52');
            this.setProps({
                format: Characteristic.Formats.DATA,
                perms: [
                    Characteristic.Perms.READ,
                    Characteristic.Perms.HIDDEN
                ]
            });
        }
    }
    
    class EveatmoRoomAirqualityService extends homebridge.hap.Service.AirQualitySensor {
		constructor(accessory) {
			super(accessory.name + " Room Main"); // ROOM
			this.accessory = accessory;

			this.getCharacteristic(Characteristic.AirQuality);
            this.addCharacteristic(AQExtra1Characteristic);
            this.addCharacteristic(AQExtra2Characteristic);
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
			this.setCharacteristic(Characteristic.AirQuality, this.transformCO2ToAirQuality());
            this.setCharacteristic(AQExtra1Characteristic, this.accessory.co2);
            this.setCharacteristic(AQExtra2Characteristic, '');
		}
	}

	return EveatmoRoomAirqualityService;
};
