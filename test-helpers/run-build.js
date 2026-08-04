'use strict';

function runBuild(device, methodName) {
  return new Promise((resolve, reject) => {
    device[methodName]((err, accessories) => {
      /* eslint-disable-next-line no-undef */
      clearInterval(device.runCheckInterval);
      if (err) {
        reject(err);
        return;
      }
      resolve(accessories);
    });
  });
}

module.exports = { runBuild };
