'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
    if (pHomebridge && !homebridge) {
        homebridge = pHomebridge;
        Characteristic = homebridge.hap.Characteristic;
    }

    class CarbonDioxideService extends homebridge.hap.Service.CarbonDioxideSensor {
        constructor(accessory) {
            super(accessory.name + " Carbon Dioxide");
            this.accessory = accessory;

            this.getCharacteristic(Characteristic.CarbonDioxideDetected);

            var co2LevelCharacteristic = this.getCharacteristic(Characteristic.CarbonDioxideLevel) ||
                this.addCharacteristic(Characteristic.CarbonDioxideLevel);
        }

        updateCharacteristics() {
            this.setCharacteristic(Characteristic.CarbonDioxideDetected, this.transformCO2ToCarbonDioxideDetected());
            this.setCharacteristic(Characteristic.CarbonDioxideLevel, this.accessory.co2);
        }

        transformCO2ToCarbonDioxideDetected() {
            return (this.accessory.co2 > 1000 ? Characteristic.CarbonDioxideDetected.CO2_LEVELS_ABNORMAL : Characteristic.CarbonDioxideDetected.CO2_LEVELS_NORMAL);
        }
    }

    return CarbonDioxideService;
};