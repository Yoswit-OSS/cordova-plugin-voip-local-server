function LocalProxy() {}

LocalProxy.prototype.isAndroid = function () {
  return device.platform === 'Android';
};

LocalProxy.prototype.setProxy = function (
  hostname,
  port,
  successCallback,
  errorCallback
) {
  if (!this.isAndroid()) {
    return;
  }
  cordova.exec(
    successCallback || function () {},
    errorCallback || function () {},
    'LocalProxy',
    'setProxy',
    [hostname, port]
  );
};

LocalProxy.prototype.resetProxy = function (successCallback, errorCallback) {
  if (!this.isAndroid()) {
    return;
  }
  cordova.exec(
    successCallback || function () {},
    errorCallback || function () {},
    'LocalProxy',
    'resetProxy',
    []
  );
};

module.exports = new LocalProxy();
