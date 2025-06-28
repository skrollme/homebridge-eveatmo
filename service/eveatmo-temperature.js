'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
  }

  class TemperatureService extends homebridge.hap.Service.TemperatureSensor {
    constructor(accessory) {
      super(accessory.name + ' Temperature');
      this.accessory = accessory;

      this.getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
          minValue: -100,
        })
        .on('get', this.getCurrentTemperature.bind(this))
        .eventEnabled = true;

      this.getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .on('get', this.getTemperatureDisplayUnit.bind(this));
    }

    updateCharacteristics() {
      this.getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(this.accessory.currentTemperature);
    }

    getCurrentTemperature(callback) {
      this.accessory.refreshData((err, data) => {
        callback(err, this.accessory.currentTemperature);
      });
    }

    getTemperatureDisplayUnit(callback) {
      callback(null, 0);
    }
  }

  return TemperatureService;
};
