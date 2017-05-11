"use strict";

const async = require('async'),
  crypto = require('crypto'),
  error = require('debug')('error'),
  debug = require('debug')('fb-accountlink');

function AccountLinkHandler(config) {
  this.conf = config;
  if (!this.conf.userIdField) {
    this.conf.userIdField = 'userid';
  }
}

AccountLinkHandler.prototype.getFbLinking = function (authCode, callback) {
  this.conf.linkModel.getById(authCode, callback)
};

AccountLinkHandler.prototype.removeFbLinking = function (linking, callback) {
  this.conf.linkModel.delete({
    _id: linking._id
  }, callback);
};

AccountLinkHandler.prototype.getFbUser = function (linking, callback) {
  this.conf.userModel.getById(linking[this.conf.userIdField], callback);
};

AccountLinkHandler.prototype.addFbUser = function (linking, authCode, handler, callback) {
  var obj = {
    _id: linking[this.conf.userIdField],
    authCode: authCode
  };
  if (handler) {
    handler.updateFbUser(obj, linking);
  }
  this.conf.userModel.add(obj, callback);
};

AccountLinkHandler.prototype.updateFbUser = function (user, authCode, callback) {
  user.authCode = authCode;
  this.conf.userModel.update(user, callback);
};

AccountLinkHandler.prototype.removeFbUser = function (mapping, callback) {
  this.conf.userModel.delete({
    _id: mapping[this.conf.userIdField]
  }, callback)
};

AccountLinkHandler.prototype.getFbUserMapping = function (senderID, callback) {
  this.conf.mappingModel.getById(senderID, callback);
};

AccountLinkHandler.prototype.addFbUserMapping = function (senderID, recipientID, linking, status, callback) {
  var obj = {
    _id: senderID,
    pageId: recipientID,
    status: status
  };
  obj[this.conf.userIdField] = linking[this.conf.userIdField];
  this.conf.mappingModel.add(obj, callback)
};

AccountLinkHandler.prototype.updateFbUserMapping = function (mapping, recipientID, linking, status, callback) {
  mapping.status = status;
  mapping.pageId = recipientID;
  this.conf.mappingModel.update(mapping, callback)
};

AccountLinkHandler.prototype.updateFbUserMappingStatus = function (mapping, status, callback) {
  mapping.status = status;
  this.conf.mappingModel.update(mapping, callback)
};

//TODO: Transation commit/rollback
AccountLinkHandler.prototype.doLinking = function (event, callback, handler) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  var ctx = {};
  var ptr = this;
  async.waterfall([
    function (callback) {
      ptr.getFbLinking(authCode, callback)
    },
    function (linking, callback) {
      if (null == linking) {
        callback("No linking found", null);
      } else {
        ctx.linking = linking;
        ptr.getFbUser(ctx.linking, callback);
      }
    },
    function (user, callback) {
      if (null == user) {
        ptr.addFbUser(ctx.linking, authCode, handler, callback);
      } else {
        ptr.updateFbUser(user, authCode, callback)
      }
    },
    function (user, callback) {
      if (null == user) {
        callback("No user found", null);
      } else {
        ctx.user = user;
        ptr.getFbUserMapping(senderID, callback);
      }
    },
    function (mapping, callback) {
      if (null == mapping) {
        ptr.addFbUserMapping(senderID, recipientID, ctx.linking, status, callback)
      } else {
        ptr.updateFbUserMapping(mapping, recipientID, ctx.linking, status, callback)
      }
    },
    function (mapping, callback) {
      if (null == mapping) {
        callback("No mapping found", null);
      } else {
        ptr.removeFbLinking(ctx.linking, callback);
      }
    },
  ], function (err, deleted) {
    if (err || !deleted) {
      error('failed to process account linking for', senderID, recipientID, authCode, err);
      callback('failed to process account linking', null);
    } else {
      debug('successfully setup account linking for', senderID, recipientID, authCode);
      callback(null, senderID);
    }
  });
};

AccountLinkHandler.prototype.doUnlinking = function (event, callback) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var status = event.account_linking.status;

  var ptr = this;
  var ctx = {};
  async.waterfall([
    function (callback) {
      ptr.getFbUserMapping(senderID, callback);
    },
    function (mapping, callback) {
      if (null == mapping) {
        callback({
          mapping: false
        }, null);
      } else {
        ctx.mapping = mapping;
        ptr.updateFbUserMappingStatus(mapping, status, callback);
      }
    },
    function (mapping, callback) {
      if (null == mapping) {
        callback("No mapping found", null);
      } else {
        ptr.removeFbUser(ctx.mapping, callback);
      }
    }
  ], function (err, deleted) {
    if (err || !deleted) {
      error('failed to process account unlinking for', senderID, recipientID, err);
      callback('failed to process account unlinking', null);
    } else {
      debug('successfully unlinked account for', senderID, recipientID);
      callback(null, senderID);
    }
  });
};

module.exports.AccountLinkHandler = AccountLinkHandler;
