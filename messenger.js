"use strict";

const
    config = require('config'),
    request = require('request');

function Messenger() {
    const appSecret = (process.env.MESSENGER_APP_SECRET) ?
        process.env.MESSENGER_APP_SECRET :
        config.get('appSecret');

    const validationToken = (process.env.MESSENGER_VALIDATION_TOKEN) ?
        (process.env.MESSENGER_VALIDATION_TOKEN) :
        config.get('validationToken');

    const pageAccessToken = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
        (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
        config.get('pageAccessToken');

    const serverURL = (process.env.SERVER_URL) ?
        (process.env.SERVER_URL) :
        config.get('serverURL');

    const logApi = (process.env.LOG_API) ?
        (process.env.LOG_API) :
        config.get('logAPI');

    if (!(appSecret && validationToken && pageAccessToken && serverURL)) {
        console.error("Missing config values");
        process.exit(1);
    }

    this.conf = {
        log: logApi || false,
        appSecret: appSecret,
        validationToken: validationToken,
        pageAccessToken: pageAccessToken,
        serverURL: serverURL,
        urlPrefix: 'https://graph.facebook.com/v2.6/'
    };
}

Messenger.prototype.log = function () {
    if (this.conf.log) {
        console.log.apply(this, arguments);
    }
};

Messenger.prototype.error = function () {
    if (this.conf.log) {
        console.error(arguments);
    }
};

Messenger.prototype.callSendAPI = function (messageData) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + 'me/messages',
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            if (messageId) {
                ptr.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
            } else {
                ptr.log("Successfully called Send API for recipient %s",
                    recipientId);
            }
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });
};

Messenger.prototype.getUserProfile = function (userId, callback) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + userId,
        qs: {
            access_token: this.conf.pageAccessToken,
            fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
        },
        method: 'GET'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body)
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.setThreadSettings = function (messageData, callback) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + "me/thread_settings",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'POST',
        json: messageData
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body)
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.whitelistDomain = function (domain, add, callback) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + "me/thread_settings",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'POST',
        json: {
            setting_type: "domain_whitelisting",
            whitelisted_domains: [domain],
            domain_action_type: add ? "add" : "remove"
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body)
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.clearThreadSettings = function (callback) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + "me/thread_settings",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'DELETE',
        json: {
            setting_type: "call_to_actions",
            thread_state: "existing_thread"
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body)
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.sendImageMessage = function (recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: this.conf.serverURL + "/assets/rift.png"
                }
            }
        }
    };

    callSendAPI(messageData);
};

Messenger.prototype.sendGifMessage = function (recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: this.conf.serverURL + "/assets/instagram_logo.gif"
                }
            }
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendAudioMessage = function (recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "audio",
                payload: {
                    url: this.conf.serverURL + "/assets/sample.mp3"
                }
            }
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendVideoMessage = function (recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: {
                    url: this.conf.serverURL + "/assets/allofus480.mov"
                }
            }
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendFileMessage = function (recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    url: this.conf.serverURL + "/assets/test.txt"
                }
            }
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendTextMessage = function (recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendButtonMessage = function (recipientId, payload) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: payload
            }
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendGenericMessage = function (recipientId, elems) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: elems
                }
            }
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendReceiptMessage = function (recipientId) {
    var receiptId = "order" + Math.floor(Math.random() * 1000);

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "receipt",
                    recipient_name: "Peter Chang",
                    order_number: receiptId,
                    currency: "USD",
                    payment_method: "Visa 1234",
                    timestamp: "1428444852",
                    elements: [{
                        title: "Oculus Rift",
                        subtitle: "Includes: headset, sensor, remote",
                        quantity: 1,
                        price: 599.00,
                        currency: "USD",
                        image_url: this.conf.serverURL + "/assets/riftsq.png"
                    }, {
                        title: "Samsung Gear VR",
                        subtitle: "Frost White",
                        quantity: 1,
                        price: 99.99,
                        currency: "USD",
                        image_url: this.conf.serverURL + "/assets/gearvrsq.png"
                    }],
                    address: {
                        street_1: "1 Hacker Way",
                        street_2: "",
                        city: "Menlo Park",
                        postal_code: "94025",
                        state: "CA",
                        country: "US"
                    },
                    summary: {
                        subtotal: 698.99,
                        shipping_cost: 20.00,
                        total_tax: 57.67,
                        total_cost: 626.66
                    },
                    adjustments: [{
                        name: "New Customer Discount",
                        amount: -50
                    }, {
                        name: "$100 Off Coupon",
                        amount: -100
                    }]
                }
            }
        }
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendQuickReply = function (recipientId, msg) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: msg
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendReadReceipt = function (recipientId) {
    console.log("Sending a read receipt to mark message as seen");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendTypingOn = function (recipientId) {
    console.log("Turning typing indicator on");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendTypingOff = function (recipientId) {
    console.log("Turning typing indicator off");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_off"
    };

    this.callSendAPI(messageData);
};

Messenger.prototype.sendAccountLinking = function (recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Welcome. Link your account.",
                    buttons: [{
                        type: "account_link",
                        url: this.conf.serverURL + "/authorize"
                    }]
                }
            }
        }
    };

    this.callSendAPI(messageData);
};

module.exports.Messenger = Messenger;
