'use strict';

var homebridge;
var Characteristic;

/* eslint-disable-next-line no-undef */
module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
  }

  class HumidityService extends homebridge.hap.Service.HumiditySensor {
    constructor(accessory) {
      super(accessory.name + ' Humidity');
      this.accessory = accessory;

      this.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getCurrentRelativeHumidity.bind(this))
        .eventEnabled = true;
    }

    updateCharacteristics() {
      this.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(this.accessory.humidity);
    }

    getCurrentRelativeHumidity(callback) {
      this.accessory.refreshData((err) => {
        callback(err, this.accessory.humidity);
      });
    }
  }

  return HumidityService;
};
