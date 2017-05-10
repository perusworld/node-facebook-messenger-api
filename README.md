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
var messengerapi = require('node-facebook-messenger-api').messenger({
    appSecret: "",
    pageAccessToken: "",
    validationToken: "",
    logAPI: false
});
var messenger = new messengerapi.Messenger();

var pageScopeUserID = "...";

messenger.getUserProfile(pageScopeUserID, (err, resp) => {
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