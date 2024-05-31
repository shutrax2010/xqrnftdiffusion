var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

const xrpl = require('xrpl');

const walletAddress = 'this is a address';

/* GET users listing. */
router.get('/', function(req, res, next) {
  
  res.render('mintNft',{
    walletAddress: walletAddress,
    outputMsg: ''
  });
});

router.post('/mint', async function(req,res,next) {
  console.log('start');

  const bodyData = req.body;

  const jsonUri = bodyData.json_uri;
  let outputMsg = '';

  const net = 'wss://s.altnet.rippletest.net:51233';

  outputMsg += 'connecting to' + net + '....';
  

  const system_wallet = xrpl.Wallet.fromSeed('sEd7wQbKfXydEcNLtLViMH8TSCUv2fm');
  const client = new xrpl.Client(net);
  await client.connect();
  outputMsg += '\nConnected. Minting NFT.';
  console.log('connected');



  const transationJson = {
    "TransactionType": "NFTokenMint",
    "Account": "rPxR3CeKzJzcqtnbsyTdYpLrAHmd7fFwiq",
    "URI": xrpl.convertStringToHex(jsonUri),
    "Flags": 8,
    "TransferFee": bodyData.loyalty * 1000, // x * 1000
    "NFTokenTaxon": 0 ,
    "OtherData": {
      "CollectionNo": bodyData.collno,
      "CollectionName": bodyData.collname,
      "NFTName": bodyData.nftname,
      "Description": bodyData.description
    }
  }

  const tx = await client.submitAndWait(transationJson, {wallet: system_wallet});
  
console.log(tx.result.meta.TransactionResult);

  const nfts = await client.request({
    method: "account_nfts",
    account: system_wallet.classicAddress
  });

  outputMsg += '\n\nTransaction result: ' + tx.result.meta.TransactionResult;
  outputMsg += '\n' + nfts;
  console.log(nfts);

  
  client.disconnect();

  res.render('mintNft',{
    walletAddress: walletAddress,
    outputMsg: outputMsg
  });
});








module.exports = router;
