'use strict';

function waitForEvent(emitter, event) {
  return new Promise((resolve) => {
    emitter.once(event, (...args) => resolve(args));
  });
}

module.exports = { waitForEvent };
