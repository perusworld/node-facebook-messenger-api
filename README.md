# Simple Node.js Facebook Messenger API #

Based on the [Messenger Platform Sample](https://github.com/fbsamples/messenger-platform-samples)

## Setup ##

Create a file **default.json** under **config** folder with the following values filled according to your fb messenger/page. See [Setup](https://developers.facebook.com/docs/messenger-platform/guides/setup) for more details.
```json
{
    "appSecret": "",
    "pageAccessToken": "",
    "validationToken": "",
    "serverURL": ""
}
```

## Usage ##

### Get User Profile ##
```javascript
var messengerapi = require('node-facebook-messenger-api').messenger();
var messenger = new messenger.Messenger();
messenger.getUserProfile(recipientId, (err, resp) => {
    if (err) {
        console.error(recipientId, "Sorry, looks like the backend is down :-(");
    } else {
        console.log(JSON.parse(resp));
    }
});
```