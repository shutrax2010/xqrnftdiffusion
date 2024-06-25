var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const xrpl = require('xrpl');
const pinataSDK = require('@pinata/sdk');
const moment = require('moment');
const https = require('https');
const axios = require('axios');

const { isAuthenticated } = require('../authMiddleware');
const { url } = require('inspector');

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
// const sampleImageFile = 'ipfs://QmWiru8V3r42RSK9A2b85uq63nqUBnsCnczLhbxbcK9DCM';
const ipfsGateway = 'https://amethyst-raw-termite-956.mypinata.cloud/ipfs/';
    
// const walletAddress = req.session.account;
let ipfsHash = "";
let qrImgUrl = "";

/* GET users listing. */
router.get('/', isAuthenticated, function(req, res, next) {
  // console.log(req.session);
  if (req.session.authenticated) {
    res.render('mintNft',{
      walletAddress: req.session.account,
      outputMsg: ''
    });
  }
});

router.post('/mint', async function(req,res,next) {

  
  let outputMsg = '';
  const bodyData = req.body;
  const sys_walletAddress = process.env.SYS_WALLET_ADDRESS;
  // console.log(bodyData);

  
  //get QR image from api
  console.log('\n#####start getting qrImg');
  const postUrl = "https://xqrnftdiffusion.onrender.com"
  const postData = JSON.stringify({
    name: bodyData.imgPrompt,
  });

  const postOptions = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  try {
    const response = await axios.post(postUrl, postData, postOptions);
    qrImgUrl = response.data;
    console.log('Response from API: ', qrImgUrl);
  } catch (error) {
    console.error(`Problem with request: ${error.message}`);
    outputMsg += 'Something went wrong';
  }
  
  //可変プロパティの取得
  let properties = {};
  for (let i = 0; i < bodyData.propertyName.length; i++) {
    properties[bodyData.propertyName[i]] = bodyData.propertyValue[i];
  }
  

  const uploadJson = {
    EventTitle: bodyData.eventTitle,
    NFTName: bodyData.eventTitle + bodyData.eventNo,
    QRImage: qrImgUrl,
    MintDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    NFTFlags: "Transferable",
    Properties: properties
  };
  const options = {
    pinataMetadata: {
      name:bodyData.eventTitle,
    }
  };


  try {
    const pinResponse = await pinata.pinJSONToIPFS(uploadJson,options);
    // console.log(pinResponse);
    ipfsHash = pinResponse.IpfsHash;
    console.log(ipfsGateway + ipfsHash);
  } catch (error) {
    console.log(error);
    outputMsg += "エラーが発生しました。";
    res.send(outputMsg);
  }





  //create NFT
  console.log("\n######start minting nft");
  //const net = 'wss://s.altnet.rippletest.net:51233';
  const net = req.session.uri;
  console.log ("NET URL: ",net);
  const jsonUri = ipfsGateway + ipfsHash;

  outputMsg += 'connect to' + net + '....';
  

  const system_wallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);
  const client = new xrpl.Client(net);
  await client.connect();
  outputMsg += '\n Minting NFT.';
  console.log('connected');




  const transationJson = {
    "TransactionType": "NFTokenMint",
    "Account": sys_walletAddress,
    "URI": xrpl.convertStringToHex(jsonUri),
    "Flags": 8,
    "TransferFee": bodyData.royalty * 1000, // x * 1000
    "NFTokenTaxon": 0 ,
    "OtherData": {
      "EventTitle": bodyData.eventTitle,
      "NFTName": bodyData.eventTitle + bodyData.eventNo,
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
  
  // console.log(nfts);
  
  client.disconnect();
  

  res.send(outputMsg);
});








module.exports = router;
