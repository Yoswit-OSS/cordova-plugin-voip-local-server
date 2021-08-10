var VoIPLocalServer = function () {
  var that = this;

  this.startCycle(function () {
    console.log('VoIPLocalServer running at ' + that.getUri('localhost'));
  });

  this.tryLookupLocalIP();

  this.autoPingLive();

  // Ensure server alive when resume
  document.addEventListener('resume', this.pingLive.bind(this), false);

  webserver.onRequest(function (request) {
    that.sendResponse(request.requestId, 200);
    that._requestHandler(request);
  });
};

// Port default
VoIPLocalServer.port = 9198;
VoIPLocalServer.AUTO_PING_LIVE_TIME = 5 * 60 * 1000; // 5 minuts
VoIPLocalServer.SEND_CALL = 'sendCall';
VoIPLocalServer.RECEIVE_CALL = 'receiveCall';
VoIPLocalServer.ANSWER = 'answer';
VoIPLocalServer.REJECT = 'reject';
VoIPLocalServer.REQUEST = 'request';
VoIPLocalServer.MESSAGE = 'message';
VoIPLocalServer.GROUP_CALL = 'groupCall';

VoIPLocalServer.prototype.onResume = function () {
  this.pingLive();
};

VoIPLocalServer.prototype.getUri = function (ip) {
  return 'http://' + ip + ':' + VoIPLocalServer.port + '/';
};

VoIPLocalServer.prototype.start = function (callback) {
  var that = this;
  // Try stop before start
  this.stop(function () {
    webserver.start(
      function () {
        that.running = true;
        callback(true);
      },
      function (e) {
        that.running = false;
        callback(false, e);
      },
      VoIPLocalServer.port
    );
  });
};

VoIPLocalServer.prototype.startCycle = function (callback) {
  var that = this;
  this.start(function (ok, e) {
    if (!ok) {
      console.log('Start unsuccess. Try start again', e);
      setTimeout(function () {
        that.startCycle(callback);
      }, 1000);
      return;
    }
    callback(ok);
  });
};

VoIPLocalServer.prototype.autoPingLive = function () {
  clearInterval(this._autoPingTimer);
  this._autoPingTimer = setInterval(
    this.pingLive.bind(this),
    VoIPLocalServer.AUTO_PING_LIVE_TIME
  );
};

VoIPLocalServer.prototype.pingLive = function () {
  fetch(this.getUri('localhost') + 'ping')
    .then(function (response) {
      console.log('Local server is running', response);
    })
    .catch(
      function (error) {
        console.error('Local server not running. Try restart', error);
        this.start();
      }.bind(this)
    );
};

VoIPLocalServer.prototype.stop = function (callback) {
  this.running = false;
  clearInterval(this._autoPingTimer);
  webserver.stop(callback, callback);
};

VoIPLocalServer.prototype.sendResponse = function (
  requestId,
  status,
  body,
  headers
) {
  webserver.sendResponse(requestId, {
    status: status,
    body: body || 'ok',
    headers: headers || {
      'content-type': 'text/html',
      'access-control-allow-origin': '*',
    },
  });
};

VoIPLocalServer.prototype.lookupLocalIP = function (callback) {
  networkinterface.getWiFiIPAddress(
    function (data) {
      callback(data.ip);
    },
    function () {
      callback('');
    }
  );
};

VoIPLocalServer.prototype.tryLookupLocalIP = function () {
  var that = this;
  clearInterval(this._lookupIpTimer);
  this._lookupIpTimer = setInterval(function () {
    that._lookupIpCount = that._lookupIpCount || 0;
    that.lookupLocalIP(function (ip) {
      that._lookupIpCount += 1;
      if (ip) {
        that.localIp = ip;
        clearInterval(that._lookupIpTimer);
      }
      if (that._lookupIpCount > 30) {
        clearInterval(that._lookupIpTimer);
      }
    });
  }, 1000);
};

// payload = {"ip": "<ip_andress>", "caller": "anything", "extra": "more"}
VoIPLocalServer.prototype.sendCall = function (payload, callback) {
  this._send(payload, VoIPLocalServer.SEND_CALL, callback);
};

VoIPLocalServer.prototype.answer = function (payload, callback) {
  this._send(payload, VoIPLocalServer.ANSWER, callback, true);
};

VoIPLocalServer.prototype.reject = function (payload, callback) {
  this._send(payload, VoIPLocalServer.REJECT, callback, true);
};

VoIPLocalServer.prototype.sendMessage = function (payload, callback) {
  this._send(payload, VoIPLocalServer.MESSAGE, callback, true);
};

VoIPLocalServer.prototype._send = function (
  payload,
  enpoint,
  callback,
  parseJson
) {
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
  })
    .then(function (response) {
      if (response.status === 200) {
        response
          .text()
          .then(function (text) {
            callback && callback(parseJson ? that._parseBody(text) : text);
          })
          .catch(function (e) {
            callback && callback(false, e);
          });
      } else {
        callback && callback(false, 'Not found');
      }
    })
    .catch(function (e) {
      callback && callback(false, e);
    });
};

VoIPLocalServer.prototype._parseBody = function (jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    return {};
  }
};

VoIPLocalServer.prototype._requestHandler = function (request) {
  this.onRequest(request);
  var action = request.path.slice(1);
  var actions = {
    sendCall: 'onReceiveCall',
    answer: 'onAnswer',
    reject: 'onReject',
    message: 'onMessage',
    groupCall: 'onGroupCall',
  };
  if (!actions[action]) {
    console.warn('Request uncontrolled', request.path);
    return;
  }
  this[actions[action]](this._parseBody(request.body));
};

VoIPLocalServer.prototype.onRequest = function (request) {};

VoIPLocalServer.prototype.onReceiveCall = function (json) {};

VoIPLocalServer.prototype.onAnswer = function (json) {};

VoIPLocalServer.prototype.onReject = function (json) {};

VoIPLocalServer.prototype.onMessage = function (json) {};

VoIPLocalServer.prototype.onGroupCall = function (json) {};

module.exports = VoIPLocalServer;
