'use strict';

const
  express = require('express');

var ignores = ['/some-url/to-ignore'];
var verifySignature = true;

var messengerapi = require('../node-facebook-messenger-api').messenger();
var messenger = new messengerapi.Messenger({});
var webhookHandler = require('../node-facebook-messenger-api').webhookHandler()(messenger, {
  receivedAuthentication: function (event) {
    console.log('receivedAuthentication', event);
  },
  handleMessage: function (event) {
    console.log('handleMessage', event);
    if (event.message && event.message.text) {
      switch (event.message.text) {
        case 'profile':
          messenger.getUserProfile(event.sender.id, (err, resp) => {
            messenger.sendTextMessage(event.sender.id, JSON.stringify(err ? err : resp));
          });
          break;
        case 'anverb':
          messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_VERBOSE, event.sender.id, () => {
            return messenger.buildAnalyticsEvent("fb_mobile_verbose_event");
          }, (err, resp) => {
            messenger.sendTextMessage(event.sender.id, JSON.stringify(err ? err : resp));
          });
          break;
        case 'ancrit':
          messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_CRITICAL, event.sender.id, () => {
            return messenger.buildAnalyticsEvent("fb_mobile_critical_event");
          }, (err, resp) => {
            messenger.sendTextMessage(event.sender.id, JSON.stringify(err ? err : resp));
          });
          break;
        case 'anusd':
          messenger.analyticsEvent(messengerapi.ANALYTICS_LEVEL_CRITICAL, event.sender.id, () => {
            return messenger.buildAnalyticsEvent("fb_mobile_purchase", { _valueToSum: 9.99, fb_currency: 'USD' });
          }, (err, resp) => {
            messenger.sendTextMessage(event.sender.id, JSON.stringify(err ? err : resp));
          });
          break;
        case 'anquick':
          messenger.quickAnalytics(messengerapi.ANALYTICS_LEVEL_CRITICAL, event.sender.id, "quick_analytics");
          break;
        case 'anitem':
          messenger.quickAnalytics(messengerapi.ANALYTICS_LEVEL_CRITICAL, event.sender.id, "fb_mobile_add_to_cart", {
            fb_content_type: 'blah blah blah', fb_content_id: '123456789', _valueToSum: 9.99, fb_currency: 'USD'
          });
          break;
        default:
          messenger.sendTextMessage(event.sender.id, JSON.stringify(event));
          break;
      }
    } else {
      messenger.sendTextMessage(event.sender.id, JSON.stringify(event));
    }
  },
  receivedDeliveryConfirmation: function (event) {
    console.log('receivedDeliveryConfirmation', event);
  },
  receivedPostback: function (event) {
    console.log('receivedPostback', event);
  },
  receivedMessageRead: function (event) {
    console.log('receivedMessageRead', event);
  },
  doLinking: function (event) {
    console.log('doLinking', event);
  },
  doUnlinking: function (event) {
    console.log('doUnlinking', event);
  }
}, verifySignature, ignores, express.Router());

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));

app.use('/fb', webhookHandler);
app.listen(app.get('port'), function () {
  console.log('Node app is running in http mode on port', app.get('port'));
});


