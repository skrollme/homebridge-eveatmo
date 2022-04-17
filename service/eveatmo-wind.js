'use strict';

var homebridge;
var Characteristic;

const WIND_MEASURE_STYPE_ID = "2AFB775E-79E5-4399-B3CD-398474CAE86C";
const WIND_STRENGTH_CTYPE_ID = "49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41";
const WIND_ANGLE_CTYPE_ID = "46F1284C-1912-421B-82F5-EB75008B167E";
const GUST_STRENGTH_CTYPE_ID = "6B8861E5-D6F3-425C-83B6-069945FFD1F1";

module.exports = function(pHomebridge) {
    if (pHomebridge && !homebridge) {
        homebridge = pHomebridge;
        Characteristic = homebridge.hap.Characteristic;
    }

    class WindStrengthCharacteristic extends Characteristic {
        constructor(accessory) {
            super('Wind Strength', WIND_STRENGTH_CTYPE_ID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: "km/h",
                minValue: 0,
                maxValue: 200,
                minStep: 0.1,
                perms: [
                    Characteristic.Perms.READ,
                    Characteristic.Perms.NOTIFY
                ]
            });
            this.value = this.getDefaultValue();
        }
    }

    class GustStrengthCharacteristic extends Characteristic {
        constructor(accessory) {
            super('Gust Strength', GUST_STRENGTH_CTYPE_ID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: "km/h",
                minValue: 0,
                maxValue: 200,
                minStep: 0.1,
                perms: [
                    Characteristic.Perms.READ,
                    Characteristic.Perms.NOTIFY
                ]
            });
            this.value = this.getDefaultValue();
        }
    }

    class WindAngleCharacteristic extends Characteristic {
        constructor(accessory) {
            super('Wind Angle', WIND_ANGLE_CTYPE_ID);
            this.setProps({
                format: Characteristic.Formats.STRING,
                perms: [
                    Characteristic.Perms.READ,
                    Characteristic.Perms.NOTIFY
                ]
            });
            this.value = this.getDefaultValue();
        }
    }

    class WindService extends homebridge.hap.Service {
        constructor(accessory) {
            super(accessory.name + " Wind Sensor", WIND_MEASURE_STYPE_ID);
            this.accessory = accessory;

            this.addCharacteristic(WindStrengthCharacteristic)
                .on('get', this.getWindStrength.bind(this))
                .eventEnabled = true;
            this.addCharacteristic(GustStrengthCharacteristic)
                .on('get', this.getGustStrength.bind(this))
                .eventEnabled = true;
            this.addCharacteristic(WindAngleCharacteristic)
                .on('get', this.getWindAngle.bind(this))
                .eventEnabled = true;

            this.addOptionalCharacteristic(Characteristic.Name);
        }

        updateCharacteristics() {
            this.getCharacteristic(WindStrengthCharacteristic)
                .updateValue(this.accessory.windStrength);
            this.getCharacteristic(WindStrengthCharacteristic)
                .updateValue(this.accessory.gustStrength);
            this.getCharacteristic(WindAngleCharacteristic)
                .updateValue(this.transformDirectionDegToString());
        }

        getWindStrength(callback) {
            this.accessory.refreshData(function(err,data) {
                callback(err, this.accessory.windStrength);
            }.bind(this));
        }

        getGustStrength(callback) {
            this.accessory.refreshData(function(err,data) {
                callback(err, this.accessory.gustStrength);
            }.bind(this));
        }

        getWindAngle(callback) {
            this.accessory.refreshData(function(err,data) {
                callback(err, this.transformDirectionDegToString());
            }.bind(this));
        }

        transformDirectionDegToString() {
            var a = this.accessory.windAngle;
            if (a >= 348.75 || a < 11.25) {
                return 'N';
            } else if (a >= 11.25 && a < 33.75) {
                return 'NNE';
            } else if (a >= 33.75 && a < 56.25) {
                return 'NE';
            } else if (a >= 56.25 && a < 78.75) {
                return 'ENE';
            } else if (a >= 78.75 && a < 101.25) {
                return 'E';
            } else if (a >= 101.25 && a < 123.75) {
                return 'ESE';
            } else if (a >= 123.75 && a < 146.25) {
                return 'SE';
            } else if (a >= 146.25 && a < 168.75) {
                return 'SSE';
            } else if (a >= 168.75 && a < 191.25) {
                return 'S';
            } else if (a >= 191.25 && a < 213.75) {
                return 'SSW';
            } else if (a >= 213.75 && a < 236.25) {
                return 'SW';
            } else if (a >= 236.25 && a < 258.75) {
                return 'WSW';
            } else if (a >= 258.75 && a < 281.25) {
                return 'W';
            } else if (a >= 281.25 && a < 303.75) {
                return 'WNW';
            } else if (a >= 303.75 && a < 326.25) {
                return 'NW';
            } else if (a >= 326.25 && a < 348.75) {
                return 'NNW';
            }
        }
    }

    return WindService;
};
