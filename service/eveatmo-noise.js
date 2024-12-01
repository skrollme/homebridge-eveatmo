'use strict';

var homebridge;
var Characteristic;
var Perms;
var Formats;

const NOISE_LEVEL_STYPE_ID = '8C85FD40-EB20-45EE-86C5-BCADC773E580';
const NOISE_LEVEL_CTYPE_ID = '2CD7B6FD-419A-4740-8995-E3BFE43735AB';

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
    Perms = homebridge.hap.Perms;
    Formats = homebridge.hap.Formats;
  }

  class NoiseCharacteristic extends Characteristic {
    constructor(accessory) {
      super('Noise Level', NOISE_LEVEL_CTYPE_ID);
      this.setProps({
        format: Formats.UINT8,
        unit: 'dB',
        minValue: 0,
        maxValue: 200,
        minStep: 1,
        perms: [
          Perms.READ,
          Perms.NOTIFY,
        ],
      });
      this.value = this.getDefaultValue();
    }
  }

  class NoiseService extends homebridge.hap.Service {
    constructor(accessory) {
      super(accessory.name + ' Noise', NOISE_LEVEL_STYPE_ID);
      this.accessory = accessory;

      this.addCharacteristic(NoiseCharacteristic)
        .on('get', this.getNoise.bind(this))
        .eventEnabled = true;

      this.addOptionalCharacteristic(Characteristic.Name);
    }

    updateCharacteristics() {
      this.getCharacteristic(NoiseCharacteristic)
        .updateValue(this.accessory.noise);
    }

    getNoise(callback) {
      this.accessory.refreshData((err, data) => {
        callback(err, this.accessory.noise);
      });
    }
  }

  return NoiseService;
};
