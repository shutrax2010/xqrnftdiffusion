var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const xrpl = require('xrpl');
const pinataSDK = require('@pinata/sdk');
const moment = require('moment');
const https = require('https');

const { isAuthenticated } = require('../authMiddleware');
const { url } = require('inspector');

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
const sampleImageFile = 'ipfs://QmWiru8V3r42RSK9A2b85uq63nqUBnsCnczLhbxbcK9DCM';
const ipfsGateway = 'https://amethyst-raw-termite-956.mypinata.cloud/ipfs/';
    
// const walletAddress = req.session.account;
let ipfsHash = "";

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
  //does not work
  console.log('\n#####start getting qrImg');
  const postData = JSON.stringify({
    imagePrompt: bodyData.imgPrompt,
  });

  const postOptions = {
    hostname: 'xqrnftdiffusion.onrender.com',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const qrImgReq = https.request(postOptions, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log('Respons from API: ', data);
      outputMsg += data;
    })
  });

  qrImgReq.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    outputMsg += 'Something wrong';
  });
  
  qrImgReq.write(postData);
  qrImgReq.end();
  console.log(qrImgReq);

/*
  //createJson and pin to Pinata
  console.log("\n######start uploading to pinata");
  const uploadJson = {
    EventTitle: bodyData.eventTitle,
    NFTName: bodyData.eventTitle + bodyData.eventNo,
    QRImage: sampleImageFile,
    MintDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    NFTFlags: "Transferable"
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

  outputMsg += 'connecting to' + net + '....';
  

  const system_wallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);
  const client = new xrpl.Client(net);
  await client.connect();
  outputMsg += '\nConnected. Minting NFT.';
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
  */

  res.send(outputMsg);
});








module.exports = router;
