"use strict";

module.exports = {
    messenger: function () {
        return require('./messenger');
    },
    webhookHandler: function () {
        return require('./webhook-handler');
    }
}