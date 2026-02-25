'use strict';

/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
/* eslint-enable @typescript-eslint/no-require-imports, no-undef */

function NetatmoAPIMock(context) {
  EventEmitter.call(this);
  this.context = context;
}
inherits(NetatmoAPIMock, EventEmitter);

/* eslint-disable-next-line no-undef */
module.exports = function (context) {
  return new NetatmoAPIMock(context);
};

NetatmoAPIMock.prototype.getMockData = function (methodname) {
  var filename = this.context || 'default';
  var data;
  try {
    /* eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef */
    data = require('./../mockapi_calls/' + methodname + '-' + filename + '.json');
  } catch (err) {
    this.emit('warning', new Error('No fake api call for \'' + methodname + '-' + this.context + '\'! using default'));
    /* eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef */
    data = require('./../mockapi_calls/' + methodname + '-default.json');
  }
  if (!data) {
    this.emit('error', new Error('No fake api call for ' + methodname));
    data = {};
  }
  return data;
};

NetatmoAPIMock.prototype.getStationsData = function (options, callback) {
  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  var data = this.getMockData('getstationsdata');
  var devices = [];
  if (data && data.body) {
    devices = data.body.devices;
  }

  if (callback) {
    return callback(null, devices);
  }
};

NetatmoAPIMock.prototype.getHealthyHomeCoachData = function (options, callback) {
  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  var data = this.getMockData('gethomecoachsdata');
  var devices = [];
  if (data && data.body) {
    devices = data.body.devices;
  }

  if (callback) {
    return callback(null, devices);
  }
};

NetatmoAPIMock.prototype.getThermostatsData = function (options, callback) {
  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  var data = this.getMockData('getthermostatsdata');
  var devices = [];
  if (data && data.body) {
    devices = data.body.devices;
  }

  if (callback) {
    return callback(null, devices);
  }
};

NetatmoAPIMock.prototype.getHomeData = function (options, callback) {
  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  var data = this.getMockData('gethomedata');

  var result = {};
  if (data && data.body) {
    result = data.body;
  }

  if (callback) {
    return callback(null, result);
  }
};


