"use strict";

module.exports = {
    messenger: function () {
        return require('./messenger');
    },
    accountlinkHandler: function () {
        return require('./account-link-handler');
    },
    webhookHandler: function () {
        return require('./webhook-handler');
    }
};