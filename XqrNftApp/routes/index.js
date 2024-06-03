var express = require('express');
var router = express.Router();
const { XummSdk } = require('xumm-sdk');
require('dotenv').config();

// **(Remove these lines to avoid exposing API keys)**
 const xummApiKey = process.env.XUMM_APIKEY;
// const xumm = new XummSdk(xummApiKey, process.env.XUMM_APISECRET);

/* GET home page. */
router.get('/', function(req, res, next) {
  const xummRequest = req.query.xummRequest;

  if (!xummRequest) {
    res.render('index', { title: 'Express' });
  } else {
    // Replace these placeholders with your actual Xumm API credentials
    const xumm = new XummSdk(xummApiKey,process.env.XUMM_APISECRET);

    xumm.ping().then(pong => {
      const payload = {
        TransactionType: "SignIn",
      };

      return xumm.payload.createAndSubscribe(payload); // Create Xumm payload
    })
    .then(payloadData => {
      const payloadUrl = payloadData.payload.meta.signed;
      const intervalId = setInterval(async () => {
        try {
          if (payloadUrl) {
            console.log('Fetched payload:', payloadUrl);

          if (payloadUrl = true) {
            clearInterval(intervalId); // Stop polling on completion
            console.log('Sign-in successful!');


          } else if (payloadUrl = false ) {
            clearInterval(intervalId); // Stop polling on rejection
            console.log('Sign-in rejected.');

          } else {
            console.log('Sign-in still in progress...');
          }
        }else{
          console.error('Fetched payload is null');
          console.log(payloadUrl);
        }
        } catch (error) {
          console.error('Error fetching payload data:', error);
          res.status(500).json({ message: 'Internal server error' }); // Handle errors
        }
      }, 5000); // Polling interval (adjust as needed)
      
      // Optionally send a basic response to the client
      res.json(payloadData);
    })
    .catch(error => {
      console.error('Error creating Xumm payload:', error);
      res.status(500).json({ message: 'Internal server error' });
    });
  }
});

module.exports = router;
