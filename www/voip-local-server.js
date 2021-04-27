window.VoIPLocalServer = function() {
    this.start(function(success, error) {
        if (success) {
            console.log('VoIPLocalServer running at ' + this.getUri('localhost'));
        } else {
            console.log('VoIPLocalServer start failed ' + error);
        }
    }.bind(this));
    this.tryLookupLocalIP();
    webserver.onRequest(
        function(request) {
            console.log(request);
            this.sendResponse(request.requestId, 200);
            this._requestHandler(request);
        }.bind(this)
    );    
};

// Port default
VoIPLocalServer.port = 9198;
VoIPLocalServer.SEND_CALL = 'sendCall';
VoIPLocalServer.RECEIVE_CALL = 'receiveCall';
VoIPLocalServer.ANSWER = 'answer';
VoIPLocalServer.REJECT = 'reject';
VoIPLocalServer.REQUEST = 'request';
VoIPLocalServer.MESSAGE = 'message';

VoIPLocalServer.prototype.getUri = function(ip) {
    return 'http://' + ip + ':' + VoIPLocalServer.port + '/';
};

VoIPLocalServer.prototype.start = function(callback) {
    var that = this;
    // Try stop before start
    this.stop(function() {
        webserver.start(function() {
            that.running = true;
            callback(true);
        }, function(e) {
            that.running = false;
            callback(false, e);
        }, VoIPLocalServer.port);
    });
};

VoIPLocalServer.prototype.stop = function(callback) {
    this.running = false;
    webserver.stop(callback, callback);
};

VoIPLocalServer.prototype.sendResponse = function(requestId, status, body, headers) {
    webserver.sendResponse(
        requestId,
        {
            status: status,
            body: body || 'ok',
            headers: headers || {
                'content-type': 'text/html',
                'access-control-allow-origin': '*'
            }
        }
    );
};

VoIPLocalServer.prototype.lookupLocalIP = function(callback) {
    networkinterface.getWiFiIPAddress(function(data) {
        callback(data.ip);
    }, function() {
        callback('');
    });
};

VoIPLocalServer.prototype.tryLookupLocalIP = function() {
    var that = this;
    clearInterval(this._lookupIpTimer);
    this._lookupIpTimer = setInterval(function() {
        that._lookupIpCount = that._lookupIpCount || 0;
        that.lookupLocalIP(function(ip) {
            that._lookupIpCount += 1;
            if (ip) {
                that.localIp = ip;
                clearInterval(that._lookupIpTimer);
            }
            if (that._lookupIpCount > 10) {
                clearInterval(that._lookupIpTimer);
            }
        });
    }, 1000);
};

// payload = {"ip": "<ip_andress>", "caller": "anything", "extra": "more"}
VoIPLocalServer.prototype.sendCall = function(payload, callback) {
    this._send(payload, VoIPLocalServer.SEND_CALL, callback);
};

VoIPLocalServer.prototype.answer = function(payload, callback) {
    this._send(payload, VoIPLocalServer.ANSWER, callback, true);
};

VoIPLocalServer.prototype.reject = function(payload, callback) {
    this._send(payload, VoIPLocalServer.REJECT, callback, true);
};

VoIPLocalServer.prototype.sendMessage = function(payload, callback) {
    this._send(payload, VoIPLocalServer.MESSAGE, callback, true);
};

VoIPLocalServer.prototype._send = function(payload, enpoint, callback, parseJson) {
    if (!payload.ip) {
        throw new Error('Missing ip address');
    }
    if (this.localIp) {
        payload.fromIp = this.localIp;
    }
    var that = this;
    fetch(this.getUri(payload.ip) + enpoint, {
        method: 'post',
        body: JSON.stringify(payload),
    }).then(function(response) {
        if (response.status === 200) {
            response.text().then(function(text) {
                callback && callback(parseJson ? that._parseBody(text) : text);
            }).catch(function(e) {
                callback && callback(false, e);
            });
        } else {
            callback && callback(false, "Not found");
        }
    }).catch(function(e) {
        callback && callback(false, e);
    });
};

VoIPLocalServer.prototype._parseBody = function(jsonText) {
    try {
        return JSON.parse(jsonText);
    } catch(e) {
        return {};
    }
};

VoIPLocalServer.prototype._requestHandler = function(request) {
    this.onRequest(request);
    if (request.path.indexOf('/' + VoIPLocalServer.SEND_CALL) === 0) {
        this.onReceiveCall(this._parseBody(request.body));
    } else if (request.path.indexOf('/' + VoIPLocalServer.ANSWER) === 0) {
        this.onAnswer(this._parseBody(request.body));
    } else if (request.path.indexOf('/' + VoIPLocalServer.REJECT) === 0) {
        this.onReject(this._parseBody(request.body));
    } else if (request.path.indexOf('/' + VoIPLocalServer.MESSAGE) === 0) {
        this.onMessage(this._parseBody(request.body));
    }
}


VoIPLocalServer.prototype.onRequest = function(request) {
    console.log('onRequest', request);
 };

VoIPLocalServer.prototype.onReceiveCall = function(json) {
    console.log('onReceiveCall', json);
};

VoIPLocalServer.prototype.onAnswer = function(json) {
    console.log('onAnswer', json);
};

VoIPLocalServer.prototype.onReject = function(json) {
    console.log('onReject', json);
};

VoIPLocalServer.prototype.onMessage = function(json) {
    console.log('onMessage', json);
};