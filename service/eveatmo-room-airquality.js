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

			this.getCharacteristic(Characteristic.AirQuality)
				.on('get', this.getAirQuality.bind(this))
				.eventEnabled = true;

			// extra characteristic for stock home.app
            var co2LevelCharacteristic = this.getCharacteristic(Characteristic.CarbonDioxideLevel) ||
                this.addCharacteristic(Characteristic.CarbonDioxideLevel);
            co2LevelCharacteristic.on('get', this.getAQExtra1.bind(this))
                .eventEnabled = true;

            this.addCharacteristic(AQExtra1Characteristic)
                .on('get', this.getAQExtra1.bind(this));

            this.addCharacteristic(AQExtra2Characteristic)
                .on('get', this.getAQExtra2.bind(this));
		}

		transformCO2ToAirQuality() {
			var level = this.accessory.co2;
			var quality = Characteristic.AirQuality.UNKNOWN;

			if (level > 2100) quality = Characteristic.AirQuality.POOR;
			else if (level > 1600) quality = Characteristic.AirQuality.INFERIOR;
			else if (level > 1100) quality = Characteristic.AirQuality.FAIR;
			else if (level > 700) quality = Characteristic.AirQuality.GOOD;
			else if (level > 450) quality = Characteristic.AirQuality.EXCELLENT;

			return quality;
		}

		updateCharacteristics() {
			this.getCharacteristic(Characteristic.AirQuality)
				.updateValue(this.transformCO2ToAirQuality());

            this.getCharacteristic(Characteristic.CarbonDioxideLevel)
                .updateValue(this.accessory.co2);
            this.getCharacteristic(AQExtra1Characteristic)
                .updateValue(this.accessory.co2);

            this.getCharacteristic(AQExtra2Characteristic)
                .updateValue('');
		}

		getAirQuality(callback) {
			this.accessory.refreshData(function(err, data) {
				callback(err, this.transformCO2ToAirQuality());
			}.bind(this));
		}

        getAQExtra1(callback) {
            this.accessory.refreshData(function(err, data) {
                callback(err, this.accessory.co2);
            }.bind(this));
        }

        getAQExtra2(callback) {
            this.accessory.refreshData(function(err, data) {
                callback(err, '');
            }.bind(this));
        }
	}

	return EveatmoRoomAirqualityService;
};
