const
  error = require('debug')('error'),
  debug = require('debug')('fb-webhook-handler'),
  bodyParser = require('body-parser');

module.exports = function (messenger, messageHandler, verifySignature, ignores, router) {

  if (verifySignature) {
    router.use(bodyParser.json({
      verify: function (req, res, buf) {
        if (ignores && ignores.includes(req.url)) {
          debug('Ignoring signature verification for', req.url);
        } else {
          if (messenger.verifySignature(req.headers["x-hub-signature"], buf)) {
            //NOOP
          } else {
            throw new Error("Couldn't validate the request signature.");
          }
        }
      }
    }));
  } else {
    router.use(bodyParser.json());
  }
  router.use(bodyParser.urlencoded({
    extended: true
  }));

  /*
   * Use your own validation token. Check that the token used in the Webhook 
   * setup is the same token used here.
   *
   */
  router.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' && messenger.matchToken(req.query['hub.verify_token'])) {
      debug("Validating webhook");
      res.status(200).send(req.query['hub.challenge']);
    } else {
      error("Failed validation. Make sure the validation tokens match.");
      res.sendStatus(403);
    }
  });

  /*
   * All callbacks for Messenger are POST-ed. They will be sent to the same
   * webhook. Be sure to subscribe your app to your page to receive callbacks
   * for your page. 
   * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
   *
   */
  router.post('/webhook', function (req, res) {
    try {
      var data = req.body;
      if (data.object == 'page') {
        data.entry.forEach(function (pageEntry) {
          var pageID = pageEntry.id;
          var timeOfEvent = pageEntry.time;
          pageEntry.messaging.forEach(function (messagingEvent) {
            if (messagingEvent.optin) {
              receivedAuthentication(messagingEvent);
            } else if (messagingEvent.message) {
              receivedMessage(messagingEvent);
            } else if (messagingEvent.delivery) {
              receivedDeliveryConfirmation(messagingEvent);
            } else if (messagingEvent.postback) {
              receivedPostback(messagingEvent);
            } else if (messagingEvent.read) {
              receivedMessageRead(messagingEvent);
            } else if (messagingEvent.account_linking) {
              receivedAccountLink(messagingEvent);
            } else {
              debug("Webhook received unknown messagingEvent: ", messagingEvent);
            }
          });
        });
      }
    } catch (err) {
      error(err);
    }
    res.sendStatus(200);
  });

  /*
   * Authorization Event
   *
   * The value for 'optin.ref' is defined in the entry point. For the "Send to 
   * Messenger" plugin, it is the 'data-ref' field. Read more at 
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
   *
   */
  function receivedAuthentication(event) {
    messageHandler.receivedAuthentication(event);
  }

  /*
   * Message Event
   *
   * This event is called when a message is sent to your page. The 'message' 
   * object format can vary depending on the kind of message that was received.
   * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
   *
   * For this example, we're going to echo any text that we get. If we get some 
   * special keywords ('button', 'generic', 'receipt'), then we'll send back
   * examples of those bubbles to illustrate the special message bubbles we've 
   * created. If we receive a message with an attachment (image, video, audio), 
   * then we'll simply confirm that we've received the attachment.
   * 
   */
  function receivedMessage(event) {
    messageHandler.handleMessage(event);
  }


  /*
   * Delivery Confirmation Event
   *
   * This event is sent to confirm the delivery of a message. Read more about 
   * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
   *
   */
  function receivedDeliveryConfirmation(event) {
    messageHandler.receivedDeliveryConfirmation(event);
  }


  /*
   * Postback Event
   *
   * This event is called when a postback is tapped on a Structured Message. 
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
   * 
   */
  function receivedPostback(event) {
    messageHandler.receivedPostback(event);
  }

  /*
   * Message Read Event
   *
   * This event is called when a previously-sent message has been read.
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
   * 
   */
  function receivedMessageRead(event) {
    messageHandler.receivedMessageRead(event);
  }

  /*
   * Account Link Event
   *
   * This event is called when the Link Account or UnLink Account action has been
   * tapped.
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
   * 
   */
  function receivedAccountLink(event) {
    var status = event.account_linking.status;

    if ('linked' == status) {
      messageHandler.doLinking(event);
    } else if ('unlinked' == status) {
      messageHandler.doUnlinking(event);
    } else {
      error('unknown linking event', event);
    }

  }

  return router;
};