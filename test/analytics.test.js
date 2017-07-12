const fs = require('fs');
var async = require('async');

var messengerapi = require('../node-facebook-messenger-api').messenger();

beforeEach(() => {
  //NOOP
});

afterEach(() => {
  //NOOP
});

function getMessenger(logLevel) {
  return new messengerapi.Messenger({
    appSecret: 'appSecret',
    validationToken: 'validationToken',
    pageAccessToken: 'pageAccessToken',
    urlPrefix: 'urlPrefix',
    analyticsLogLevel: logLevel,
    pageId: 'pageId',
    appId: 'appId'
  });
}

test('check none log', (done) => {
  var messenger = getMessenger(messengerapi.ANALYTICS_LEVEL_NONE);
  messenger.sendActivity = (payload, callback) => {
    callback(null, { resp: true, statusCode: 200 }, "{\"success\":true}");
  };
  messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_CRITICAL, 'blah', () => {
    return {
      _eventName: "wont't be called"
    };
  }, (err, resp) => {
    expect(err).toBeNull();
    expect(resp).not.toBeNull();
    expect(resp.skip).toBeDefined();
    expect(resp.skip).toBeTruthy();
    done();
  });
});

test('check verbose log', (done) => {
  var messenger = getMessenger(messengerapi.ANALYTICS_LEVEL_VERBOSE);
  messenger.sendActivity = (payload, callback) => {
    callback(null, { resp: true, statusCode: 200 }, "{\"success\":true}");
  };
  messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_VERBOSE, 'blah', () => {
    return {
      _eventName: "will be called"
    };
  }, (err, resp) => {
    expect(err).toBeNull();
    expect(resp).not.toBeNull();
    expect(resp.success).toBeDefined();
    expect(resp.success).toBeTruthy();
    done();
  });
});

test('check critical log', (done) => {
  var messenger = getMessenger(messengerapi.ANALYTICS_LEVEL_CRITICAL);
  messenger.sendActivity = (payload, callback) => {
    callback(null, { resp: true, statusCode: 200 }, "{\"success\":true}");
  };
  messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_CRITICAL, 'blah', () => {
    return {
      _eventName: "will be called"
    };
  }, (err, resp) => {
    expect(err).toBeNull();
    expect(resp).not.toBeNull();
    expect(resp.success).toBeDefined();
    expect(resp.success).toBeTruthy();
    done();
  });
});

test('check verbose on critical log', (done) => {
  var messenger = getMessenger(messengerapi.ANALYTICS_LEVEL_CRITICAL);
  messenger.sendActivity = (payload, callback) => {
    callback(null, { resp: true, statusCode: 200 }, "{\"success\":true}");
  };
  messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_VERBOSE, 'blah', () => {
    return {
      _eventName: "won't be called"
    };
  }, (err, resp) => {
    expect(err).toBeNull();
    expect(resp).not.toBeNull();
    expect(resp.skip).toBeDefined();
    expect(resp.skip).toBeTruthy();
    done();
  });
});

test('check critical on verbose log', (done) => {
  var messenger = getMessenger(messengerapi.ANALYTICS_LEVEL_VERBOSE);
  messenger.sendActivity = (payload, callback) => {
    callback(null, { resp: true, statusCode: 200 }, "{\"success\":true}");
  };
  messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_CRITICAL, 'blah', () => {
    return {
      _eventName: "will be called"
    };
  }, (err, resp) => {
    expect(err).toBeNull();
    expect(resp).not.toBeNull();
    expect(resp.success).toBeDefined();
    expect(resp.success).toBeTruthy();
    done();
  });
});

test('check unknown log', (done) => {
  var messenger = getMessenger(messengerapi.ANALYTICS_LEVEL_VERBOSE);
  messenger.sendActivity = (payload, callback) => {
    callback(null, { resp: true, statusCode: 200 }, "{\"success\":true}");
  };
  messenger.analyticsEvent(10, 'blah', () => {
    return {
      _eventName: "won't be called"
    };
  }, (err, resp) => {
    expect(err).toBeNull();
    expect(resp).not.toBeNull();
    expect(resp.skip).toBeDefined();
    expect(resp.skip).toBeTruthy();
    done();
  });
});

