"use strict";

const async = require('async'),
    crypto = require('crypto'),
    err = require('debug')('error'),
    debug = require('debug')('messenger'),
    request = require('request');

const ANALYTICS_LEVEL_NONE = 99;
const ANALYTICS_LEVEL_CRITICAL = 2;
const ANALYTICS_LEVEL_VERBOSE = 1;


function Messenger(config) {
    const url = (process.env.MESSENGER_URL) ?
        process.env.MESSENGER_URL :
        config.url || 'https://graph.facebook.com/v2.6/';

    const appSecret = (process.env.MESSENGER_APP_SECRET) ?
        process.env.MESSENGER_APP_SECRET :
        config.appSecret;

    const validationToken = (process.env.MESSENGER_VALIDATION_TOKEN) ?
        (process.env.MESSENGER_VALIDATION_TOKEN) :
        config.validationToken;

    const pageAccessToken = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
        (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
        config.pageAccessToken;

    const appId = (process.env.MESSENGER_APP_ID) ?
        (process.env.MESSENGER_APP_ID) :
        config.appId;

    const pageId = (process.env.MESSENGER_PAGE_ID) ?
        (process.env.MESSENGER_PAGE_ID) :
        config.pageId;

    const analyticsLogLevel = (process.env.MESSENGER_ANALYTICS_LOG_LEVEL) ?
        (Number.parseInt(process.env.MESSENGER_ANALYTICS_LOG_LEVEL)) :
        config.analyticsLogLevel || ANALYTICS_LEVEL_NONE;

    const httpProxy = (process.env.HTTP_PROXY) ?
        (process.env.HTTP_PROXY) :
        config.httpProxy;

    if (!(appSecret && validationToken && pageAccessToken && url)) {
        err("Missing config values");
        process.exit(1);
    }

    if (httpProxy && "" !== httpProxy) {
        debug('using proxy', httpProxy);
    }
    this.conf = {
        appSecret: appSecret,
        validationToken: validationToken,
        pageAccessToken: pageAccessToken,
        httpProxy: httpProxy,
        urlPrefix: url,
        activitiesUrl: 'https://graph.facebook.com/' + appId + '/activities',
        analyticsLogLevel: analyticsLogLevel,
        pageId: pageId,
        appId: appId
    };
}

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

Messenger.prototype.updateReq = function (req) {
    if (this.conf.httpProxy && "" !== this.conf.httpProxy) {
        req.proxy = this.conf.httpProxy;
    }
    return req;
};

Messenger.prototype.callSendAPI = function (messageData, callback) {
    var ptr = this;
    request(this.updateReq({
        uri: this.conf.urlPrefix + 'me/messages',
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'POST',
        json: messageData

    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            if (messageId) {
                debug("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
            } else {
                debug("Successfully called Send API for recipient %s",
                    recipientId);
            }
            if (callback) {
                callback(null, body);
            }
        } else {
            var args = ["Failed calling Send API"];
            if (error) {
                args.push(error);
            }
            if (response) {
                args.push(response.statusCode);
                args.push(response.statusMessage);
            }
            if (body && body.error) {
                args.push(body.error);
            }
            err(args);
            if (callback) {
                callback(args, null);
            }
        }
    });
};

Messenger.prototype.getUserProfile = function (userId, callback) {
    var ptr = this;
    request(this.updateReq({
        uri: this.conf.urlPrefix + userId,
        qs: {
            access_token: this.conf.pageAccessToken,
            fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
        },
        method: 'GET'
    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, JSON.parse(body));
        } else {
            err("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.getAccountLinkingEndpoint = function (token, callback) {
    var ptr = this;
    request(this.updateReq({
        uri: this.conf.urlPrefix + "me",
        qs: {
            access_token: this.conf.pageAccessToken,
            fields: 'recipient',
            account_linking_token: token
        },
        method: 'GET'
    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            err("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.setThreadSettings = function (messageData, callback) {
    var ptr = this;
    request(this.updateReq({
        uri: this.conf.urlPrefix + "me/thread_settings",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'POST',
        json: messageData
    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            err("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.setMessengerProfile = function (profileData, callback) {
    var ptr = this;
    request(this.updateReq({
        uri: this.conf.urlPrefix + "me/messenger_profile",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'POST',
        json: profileData
    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            err("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.removeMessengerProfile = function (fields, callback) {
    var ptr = this;
    request(this.updateReq({
        uri: this.conf.urlPrefix + "me/messenger_profile",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'DELETE',
        json: {
            fields: fields
        }
    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            err("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
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
    request(this.updateReq({
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
    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            err("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.clearThreadSettings = function (callback) {
    var ptr = this;
    request(this.updateReq({
        uri: this.conf.urlPrefix + "me/thread_settings",
        qs: {
            access_token: this.conf.pageAccessToken
        },
        method: 'DELETE',
        json: {
            setting_type: "call_to_actions",
            thread_state: "existing_thread"
        }
    }), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            err("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            callback(error, null);
        }
    });
};

Messenger.prototype.buildAnalyticsEvent = function (eventName, value, currency) {
    var ret = {
        _eventName: eventName
    };
    if (value) {
        ret._valueToSum = value;
    }
    if (currency) {
        ret.fb_currency = currency;
    }
    return ret;
};

Messenger.prototype.canLogAnalyticsEvent = function (level, callback) {
    callback(null, (level == ANALYTICS_LEVEL_CRITICAL ||
        level == ANALYTICS_LEVEL_NONE ||
        level == ANALYTICS_LEVEL_VERBOSE) &&
        level >= this.conf.analyticsLogLevel);
};

Messenger.prototype.sendActivity = function (payload, callback) {
    debug('Sending activity with payload', payload);
    request.post({
        url: this.conf.activitiesUrl,
        form: payload
    }, callback);
};

Messenger.prototype.analyticsEvent = function (level, recipientId, eventBuilder, callback) {
    var ptr = this;
    async.waterfall([
        function (callback) {
            ptr.canLogAnalyticsEvent(level, callback);
        },
        function (status, callback) {
            if (status) {
                ptr.sendActivity({
                    event: 'CUSTOM_APP_EVENTS',
                    custom_events: JSON.stringify([eventBuilder()]),
                    advertiser_tracking_enabled: 0,
                    application_tracking_enabled: 0,
                    extinfo: JSON.stringify(['mb1']),
                    page_id: ptr.conf.pageId,
                    page_scoped_user_id: recipientId
                }, callback);
            } else {
                callback({ skip: true }, null);
            }
        },
    ], function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (callback) {
                callback(null, JSON.parse(body));
            }
        } else if (error && error.skip) {
            callback(null, error);
        } else {
            var args = ["Failed calling analyticsEvent"];
            if (error) {
                args.push(error);
            }
            if (response) {
                args.push(response.statusCode);
                args.push(response.statusMessage);
            }
            if (body && body.error) {
                args.push(body.error);
            }
            err(args);
            if (callback) {
                callback(args, null);
            }
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

    this.callSendAPI(messageData);
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

Messenger.prototype.sendQuickReplyOrMessage = function (recipientId, messageText, quickReply, metadata, callback) {
    debug('quickReply', quickReply);
    if (quickReply) {
        this.sendQuickReply(recipientId, messageText, quickReply);
    } else {
        this.sendTextMessage(recipientId, messageText, metadata, callback);
    }
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

Messenger.prototype.addButton = function (element, btns) {
    if (btns && 1 == btns.length) {
        if (!element.buttons) {
            element.buttons = [];
        }
        if (3 > element.buttons.length) {
            element.buttons.push(btns[0]);
        }
    }
};

Messenger.prototype.sendCompactList = function (recipientId, elems, moreButtons, callback) {
    var payload;
    if (1 == elems.length) {
        payload = {
            template_type: "generic",
            elements: elems
        };
        this.addButton(elems[0], moreButtons);
    } else if (1 < elems.length) {
        payload = {
            template_type: "list",
            top_element_style: "compact",
            elements: elems
        };
        if (moreButtons) {
            payload.buttons = moreButtons;
        }
    }
    this.sendTemplate(recipientId, payload, callback);
};

Messenger.prototype.sendQuickReply = function (recipientId, messageText, replies, callback) {
    var arr = [];
    var quickReplies = Array.isArray(replies) ? Array.from(new Set(replies)) : [replies];
    quickReplies.forEach((entry) => {
        if (entry) {
            if (typeof entry === 'object') {
                if (!entry.content_type) {
                    entry.content_type = 'text';
                }
                arr.push(entry);
            } else {
                arr.push({
                    content_type: "text",
                    title: entry,
                    payload: entry
                });
            }
        }
    });
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            quick_replies: arr
        }
    };
    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendReadReceipt = function (recipientId, callback) {
    debug("Sending a read receipt to mark message as seen");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendTypingOn = function (recipientId, callback) {
    debug("Turning typing indicator on");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    this.callSendAPI(messageData, callback);
};

Messenger.prototype.sendTypingOff = function (recipientId, callback) {
    debug("Turning typing indicator off");

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
    var fromIdx = opts.from ? typeof opts.from == 'number' ? opts.from : opts.from.next ? Number.parseInt(opts.from.next) : 0 : 0;
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
        if (request.hasOwnProperty(key) && typeof request[key] !== 'function') {
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
module.exports.ANALYTICS_LEVEL_NONE = 99;
module.exports.ANALYTICS_LEVEL_CRITICAL = 2;
module.exports.ANALYTICS_LEVEL_VERBOSE = 1;
