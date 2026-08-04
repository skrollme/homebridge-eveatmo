'use strict';

function createLog() {
  const log = () => {};
  log.debug = () => {};
  log.info = () => {};
  log.warn = () => {};
  log.error = () => {};
  return log;
}

function createRecordingLog() {
  const calls = [];
  function record(level) {
    return (...args) => {
      calls.push({ level, args });
    };
  }
  const log = record('log');
  log.debug = record('debug');
  log.info = record('info');
  log.warn = record('warn');
  log.error = record('error');
  log.calls = calls;
  return log;
}

module.exports = { createLog, createRecordingLog };
