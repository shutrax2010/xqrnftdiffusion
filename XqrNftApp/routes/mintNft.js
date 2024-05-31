var express = require('express');
var router = express.Router();

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

  const collectionName = req.body.collname;
  const jsonUri = 'https://orange-official-gecko-137.mypinata.cloud/ipfs/QmRpu7AP1PFCySyvhm3gSJZxvHjTve5scHavB5r5itpDwX';
  let outputMsg = '';

  const net = 'wss://s.altnet.rippletest.net:51233';

  outputMsg += 'connecting to' + net + '....';
  

  
  const client = new xrpl.Client(net);
  await client.connect();
  outputMsg += '\nConnected. Minting NFT.';
  console.log('connected');



  // const transationJson = {
  //   "TransactionType": "NFTokenMint",
  //   "Account": "rPxR3CeKzJzcqtnbsyTdYpLrAHmd7fFwiq",
  //   "URI": xrpl.convertStringToHex(jsonUri),
  //   "Flags": 8,
  //   "TransferFee": 320,
  //   "NFTokenTaxon": 0 
  // }

//   const tx = await client.submitAndWait(transationJson, {wallet: system_wallet});
  
// console.log(tx.result.meta.TransactionResult);

//   const nfts = await client.request({
//     method: "account_nfts",
//     account: system_wallet.classicAddress
//   });

//   outputMsg += '\n\nTransaction result: ' + tx.result.meta.TransactionResult;

  console.log(collectionName);
  client.disconnect();

  res.render('./mintNft.ejs', {
    walletAddress: walletAddress,
    outputMsg: outputMsg
  });
});





module.exports = router;
