function LocalProxy() {}

Permissions.prototype.setProxy = function (hostname, port, successCallback, errorCallback) {
    cordova.exec(
        successCallback || function() {}, 
        errorCallback || function() {}, 
        'LocalProxy', 
        'setProxy', 
        [hostname, port]
    );
};

Permissions.prototype.resetProxy = function (successCallback, errorCallback) {
    cordova.exec(
        successCallback || function() {}, 
        errorCallback || function() {}, 
        'LocalProxy', 
        'resetProxy', 
        []
    );
};

module.exports = new Permissions();
