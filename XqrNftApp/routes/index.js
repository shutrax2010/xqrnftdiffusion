var express = require('express');
var router = express.Router();
const { XummSdk } = require('xumm-sdk');
const keypairs = require('ripple-keypairs');
require('dotenv').config();

 const xummApiKey = process.env.XUMM_APIKEY;
 const xummSecret = process.env.XUMM_APISECRET;
 const xumm = new XummSdk(xummApiKey,xummSecret);

/* GET home page. */
router.get('/', function(req, res, next) {
  const xummRequest = req.query.xummRequest;

  if (!xummRequest) {
    res.render('index', { title: 'PhygitalifyQR' });
  } else {  

    const seed = keypairs.generateSeed();
    const keypair = keypairs.deriveKeypair(seed);
    const address = keypairs.deriveAddress(keypair.publicKey);

    console.log('Generated seed:', seed);
    console.log('Generated address:', address);

    req.session.seed = seed;

    xumm.ping().then(pong => {
      const payload = {
        TransactionType: "SignIn",
      };

      return xumm.payload.createAndSubscribe(payload); // Create Xumm payload
    })
    .then(payloadData => {      
      res.json({seed,payloadData});
    })
    .catch(error => {
      console.error('Error creating Xumm payload:', error);
      res.status(500).json({ message: 'Internal server error' });
    });
  }

});

router.get('/payload/:payload_uuid', async function(req, res, next) {
  const payloadUuid = req.params.payload_uuid;
  
  try {
    const payloadData = await xumm.payload.get(payloadUuid);
    const status = payloadData.meta.signed ? 'completed' : 'in_progress';
    const resolved = payloadData.meta.resolved ? true : false;
    const account = payloadData.response.account;
    const uri = payloadData.response.environment_nodeuri;
    console.log("payloadData : ",payloadData);
    if (status === 'completed' && resolved ) {
      // Store authenticated state and account in session
      req.session.authenticated = true;
      req.session.account = account;
      req.session.uri = uri;
      req.session.resolved = resolved;
      console.log("req",req.session);
    }
    res.json({ status , account , resolved}); 

  } catch (error) {
    console.error('Error fetching payload data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
