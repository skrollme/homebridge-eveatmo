'use strict';

function createLog() {
  const log = () => {};
  log.debug = () => {};
  log.info = () => {};
  log.warn = () => {};
  log.error = () => {};
  return log;
}

module.exports = { createLog };
