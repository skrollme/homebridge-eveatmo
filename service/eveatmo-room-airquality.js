'use strict';

var homebridge;
var Characteristic;
var Formats;
var Units;
var Perms;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
    Formats = homebridge.hap.Formats;
    Units = homebridge.hap.Units;
    Perms = homebridge.hap.Perms;
  }

  class AQExtra1Characteristic extends Characteristic {
    constructor(accessory) {
      super('AQX1', 'E863F10B-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Formats.UINT16,
        perms: [
          Perms.READ,
          Perms.HIDDEN,
        ],
      });
    }
  }

  class AQExtra2Characteristic extends Characteristic {
    constructor(accessory) {
      super('AQX2', 'E863F132-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Formats.DATA,
        perms: [
          Perms.READ,
          Perms.HIDDEN,
        ],
      });
    }
  }

  class EveatmoRoomAirqualityService extends homebridge.hap.Service.AirQualitySensor {
    constructor(accessory) {
      super(accessory.name + ' Room Main'); // ROOM
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

      if (level > 2100) {
        quality = Characteristic.AirQuality.POOR;
      } else if (level > 1600) {
        quality = Characteristic.AirQuality.INFERIOR;
      } else if (level > 1100) {
        quality = Characteristic.AirQuality.FAIR;
      } else if (level > 700) {
        quality = Characteristic.AirQuality.GOOD;
      } else if (level >= 400) {
        quality = Characteristic.AirQuality.EXCELLENT;
      }

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
      this.accessory.refreshData((err, data) => {
        callback(err, this.transformCO2ToAirQuality());
      });
    }

    getAQExtra1(callback) {
      this.accessory.refreshData((err, data) => {
        callback(err, this.accessory.co2);
      });
    }

    getAQExtra2(callback) {
      this.accessory.refreshData((err, data) => {
        callback(err, '');
      });
    }
  }

  return EveatmoRoomAirqualityService;
};
