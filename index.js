'use strict';
var homebridge;
/* eslint-disable-next-line @typescript-eslint/no-require-imports */
var async = require('async');


module.exports = function (pHomebridge) {
  homebridge = pHomebridge;
  homebridge.registerPlatform('homebridge-eveatmo', 'eveatmo', EveatmoPlatform);
};

/* eslint-disable-next-line @typescript-eslint/no-require-imports */
var netatmo = require('./lib/netatmo-api');

class EveatmoPlatform {
  constructor(log, config) {
    this.log = log;
    this.config = config || {};
    this.foundAccessories = [];

    this.config.weatherstation = typeof config.weatherstation !== 'undefined' ? Boolean(config.weatherstation) : true;
    this.config.extra_aq_sensor = typeof config.extra_aq_sensor !== 'undefined' ? Boolean(config.extra_aq_sensor) : true;
    this.config.extra_co2_sensor = typeof config.extra_co2_sensor !== 'undefined' ? Boolean(config.extra_co2_sensor) : false;
    this.config.co2_alert_threshold = typeof config.co2_alert_threshold !== 'undefined' ? parseInt(config.co2_alert_threshold) : 1000;

    this.config.module_suffix = typeof config.module_suffix !== 'undefined' ? config.module_suffix : '';
    this.config.log_info_msg = typeof config.log_info_msg !== 'undefined' ? Boolean(config.log_info_msg) : true;

    // If this log message is not seen, most likely the config.js is not found.
    this.log.debug('Creating EveatmoPlatform');

    if (config.mockapi) {
      this.log.warn('CAUTION! USING FAKE NETATMO API: ' + config.mockapi);
      /* eslint-disable-next-line @typescript-eslint/no-require-imports */
      this.api = require('./lib/netatmo-api-mock')(config.mockapi);
    } else {
      var badConfig = false;

      if (!config.auth) {
        this.log.error('\'auth\' section missing in config');
        badConfig = true;
        config.auth = { grant_type: '' };
      } else if (!config.auth.client_id || !config.auth.client_secret) {
        this.log.error('\'client_id\' and \'client_secret\' are mandatory in \'auth\' section');
        badConfig = true;
      } else if (config.auth.grant_type && config.auth.grant_type !== 'refresh_token' && config.auth.grant_type !== 'password') {
        this.log.error('Unsupported or missing grant_type. Please use \'password\' or \'refresh_token\'');
        badConfig = true;
      } else if (this.config.auth.grant_type === 'refresh_token') {
        this.log.info('Authenticating using \'refresh_token\' grant');

        if (config.auth.username || config.auth.password) {
          this.log.error('\'username\' and \'password\' are not used in grant_type \'refresh_token\'');
        } else if (!config.auth.refresh_token) {
          this.log.error('\'refresh_token\' not set');
          badConfig = true;
        }
      } else if (this.config.auth.grant_type === 'password') {
        this.log.info('Authenticating using \'password\' grant');

        if (!config.auth.username || !config.auth.password) {
          this.log.error('\'username\' and \'password\' are mandatory when using grant_type \'password\'');
          badConfig = true;
        }
      }

      if (badConfig) {
        this.log.error('Bad configuration. Please check the README and the sample config in the repository.');
      } else {
        this.api = new netatmo(this.config.auth, homebridge);

        this.api.on('error', (error) => {
          this.log.error('ERROR - Netatmo: ' + error);
        });
        this.api.on('warning', (error) => {
          this.log.warn('WARN - Netatmo: ' + error);
        });
      }
    }
  }

  accessories(callback) {
    this.log.debug('Loading accessories');

    if (!this.api) {
      this.log.error('No API instance available. Not loading any accessories.');
      callback(this.foundAccessories);
      return;
    }

    var calls = this.loadDevices();

    async.parallel(calls, (err, result) => {
      if (err) {
        this.log('Error: ' + err);
      } else {
        for (var i = 0; i < result.length; i++) {
          for (var j = 0; j < result[i].length; j++) {
            this.foundAccessories.push(result[i][j]);
          }
        }
      }
      callback(this.foundAccessories);
    });
  }

  loadDevices() {
    var calls = [];

    try {
      if (this.config.weatherstation) {
        calls.push((callback) => {
          /* eslint-disable-next-line @typescript-eslint/no-require-imports */
          var DeviceType = require('./device/weatherstation-device.js')(homebridge);
          var devType = new DeviceType(this.log, this.api, this.config);
          devType.buildAccessoriesForDevices((err, deviceAccessories) => {
            callback(err, deviceAccessories);
          });
        });
      }

      if (this.config.airquality) {
        calls.push((callback) => {
          /* eslint-disable-next-line @typescript-eslint/no-require-imports */
          var DeviceType = require('./device/airquality-device.js')(homebridge);
          var devType = new DeviceType(this.log, this.api, this.config);
          devType.buildAccessoriesForDevices((err, deviceAccessories) => {
            callback(err, deviceAccessories);
          });
        });
      }
    } catch (err) {
      this.log('Could not process device');
      this.log(err);
      this.log(err.stack);
    }

    return calls;
  }
}
