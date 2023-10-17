'use strict';
var homebridge;
var async = require('async');

module.exports = function(pHomebridge) {
	homebridge = pHomebridge;
	homebridge.registerPlatform("homebridge-eveatmo", "eveatmo", EveatmoPlatform);
};

var netatmo = require("./lib/netatmo-api");
var inherits = require('util').inherits;

class EveatmoPlatform {
	constructor(log, config) {
		this.log = log;
		this.config = config || {};
		this.foundAccessories = [];

		this.config.weatherstation = typeof config.weatherstation !== 'undefined' ? Boolean(config.weatherstation) : true;
        this.config.extra_aq_sensor = typeof config.extra_aq_sensor !== 'undefined' ? Boolean(config.extra_aq_sensor) : false;
		this.config.extra_co2_sensor = typeof config.extra_co2_sensor !== 'undefined' ? Boolean(config.extra_co2_sensor) : false;
        this.config.co2_alert_threshold = typeof config.co2_alert_threshold !== 'undefined' ? parseInt(config.co2_alert_threshold) : 1000;

		this.config.module_suffix = typeof config.module_suffix !== 'undefined' ? config.module_suffix : '';
        this.config.log_info_msg = typeof config.log_info_msg !== 'undefined' ? Boolean(config.log_info_msg) : true;

		// If this log message is not seen, most likely the config.js is not found.
		this.log.debug('Creating EveatmoPlatform');

		if (config.mockapi) {
			this.log.warn('CAUTION! USING FAKE NETATMO API: ' + config.mockapi);
			this.api = require("./lib/netatmo-api-mock")(config.mockapi);
		} else {
			this.config.auth.grant_type = typeof config.auth.grant_type !== 'undefined' ? config.auth.grant_type : 'refresh_token';

			if (this.config.auth.grant_type == 'refresh_token') {
				if (config.auth.username || config.auth.password) {
					throw new Error("'username' and 'password' are not used in grant_type 'refresh_token'");
				} else if (!config.auth.refresh_token) {
					throw new Error("'refresh_token' not set");
				}
				this.log.info("Authenticating using 'refresh_token' grant");
			} else if (this.config.auth.grant_type == 'password') {
				if (!config.auth.username || !config.auth.password) {
					throw new Error("'username' and 'password' are mandatory when using grant_type 'password'");
				}
				this.log.info("Authenticating using 'password' grant");
			} else  {
				throw new Error("Unsupported grant_type. Please use 'password' or 'refresh_token'");
			}

			this.api = new netatmo(this.config.auth, homebridge);
		}
		this.api.on("error", function(error) {
			this.log.error('ERROR - Netatmo: ' + error);
		}.bind(this));
		this.api.on("warning", function(error) {
			this.log.warn('WARN - Netatmo: ' + error);
		}.bind(this));
	}

	accessories(callback) {
		this.log.debug("Loading accessories");

		var calls = this.loadDevices();

		async.parallel(calls, function(err, result) {
			if (err) {
				this.log("Error: " + err);
			} else {
				for (var i = 0; i < result.length; i++) {
					for (var j = 0; j < result[i].length; j++) {
						this.foundAccessories.push(result[i][j]);
					}
				}
			}
			callback(this.foundAccessories);
		}.bind(this));
	}

	loadDevices() {
		var calls = [];

		try {
			if(this.config.weatherstation) {
				calls.push(function(callback) {
					var DeviceType = require('./device/weatherstation-device.js')(homebridge);
					var devType = new DeviceType(this.log, this.api, this.config);
					devType.buildAccessoriesForDevices(function(err, deviceAccessories) {
						callback(err, deviceAccessories);
					});
				}.bind(this));
			}

			if(this.config.airquality) {
				calls.push(function(callback) {
					var DeviceType = require('./device/airquality-device.js')(homebridge);
					var devType = new DeviceType(this.log, this.api, this.config);
					devType.buildAccessoriesForDevices(function(err, deviceAccessories) {
						callback(err, deviceAccessories);
					});
				}.bind(this));
			}
		} catch (err) {
			this.log("Could not process device");
			this.log(err);
			this.log(err.stack);
		}

		return calls;
	}
}
