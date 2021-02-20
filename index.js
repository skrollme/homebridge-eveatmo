'use strict';
var homebridge;
var async = require('async');

module.exports = function(pHomebridge) {
	homebridge = pHomebridge;
	homebridge.registerPlatform("homebridge-eveatmo", "eveatmo", EveatmoPlatform);
};

var netatmo = require("netatmo");
var inherits = require('util').inherits;

class EveatmoPlatform {
	constructor(log, config) {
		this.log = log;
		this.config = config || {};
		this.foundAccessories = [];

		this.config.weatherstation = typeof config.weatherstation !== 'undefined' ? Boolean(config.weatherstation) : true;
        this.config.extra_co2_sensor = typeof config.extra_co2_sensor !== 'undefined' ? Boolean(config.extra_co2_sensor) : false;
        this.config.co2_alert_threshold = typeof config.co2_alert_threshold !== 'undefined' ? parseInt(config.co2_alert_threshold) : 1000;

		this.config.module_suffix = typeof config.module_suffix !== 'undefined' ? config.module_suffix : '';

		// If this log message is not seen, most likely the config.js is not found.
		this.log.debug('Creating EveatmoPlatform');

		if (config.mockapi) {
			this.log.warn('CAUTION! USING FAKE NETATMO API: ' + config.mockapi);
			this.api = require("./lib/netatmo-api-mock")(config.mockapi);
		} else {
			this.api = new netatmo(config.auth);
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
