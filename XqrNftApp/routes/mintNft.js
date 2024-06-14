var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const xrpl = require('xrpl');
const pinataSDK = require('@pinata/sdk');
const moment = require('moment');

const { isAuthenticated } = require('../authMiddleware');

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
const sampleImageFile = 'ipfs://QmWiru8V3r42RSK9A2b85uq63nqUBnsCnczLhbxbcK9DCM';

router.get('/', isAuthenticated, async function(req, res, next) {
  if (req.session.authenticated) {
    const account = req.session.account;
    // Render the mintNft.ejs template with data
    res.render('mintNft', { walletAddress: account, outputMsg: ''});
  } else {
    res.redirect('/'); // Redirect to index page if not authenticated
  }
});

const walletAddress = 'this is a address'
router.post('/mint', async function(req,res,next) {
  console.log('start');

  const bodyData = req.body;

  let outputMsg = '';

  //createJson and pin to Pinata
  const uploadJson = {
    CollectionName: bodyData.collname,
    NFTName: bodyData.nftname,
    QRImage: sampleImageFile,
    MintDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    NFTFlags: "Transferable"
  };
  const options = {
    pinataMetadata: {
      name:bodyData.nftname
    }
  };

  const pinResponse = await pinata.pinJSONToIPFS(uploadJson,options);
  // console.log(pinResponse);
  const ipfsGateway = 'https://amethyst-raw-termite-956.mypinata.cloud/ipfs/';
  const ipfsHash = pinResponse.IpfsHash;
  console.log(ipfsGateway + ipfsHash);



  //create NFT

  //const net = 'wss://s.altnet.rippletest.net:51233';
  const net = req.session.uri;
  console.log ("NET URL: ",net);
  const jsonUri = ipfsGateway + ipfsHash;

  outputMsg += 'connecting to' + net + '....';
  

  const system_wallet = xrpl.Wallet.fromSeed('sEd7wQbKfXydEcNLtLViMH8TSCUv2fm');
  const client = new xrpl.Client(net);
  await client.connect();
  outputMsg += '\nConnected. Minting NFT.';
  console.log('connected');



  const transationJson = {
    "TransactionType": "NFTokenMint",
    //"Account": "rPxR3CeKzJzcqtnbsyTdYpLrAHmd7fFwiq",
    "Account": req.session.account,
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
  
console.log(tx);
const bitcompPrefix = 'https://test.bithomp.com/en/nft/';
const nftoken_id = tx.result.meta.nftoken_id;
outputMsg += 'NFTを作成しました。'
outputMsg += '\n' + bitcompPrefix + nftoken_id;

  const nfts = await client.request({
    method: "account_nfts",
    account: system_wallet.classicAddress
  });

  outputMsg += '\n\nTransaction result: ' + tx.result.meta.TransactionResult;
  
  console.log(nfts);
  
  client.disconnect();

  res.send(outputMsg);
});








module.exports = router;
