# Simple Node.js Facebook Messenger API #

Based on the [Messenger Platform Sample](https://github.com/fbsamples/messenger-platform-samples)

## Setup ##

Create a file **default.json** under **config** folder with the following values filled according to your fb messenger/page. See [Setup](https://developers.facebook.com/docs/messenger-platform/guides/setup) for more details.
```json
{
    "appSecret": "",
    "pageAccessToken": "",
    "validationToken": "",
    "serverURL": "",
    "logAPI": false
}
```

## Usage ##

### Get User Profile - [User Profile API](https://developers.facebook.com/docs/messenger-platform/user-profile) ##
```javascript
var messengerapi = require('node-facebook-messenger-api').messenger();
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