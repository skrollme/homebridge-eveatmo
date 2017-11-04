'use strict';

const DEFAULT_CACHE_TTL = 540; // 9min caching of netatmo api results - use config["ttl"] to override
const REFRESH_RUN_RATE = 20 * 1000; // 20 seconds

var NodeCache = require("node-cache");

class NetatmoDevice {
	constructor(log, api, config) {
		this.api = api;
		this.log = log;
		var ttl = typeof config.ttl !== 'undefined' ? config.ttl : DEFAULT_CACHE_TTL;
		var refreshRunRate = typeof config.refresh_run !== 'undefined' ? config.refresh_run : REFRESH_RUN_RATE;

        this.log.debug("Creating cache with ttl of "+ttl+"s");
		this.cache = new NodeCache({
			stdTTL: ttl
		});
		this.config = config;

		this.deviceData = null;
		this.accessories = [];
		this.refreshCheckRunning = false;

		this.runCheckInterval = setInterval(function() {
			if (!this.refreshCheckRunning) {
				this.refreshCheckRunning = true;
				this.log.debug("Executing Timed Refresh");

				this.refreshDeviceData(function(err, data) {
					if (this.accessories) {
						this.accessories.forEach(function(accessory) {
							accessory.notifyUpdate(data);
						}.bind(this));
					}
					this.refreshCheckRunning = false;
				}.bind(this));
			}
		}.bind(this), refreshRunRate);
	}

	buildAccessoriesForDevices(callback) {
		var accessories = [];
		this.refreshDeviceData(function(err, data) {
			if (!err) {
				this.buildAccessories(callback);
			} else {
				callback(err, accessories);
			}
		}.bind(this));
	}

	refreshDeviceData(callback) {
		this.log.debug("Refreshing data for netatmo " + this.deviceType);
		this.cache.get((this.deviceType), function(err, data) {
			if (!err) {
				if (data == undefined || data === null) {
					this.log("Loading new data from API for: " + this.deviceType);
					this.loadDeviceData(function(err, data) {
						callback(err, data);
					}.bind(this));
				} else {
                    this.log.debug("Data from cache for: " + this.deviceType);
					this.deviceData = data;
					callback(null, data);
				}
			} else {
				callback(err, this.deviceData);
			}
		}.bind(this));
	}

	loadDeviceData(callback) {
		this.deviceData = null;
		callback("The abstract method loadDeviceData should be overridden", null);
	}

	buildAccessories(callback) {
		Object.keys(this.deviceData).forEach(function(key) {

			// key is id! Should go into blacklist / whitelist !
			var keep = true;

			if (this.config.whitelist && this.config.whitelist.length > 0) {
				keep = (this.config.whitelist.indexOf(key) > -1);
			}
			if (this.config.blacklist && this.config.blacklist.length > 0) {
				keep = keep && (this.config.blacklist.indexOf(key) < 0);
			}

			if (keep) {
				var accessory = this.buildAccessory(this.deviceData[key]);
				if(accessory) {
					this.log.debug("Did build accessory " + accessory.name);
					this.accessories.push(accessory);	
				} else {
					this.log.debug("Skipped building accessory " + accessory.name);
				}
			}

		}.bind(this));
		callback(null, this.accessories);
	}

}

module.exports = NetatmoDevice;
