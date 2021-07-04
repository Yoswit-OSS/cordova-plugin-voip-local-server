function LocalProxy() {}

LocalProxy.prototype.setProxy = function (hostname, port, successCallback, errorCallback) {
    cordova.exec(
        successCallback || function() {}, 
        errorCallback || function() {}, 
        'LocalProxy', 
        'setProxy', 
        [hostname, port]
    );
};

LocalProxy.prototype.resetProxy = function (successCallback, errorCallback) {
    cordova.exec(
        successCallback || function() {}, 
        errorCallback || function() {}, 
        'LocalProxy', 
        'resetProxy', 
        []
    );
};

module.exports = new LocalProxy();
