/* eslint-disable @typescript-eslint/no-require-imports */
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
/* eslint-enable @typescript-eslint/no-require-imports */

const BASE_URL = 'https://api.netatmo.com';

let client_id;
let client_secret;
let username;
let password;
let scope;
let access_token = null;
let refresh_token = null;
let filename;

/**
 * @constructor
 * @param args
 * @param homebridge
 */
const netatmo = function (args, homebridge) {
  EventEmitter.call(this);

  if (args.grant_type === 'refresh_token') {
    client_id = args.client_id;
    client_secret = args.client_secret;
    filename = homebridge.user.storagePath() + '/netatmo-token.json';
    if (fs.existsSync(filename)) {
      let rawData = fs.readFileSync(filename);
      let tokenData = JSON.parse(rawData);
      // access_token = tokenData.access_token; // dont read access_token because it may be already invalid on first use after restart
      refresh_token = tokenData.refresh_token;
    } else {
      refresh_token = args.refresh_token;
    }

    this.authenticate_refresh();
  } else {
    this.authenticate(args, null);
  }
};

util.inherits(netatmo, EventEmitter);

/**
 * handleRequestError
 * @param err
 * @param response
 * @param body
 * @param message
 * @param critical
 * @returns {Error}
 */
netatmo.prototype.handleRequestError = function (err, response, body, message, critical) {
  let errorMessage = '';
  if (body && response && response.headers && response.headers['content-type'] && response.headers['content-type'].trim().toLowerCase().indexOf('application/json') !== -1) {
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    errorMessage = parsedBody && (parsedBody.error?.message || parsedBody.error);
  } else if (response) {
    errorMessage = 'Status code ' + response.status;
  } else if (err) {
    errorMessage = err.message || 'Request failed';
  } else {
    errorMessage = 'No response';
  }
  const error = new Error(message + ': ' + errorMessage);
  if (critical) {
    this.emit('error', error);
  } else {
    this.emit('warning', error);
  }
  return error;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/guides/authentication
 * @param args
 * @param callback
 * @returns {netatmo}
 */
netatmo.prototype.authenticate = function (args, callback) {
  if (!args) {
    this.emit('error', new Error('Authenticate \'args\' not set.'));
    return this;
  }

  if (args.access_token) {
    access_token = args.access_token;
    return this;
  }

  if (!args.client_id) {
    this.emit('error', new Error('Authenticate \'client_id\' not set.'));
    return this;
  }

  if (!args.client_secret) {
    this.emit('error', new Error('Authenticate \'client_secret\' not set.'));
    return this;
  }

  if (!args.username) {
    this.emit('error', new Error('Authenticate \'username\' not set.'));
    return this;
  }

  if (!args.password) {
    this.emit('error', new Error('Authenticate \'password\' not set.'));
    return this;
  }

  username = args.username;
  password = args.password;
  client_id = args.client_id;
  client_secret = args.client_secret;
  scope = args.scope || 'read_station read_thermostat write_thermostat read_camera write_camera access_camera read_presence access_presence read_smokedetector read_homecoach';

  const params = new URLSearchParams();
  params.append('client_id', client_id);
  params.append('client_secret', client_secret);
  params.append('username', username);
  params.append('password', password);
  params.append('scope', scope);
  params.append('grant_type', 'password');

  const url = util.format('%s/oauth2/token', BASE_URL);

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    access_token = body.access_token;

    if (body.expires_in) {
      setTimeout(this.authenticate_refresh.bind(this), body.expires_in * 1000, body.refresh_token);
    }

    this.emit('authenticated');

    if (callback) {
      return callback();
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'Authenticate error', true);
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/guides/authentication/refreshingatoken
 * @param refresh_token
 * @returns {netatmo}
 */
netatmo.prototype.authenticate_refresh = function () {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refresh_token);
  params.append('client_id', client_id);
  params.append('client_secret', client_secret);

  const url = util.format('%s/oauth2/token', BASE_URL);

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    fs.writeFileSync(filename, JSON.stringify({
      //'access_token': body.access_token, // dont store access_token because it may be already invalid on first use after restart
      'refresh_token': body.refresh_token,
    }));

    refresh_token = body.refresh_token;
    if (access_token === null) {
      access_token = body.access_token;
      this.emit('authenticated');
    } else {
      access_token = body.access_token;
    }

    if (body.expires_in) {
      setTimeout(this.authenticate_refresh.bind(this), (body.expires_in - 300) * 1000); // try refreshing the tokens 5min early
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    this.handleRequestError(err, response, body, 'Authenticate refresh error');
    setTimeout(this.authenticate_refresh.bind(this), 180 * 1000); // retry in 3min
    return this;
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/weatherstation/getstationsdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getStationsData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getStationsData(options, callback);
    });
  }

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  const url = util.format('%s/api/getstationsdata', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);

  if (options) {
    if (options.device_id) {
      params.append('device_id', options.device_id);
    }
    if (options.get_favorites) {
      params.append('get_favorites', options.get_favorites);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    const devices = body.body.devices;

    this.emit('get-stationsdata', null, devices);

    if (callback) {
      return callback(null, devices);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getStationsDataError error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/thermostat/getthermostatsdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getThermostatsData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getThermostatsData(options, callback);
    });
  }

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  let url = util.format('%s/api/getthermostatsdata?access_token=%s', BASE_URL, access_token);
  if (options != null) {
    url = util.format(url + '&device_id=%s', options.device_id);
  }

  axios.get(url).then((response) => {
    const body = response.data;

    const devices = body.body.devices;

    this.emit('get-thermostatsdata', null, devices);

    if (callback) {
      return callback(null, devices);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getThermostatsDataError error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/common/getmeasure
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getMeasure = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getMeasure(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('getMeasure \'options\' not set.'));
    return this;
  }

  if (!options.device_id) {
    this.emit('error', new Error('getMeasure \'device_id\' not set.'));
    return this;
  }

  if (!options.scale) {
    this.emit('error', new Error('getMeasure \'scale\' not set.'));
    return this;
  }

  if (!options.type) {
    this.emit('error', new Error('getMeasure \'type\' not set.'));
    return this;
  }

  if (util.isArray(options.type)) {
    options.type = options.type.join(',');
  }

  // Remove any spaces from the type list if there is any.
  options.type = options.type.replace(/\s/g, '').toLowerCase();


  const url = util.format('%s/api/getmeasure', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('device_id', options.device_id);
  params.append('scale', options.scale);
  params.append('type', options.type);

  if (options) {

    if (options.module_id) {
      params.append('module_id', options.module_id);
    }

    if (options.date_begin) {
      if (options.date_begin <= 1E10) {
        options.date_begin *= 1E3;
      }

      params.append('date_begin', moment(options.date_begin).utc().unix());
    }

    if (options.date_end === 'last') {
      params.append('date_end', 'last');
    } else if (options.date_end) {
      if (options.date_end <= 1E10) {
        options.date_end *= 1E3;
      }
      params.append('date_end', moment(options.date_end).utc().unix());
    }

    if (options.limit) {
      let limit = parseInt(options.limit, 10);

      if (limit > 1024) {
        limit = 1024;
      }
      params.append('limit', limit);
    }

    if (options.optimize !== undefined) {
      params.append('optimize', !!options.optimize);
    }

    if (options.real_time !== undefined) {
      params.append('real_time', !!options.real_time);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    const measure = body.body;

    this.emit('get-measure', null, measure);

    if (callback) {
      return callback(null, measure);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    const error = this.handleRequestError(err, response, body, 'getMeasure error');
    if (callback) {
      callback(error);
    }
    return;
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/common/getroommeasure
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getRoomMeasure = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getRoomMeasure(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('getRoomMeasure \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('getRoomMeasure \'home_id\' not set.'));
    return this;
  }

  if (!options.room_id) {
    this.emit('error', new Error('getRoomMeasure \'room_id\' not set.'));
    return this;
  }

  if (!options.scale) {
    this.emit('error', new Error('getRoomMeasure \'scale\' not set.'));
    return this;
  }

  if (!options.type) {
    this.emit('error', new Error('getRoomMeasure \'type\' not set.'));
    return this;
  }

  if (util.isArray(options.type)) {
    options.type = options.type.join(',');
  }

  // Remove any spaces from the type list if there is any.
  options.type = options.type.replace(/\s/g, '').toLowerCase();


  const url = util.format('%s/api/getroommeasure', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);
  params.append('room_id', options.room_id);
  params.append('scale', options.scale);
  params.append('type', options.type);

  if (options) {

    if (options.date_begin) {
      if (options.date_begin <= 1E10) {
        options.date_begin *= 1E3;
      }

      params.append('date_begin', moment(options.date_begin).utc().unix());
    }

    if (options.date_end === 'last') {
      params.append('date_end', 'last');
    } else if (options.date_end) {
      if (options.date_end <= 1E10) {
        options.date_end *= 1E3;
      }
      params.append('date_end', moment(options.date_end).utc().unix());
    }

    if (options.limit) {
      let limit = parseInt(options.limit, 10);

      if (limit > 1024) {
        limit = 1024;
      }
      params.append('limit', limit);
    }

    if (options.optimize !== undefined) {
      params.append('optimize', !!options.optimize);
    }

    if (options.real_time !== undefined) {
      params.append('real_time', !!options.real_time);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    const measure = body.body;

    this.emit('get-room-measure', null, measure);

    if (callback) {
      return callback(null, measure);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    const error = this.handleRequestError(err, response, body, 'getRoomMeasure error');
    if (callback) {
      callback(error);
    }
    return;
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/thermostat/syncschedule
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.setSyncSchedule = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.setSyncSchedule(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('setSyncSchedule \'options\' not set.'));
    return this;
  }

  if (!options.device_id) {
    this.emit('error', new Error('setSyncSchedule \'device_id\' not set.'));
    return this;
  }

  if (!options.module_id) {
    this.emit('error', new Error('setSyncSchedule \'module_id\' not set.'));
    return this;
  }

  if (!options.zones) {
    this.emit('error', new Error('setSyncSchedule \'zones\' not set.'));
    return this;
  }

  if (!options.timetable) {
    this.emit('error', new Error('setSyncSchedule \'timetable\' not set.'));
    return this;
  }

  const url = util.format('%s/api/syncschedule', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('device_id', options.device_id);
  params.append('module_id', options.module_id);
  params.append('zones', options.zones);
  params.append('timetable', options.timetable);

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('set-syncschedule', null, body.status);

    if (callback) {
      return callback(null, body.status);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'setSyncSchedule error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/thermostat/setthermpoint
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.setThermpoint = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.setThermpoint(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('setThermpoint \'options\' not set.'));
    return this;
  }

  if (!options.device_id) {
    this.emit('error', new Error('setThermpoint \'device_id\' not set.'));
    return this;
  }

  if (!options.module_id) {
    this.emit('error', new Error('setThermpoint \'module_id\' not set.'));
    return this;
  }

  if (!options.setpoint_mode) {
    this.emit('error', new Error('setThermpoint \'setpoint_mode\' not set.'));
    return this;
  }

  const url = util.format('%s/api/setthermpoint', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('device_id', options.device_id);
  params.append('module_id', options.module_id);
  params.append('setpoint_mode', options.setpoint_mode);

  if (options) {

    if (options.setpoint_endtime) {
      params.append('setpoint_endtime', options.setpoint_endtime);
    }

    if (options.setpoint_temp) {
      params.append('setpoint_temp', options.setpoint_temp);
    }

  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-thermostatsdata', null, body.status);

    if (callback) {
      return callback(null, body.status);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'setThermpoint error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/welcome/gethomedata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getHomeData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getHomeData(options, callback);
    });
  }

  const url = util.format('%s/api/gethomedata', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  if (options) {
    if (options.home_id) {
      params.append('home_id', options.home_id);
    }
    if (options.size) {
      params.append('size', options.size);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-homedata', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getHomeData error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/resources/technical/reference/energy/homesdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getHomesData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getHomesData(options, callback);
    });
  }

  const url = util.format('%s/api/homesdata', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  if (options) {
    if (options.home_id) {
      params.append('home_id', options.home_id);
    }
    if (options.gateway_types) {
      params.append('gateway_types', options.gateway_types);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-homesdata', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getHomesData error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/resources/technical/reference/energy/homestatus
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getHomeStatus = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getHomeStatus(options, callback);
    });
  }

  if (!options.home_id) {
    this.emit('error', new Error('getHomeStatus \'home_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/homestatus', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  if (options) {
    if (options.home_id) {
      params.append('home_id', options.home_id);
    }
    if (options.device_types) {
      params.append('device_types', options.device_types);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-homestatus', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getHomeStatus error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/welcome/getnextevents
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getNextEvents = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getNextEvents(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('getNextEvents \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('getNextEvents \'home_id\' not set.'));
    return this;
  }

  if (!options.event_id) {
    this.emit('error', new Error('getNextEvents \'event_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/getnextevents', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);
  params.append('event_id', options.event_id);

  if (options.size) {
    params.append('size', options.size);
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-nextevents', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getNextEvents error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/welcome/getlasteventof
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getLastEventOf = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getLastEventOf(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('getLastEventOf \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('getLastEventOf \'home_id\' not set.'));
    return this;
  }

  if (!options.person_id) {
    this.emit('error', new Error('getLastEventOf \'person_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/getlasteventof', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);
  params.append('person_id', options.person_id);

  if (options.offset) {
    params.append('offset', options.offset);
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-lasteventof', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getLastEventOf error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/welcome/geteventsuntil
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getEventsUntil = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getEventsUntil(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('getEventsUntil \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('getEventsUntil \'home_id\' not set.'));
    return this;
  }

  if (!options.event_id) {
    this.emit('error', new Error('getEventsUntil \'event_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/geteventsuntil', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);
  params.append('event_id', options.event_id);

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-eventsuntil', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getEventsUntil error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/welcome/getcamerapicture
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getCameraPicture = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getCameraPicture(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('getCameraPicture \'options\' not set.'));
    return this;
  }

  if (!options.image_id) {
    this.emit('error', new Error('getCameraPicture \'image_id\' not set.'));
    return this;
  }

  if (!options.key) {
    this.emit('error', new Error('getCameraPicture \'key\' not set.'));
    return this;
  }

  const url = util.format('%s/api/getcamerapicture', BASE_URL);

  const params = {
    access_token: access_token,
    image_id: options.image_id,
    key: options.key,
  };

  axios.get(url, {
    params: params,
    responseType: 'arraybuffer',
  }).then((response) => {
    const body = Buffer.from(response.data);

    this.emit('get-camerapicture', null, body);

    if (callback) {
      return callback(null, body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getCameraPicture error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/reference/healthyhomecoach/gethomecoachsdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getHealthyHomeCoachData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getHealthyHomeCoachData(options, callback);
    });
  }

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  let url = util.format('%s/api/gethomecoachsdata?access_token=%s', BASE_URL, access_token);
  if (options != null) {
    url = util.format(url + '&device_id=%s', options.device_id);
  }

  axios.get(url).then((response) => {
    const body = response.data;

    const devices = body.body.devices;

    this.emit('get-healthhomecoaches-data', null, devices);

    if (callback) {
      return callback(null, devices);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'getHealthyHomeCoachData error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/resources/technical/reference/weatherapi/getpublicdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getPublicData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.getPublicData(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('getPublicData \'options\' not set.'));
    return this;
  }

  if (!options.lat_ne) {
    this.emit('error', new Error('getPublicData \'lat_ne\' not set.'));
    return this;
  }

  if (!options.lon_ne) {
    this.emit('error', new Error('getPublicData \'lon_ne\' not set.'));
    return this;
  }

  if (!options.lat_sw) {
    this.emit('error', new Error('getPublicData \'lat_sw\' not set.'));
    return this;
  }

  if (!options.lon_sw) {
    this.emit('error', new Error('getPublicData \'lat_sw\' not set.'));
    return this;
  }

  if (util.isArray(options.required_data)) {
    options.required_data = options.required_data.join(',');
  }

  // Remove any spaces from the type list if there is any.
  options.required_data = options.required_data.replace(/\s/g, '').toLowerCase();


  const url = util.format('%s/api/getpublicdata', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('lat_ne', options.lat_ne);
  params.append('lon_ne', options.lon_ne);
  params.append('lat_sw', options.lat_sw);
  params.append('lon_sw', options.lon_sw);
  params.append('required_data', options.required_data);
  params.append('filter', options.filter);

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    const measure = body.body;

    this.emit('get-publicdata', null, measure);

    if (callback) {
      return callback(null, measure);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    const error = this.handleRequestError(err, response, body, 'getPublicData error');
    if (callback) {
      callback(error);
    }
    return;
  });

  return this;
};

/**
 * https://dev.netatmo.com/resources/technical/reference/energy/homesdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.homesData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.homesData(options, callback);
    });
  }

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  const url = util.format('%s/api/homesdata', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);

  if (options) {
    if (options.home_id) {
      params.append('home_id', options.home_id);
    }
    if (options.gateway_types) {
      params.append('gateway_types', options.gateway_types);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-homesdata', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'homesData error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/resources/technical/reference/energy/homesdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.homeStatus = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.homeStatus(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('homeStatus \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('homeStatus \'home_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/homestatus', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);

  if (options) {
    if (options.device_types) {
      params.append('device_types', options.device_types);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-homestatus', null, body.body);

    if (callback) {
      return callback(null, body.body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'homeStatus error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/resources/technical/reference/energy/setthermmode
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.setThermMode = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.setThermMode(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('setThermMode \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('setThermMode \'home_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/setthermmode', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);
  params.append('mode', options.mode);

  if (options) {
    if (options.endtime) {
      params.append('endtime', options.endtime);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-setthermmode', null, body);

    if (callback) {
      return callback(null, body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'setThermMode error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/resources/technical/reference/energy/setroomthermpoint
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.setRoomThermPoint = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.setRoomThermPoint(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('setRoomThermPoint \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('setRoomThermPoint \'home_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/setroomthermpoint', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);
  params.append('room_id', options.room_id);
  params.append('mode', options.mode);

  if (options) {
    if (options.temp) {
      params.append('temp', options.temp);
    }
    if (options.endtime) {
      params.append('endtime', options.endtime);
    }
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('get-setroomthermpoint', null, body);

    if (callback) {
      return callback(null, body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'setRoomThermPoint error');
  });

  return this;
};

/**
 * https://dev.netatmo.com/apidocumentation/security#setpersonsaway
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.setPersonAway = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on('authenticated', function () {
      this.setPersonAway(options, callback);
    });
  }

  if (!options) {
    this.emit('error', new Error('setPersonAway \'options\' not set.'));
    return this;
  }

  if (!options.home_id) {
    this.emit('error', new Error('setPersonAway \'home_id\' not set.'));
    return this;
  }

  const url = util.format('%s/api/setpersonsaway', BASE_URL);

  const params = new URLSearchParams();
  params.append('access_token', access_token);
  params.append('home_id', options.home_id);

  if (options.person_id) {
    params.append('person_id', options.person_id);
  }

  axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    const body = response.data;

    this.emit('set-personsaway', null, body);

    if (callback) {
      return callback(null, body);
    }

    return this;
  }).catch((err) => {
    const response = err.response;
    const body = response ? response.data : null;
    return this.handleRequestError(err, response, body, 'setPersonAway error');
  });

  return this;
};

module.exports = netatmo;
