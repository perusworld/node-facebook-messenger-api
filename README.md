# Simple Node.js Facebook Messenger API #

[![bitHound Overall Score](https://www.bithound.io/github/perusworld/node-facebook-messenger-api/badges/score.svg)](https://www.bithound.io/github/perusworld/node-facebook-messenger-api)
[![bitHound Dependencies](https://www.bithound.io/github/perusworld/node-facebook-messenger-api/badges/dependencies.svg)](https://www.bithound.io/github/perusworld/node-facebook-messenger-api/master/dependencies/npm)
[![bitHound Code](https://www.bithound.io/github/perusworld/node-facebook-messenger-api/badges/code.svg)](https://www.bithound.io/github/perusworld/node-facebook-messenger-api)

Based on the [Messenger Platform Sample](https://github.com/fbsamples/messenger-platform-samples)

## Install ##
```bash
npm install github:perusworld/node-facebook-messenger-api --save
```


## Usage ##
See [Setup](https://developers.facebook.com/docs/messenger-platform/guides/setup) for more details about setting up the bot/page.

### Get User Profile - [User Profile API](https://developers.facebook.com/docs/messenger-platform/user-profile) ##
```javascript
var messengerapi = require('node-facebook-messenger-api').messenger();
var messenger = new messengerapi.Messenger({
    appId:"",
    pageId: "",
    analyticsLogLevel: "",
    appSecret: "",
    pageAccessToken: "",
    validationToken: ""
});

var pageScopedUserID = "...";

messenger.getUserProfile(pageScopedUserID, (err, resp) => {
    if (err) {
        console.error(recipientId, "Sorry, looks like the backend is down :-(");
    } else {
        console.log(JSON.parse(resp));
    }
});
```

### Send Generic Template Message - [Generic Template](https://developers.facebook.com/docs/messenger-platform/send-api-reference/generic-template) ###
```javascript
messenger.sendGenericMessage(pageScopeUserID, [{
    title: "Welcome to Peter\'s Hats",
    image_url: "https://petersfancybrownhats.com/company_image.png",
    subtitle: "We\'ve got the right hat for everyone.",
    default_action: {
        type: "web_url",
        url: "https://peterssendreceiveapp.ngrok.io/view?item=103",
        messenger_extensions: true,
        webview_height_ratio: "tall",
        fallback_url: "https://peterssendreceiveapp.ngrok.io/"
    },
    buttons: [{
        type: "web_url",
        url: "https://petersfancybrownhats.com",
        title: "View Website"
    }, {
        type: "postback",
        title: "Start Chatting",
        payload: "DEVELOPER_DEFINED_PAYLOAD"
    }]
}]);
```

### Using Webhook Handler to receive Facebook Messenger Events - [Webhook Reference](https://developers.facebook.com/docs/messenger-platform/webhook-reference) ###
The example folder contains a sample app 
```bash
npm install
cd example
export MESSENGER_ANALYTICS_LOG_LEVEL = "2";
export MESSENGER_APP_ID = "--yours--";
export MESSENGER_PAGE_ID = "--yours--";
export MESSENGER_APP_SECRET="--yours--"
export MESSENGER_VALIDATION_TOKEN="--yours--"
export MESSENGER_PAGE_ACCESS_TOKEN="--yours--"
node server
```
Or use this in your existing code
```javascript
const
  express = require('express');

var ignores = ['/some-url/to-ignore'];
var verifySignature = true;

var messengerapi = require('node-facebook-messenger-api').messenger();
var messenger = new messengerapi.Messenger({});
var webhookHandler = require('node-facebook-messenger-api').webhookHandler()(messenger, {
  receivedAuthentication : function(event) {
    console.log('receivedAuthentication', event);
  },
  handleMessage : function(event) {
    console.log('handleMessage', event);
    messenger.sendTextMessage(event.sender.id, JSON.stringify(event));
  },
  receivedDeliveryConfirmation : function(event) {
    console.log('receivedDeliveryConfirmation', event);
  },
  receivedPostback : function(event) {
    console.log('receivedPostback', event);
  },
  receivedMessageRead : function(event) {
    console.log('receivedMessageRead', event);
  },
  doLinking : function(event) {
    console.log('doLinking', event);
  },
  doUnlinking : function(event) {
    console.log('doUnlinking', event);
  }
},verifySignature, ignores, express.Router());

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));

app.use('/fb', webhookHandler);
app.listen(app.get('port'), function () {
  console.log('Node app is running in http mode on port', app.get('port'));
});
```
#### Analytics Events ####
You can now send analytics events through the following API (See [App Events with Bots for Messenger - Logging Custom Events](https://developers.facebook.com/docs/app-events/bots-for-messenger#logging-custom-events) and [App Events API](https://developers.facebook.com/docs/marketing-api/app-event-api/v2.9) for more details about the event types)

For performace reasons if you would like to throttle the events that you would like to send/track, you can use the env variable
```bash
export MESSENGER_ANALYTICS_LOG_LEVEL = "2";
```
to control the log levels. Set that to 

Level | Value | Description |
--- | --- | --- |
None | 99 | Don't send any analytics events |
Critical | 2 | Send only critical analytics events |
Verbose | 1 | Send all analytics events |

The asynchronous callback from the *analyticsEvent* call would be either 
```json
{
  "success": true
}
```
if the event was successfully accepted or
```json
{
  "skip": true
}
```
if the event was skipped due lower log levels

 - Custom Event
```javascript
  messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_VERBOSE, event.sender.id, () => {
    return messenger.buildAnalyticsEvent("fb_mobile_verbose_event");
  }, (err, resp) => {
    messenger.sendTextMessage(event.sender.id, JSON.stringify(err ? err : resp));
  });
```

 - Standard Purchase Event
```javascript
  messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_CRITICAL, event.sender.id, () => {
    return messenger.buildAnalyticsEvent("fb_mobile_purchase", { _valueToSum: 9.99, fb_currency: 'USD' });
  }, (err, resp) => {
    messenger.sendTextMessage(event.sender.id, JSON.stringify(err ? err : resp));
  });
```
 - Standard Add Cart Event Using quickAnalytics
```javascript
  messenger.quickAnalytics(messengerapi.ANALYTICS_LEVEL_CRITICAL, event.sender.id, "fb_mobile_add_to_cart", {
    fb_content_type: 'blah blah blah', fb_content_id: '123456789', _valueToSum: 9.99, fb_currency: 'USD'
  });
```