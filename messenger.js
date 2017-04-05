"use strict";

const
    config = require('config'),
    crypto = require('crypto'),
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

    const logApi = (process.env.LOG_API) ?
        (process.env.LOG_API) :
        config.get('logAPI');

    if (!(appSecret && validationToken && pageAccessToken)) {
        console.error("Missing config values");
        process.exit(1);
    }

    this.conf = {
        log: logApi || false,
        appSecret: appSecret,
        validationToken: validationToken,
        pageAccessToken: pageAccessToken,
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

Messenger.prototype.matchToken = function (token) {
    return this.conf.validationToken === token;
};

Messenger.prototype.verifySignature = function (signature, buf) {
    var ret = false;
    if (signature) {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];
        var expectedHash = crypto.createHmac('sha1', this.conf.appSecret)
            .update(buf)
            .digest('hex');
        ret = (signatureHash == expectedHash);
    }
    return ret;
};

Messenger.prototype.callSendAPI = function (messageData, callback) {
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
            if (callback) {
                callback(null, body)
            }
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            if (callback) {
                callback(body, null)
            }
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
            callback(null, JSON.parse(body))
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.getAccountLinkingEndpoint = function (token, callback) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + "me",
        qs: {
            access_token: this.conf.pageAccessToken,
            fields: 'recipient',
            account_linking_token: token
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

Messenger.prototype.setMessengerProfile = function (profileData, callback) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + "me/messenger_profile",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'POST',
        json: profileData
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body)
        } else {
            ptr.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.removeMessengerProfile = function (fields, callback) {
    var ptr = this;
    request({
        uri: this.conf.urlPrefix + "me/messenger_profile",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'DELETE',
        json: {
            fields: fields
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

Messenger.prototype.setGetStarted = function (payload, callback) {
    this.setMessengerProfile({
        get_started: {
            payload: payload
        }
    }, callback);
};

Messenger.prototype.removeGetStarted = function (callback) {
    this.removeMessengerProfile(['get_started'], callback);
};

Messenger.prototype.setGreetingText = function (greetings, callback) {
    this.setMessengerProfile({
        greeting: greetings
    }, callback);
};

Messenger.prototype.removeGreetingText = function (callback) {
    this.removeMessengerProfile(['greeting'], callback);
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

Messenger.prototype.sendImageMessage = function (recipientId, payload) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: payload
            }
        }
    };

    callSendAPI(messageData);
};

Messenger.prototype.sendGifMessage = function (recipientId, payload, callback) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: payload
            }
        }
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendAudioMessage = function (recipientId, payload, callback) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "audio",
                payload: payload
            }
        }
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendVideoMessage = function (recipientId, payload, callback) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: payload
            }
        }
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendFileMessage = function (recipientId, payload, callback) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: payload
            }
        }
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendTextMessage = function (recipientId, messageText, metadata, callback) {
    var msg = {
        text: messageText
    };
    if (metadata) {
        msg.metadata = metadata;
    }
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: msg
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendButtonMessage = function (recipientId, payload, callback) {
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

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendGenericMessage = function (recipientId, elems, callback) {
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

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendTemplate = function (recipientId, payload, callback) {
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

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendCompactList = function (recipientId, elems, moreButtons, callback) {
    var payload;
    if (1 == elems.length) {
        payload = {
            template_type: "generic",
            elements: elems
        };
    } else if (1 < elems.length) {
        payload = {
            template_type: "list",
            top_element_style: "compact",
            elements: elems
        };
        if (moreButtons) {
            payload.buttons = moreButtons
        }
    }
    this.sendTemplate(recipientId, payload, callback);
};

Messenger.prototype.sendQuickReply = function (recipientId, msg, callback) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: msg
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendReadReceipt = function (recipientId, callback) {
    console.log("Sending a read receipt to mark message as seen");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendTypingOn = function (recipientId, callback) {
    console.log("Turning typing indicator on");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendTypingOff = function (recipientId, callback) {
    console.log("Turning typing indicator off");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_off"
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendAccountLinking = function (recipientId, payload, callback) {
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
    this.callSendAPI(messageData, callback);
};

Messenger.prototype.nextReplyBuilder = function (idx, target, opts, nextImg) {
    var props = opts ? opts : {};
    props.next = idx;
    var ret = {
        content_type: "text",
        title: "More",
        payload: this.buildPostback(target, props)
    };
    if (nextImg) {
        ret.image_url = nextImg;
    }
    return ret;
};

Messenger.prototype.nextBuilder = function (idx, target, opts, nextImg) {
    var props = opts ? opts : {};
    props.next = idx;
    var ret = {
        title: "More",
        buttons: [{
            type: "postback",
            title: "More",
            payload: this.buildPostback(target, props)
        }]
    };
    if (nextImg) {
        ret.image_url = nextImg;
    }
    return ret;
};

Messenger.prototype.buildEntries = function (opts, lastOffset) {
    var ptr = this;
    var ret = [];
    var nextBuilder = opts.nextBuilder;
    if (!nextBuilder) {
        nextBuilder = this.nextBuilder.bind(this);
    }
    var fromIdx = typeof opts.from == 'number' ? opts.from : opts.from.next ? Number.parseInt(opts.from.next) : 0;
    opts.arr.forEach((entry, idx) => {
        if (idx >= fromIdx) {
            if (opts.arr.length == (fromIdx + opts.listMax)) {
                ret.push(opts.builder ? opts.builder(entry) : entry);
            } else if (idx < (fromIdx + opts.listMax + lastOffset)) {
                ret.push(opts.builder ? opts.builder(entry) : entry);
            } else if (fromIdx + opts.listMax + lastOffset == idx) {
                ret.push(nextBuilder(idx, opts.nextTarget, opts.nextProps, opts.nextImg));
            }
        }
    });
    return ret;
};

Messenger.prototype.buildElements = function (opts) {
    return this.buildEntries(opts, -1);
};

Messenger.prototype.buildListElements = function (opts) {
    return this.buildEntries(opts, 0);
};

Messenger.prototype.buildPostback = function (target, request) {
    var ret = [target];
    for (var key in request) {
        if (request.hasOwnProperty(key) && !(typeof request[key] === 'function')) {
            ret.push(key);
            ret.push(request[key]);
        }
    }
    return ret.join(":");
};

Messenger.prototype.parsePostback = function (payload) {
    var ret = {};
    var entries = payload.split(":");
    if (0 < entries.length) {
        ret.target = entries[0];
        entries = entries.slice(1);
        for (var idx = 0; idx < entries.length; idx += 2) {
            ret[entries[idx]] = entries[idx + 1];
        }
    }
    return ret;
};

module.exports.Messenger = Messenger;
