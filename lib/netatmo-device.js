'use strict';

const POLL_INTERVAL = 540; // 9min caching of netatmo api results - use config["ttl"] to override

var NodeCache = require('node-cache');

class NetatmoDevice {
  constructor(log, api, config) {
    this.api = api;
    this.log = log;
    var ttl = typeof config.ttl !== 'undefined' ? config.ttl : POLL_INTERVAL;
    ttl = Math.max(300,ttl);

    this.log.debug('Creating cache with ttl of '+ttl+'s');
    this.cache = new NodeCache({
      stdTTL: ttl,
    });
    this.config = config;

    this.deviceData = null;
    this.accessories = [];

    this.runCheckInterval = setInterval(() => {
      this.log.debug('Executing Timed Refresh');
      this.refreshDeviceData((err, data) => {
        if (this.accessories) {
          this.accessories.forEach((accessory) => {
            accessory.notifyUpdate(data, false);
          });
        }
      }, true);
    }, ttl * 1000);
  }

  buildAccessoriesForDevices(callback) {
    var accessories = [];
    this.refreshDeviceData((err, data) => {
      if (!err) {
        this.buildAccessories(callback);
      } else {
        callback(err, accessories);
      }
    },true);
  }

  refreshDeviceData(callback, force) {
    this.log.debug('Refreshing data for netatmo ' + this.deviceType);
    this.cache.get((this.deviceType), (err, data) => {
      if (!err) {
        if (data == undefined || data === null || force === true) {
          if (this.config.log_info_msg){
            this.log('Loading new data from API for: ' + this.deviceType);
          }
          if(force) {
            this.log.debug('Reloading forced for: ' + this.deviceType);
            this.loadDeviceData((err, data) => {
              callback(err, data);
            });
          } else {
            this.log.debug('No force, return old data for: ' + this.deviceType);
            callback(null, this.deviceData);
          }
        } else {
          this.log.debug('Data from cache for: ' + this.deviceType);
          this.deviceData = data;
          callback(null, data);
        }
      } else {
        callback(err, this.deviceData);
      }
    });
  }

  loadDeviceData(callback) {
    this.deviceData = null;
    callback('The abstract method loadDeviceData should be overridden', null);
  }

  buildAccessories(callback) {
    Object.keys(this.deviceData).forEach((key) => {

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
          this.log.debug('Did build accessory ' + accessory.name);
          this.accessories.push(accessory);
        } else {
          this.log.debug('Skipped building accessory ' + accessory.name);
        }
      }

    });
    callback(null, this.accessories);
  }

}

module.exports = NetatmoDevice;
