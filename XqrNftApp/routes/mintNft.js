var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const xrpl = require('xrpl');
const pinataSDK = require('@pinata/sdk');
const moment = require('moment');
const axios = require('axios');

const { isAuthenticated } = require('../authMiddleware');
const { url } = require('inspector');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
const sampleImageFile = 'ipfs://QmWiru8V3r42RSK9A2b85uq63nqUBnsCnczLhbxbcK9DCM';
const ipfsPrefix = 'ipfs://';

let user_walletAddress = "";
let ipfsHash = "";
/** preview表示用（HTTPSプロトコル） */
let qrImgUrl = "";
/** NFTに埋め込む用（IPFSプロトコル） */
let qrImgForNft = "";

/* GET users listing. */
router.get('/', isAuthenticated, function (req, res, next) {
  // console.log(req.session);
  if (req.session.authenticated) {
    user_walletAddress = req.session.account;
    res.render('mintNft', {
      walletAddress: user_walletAddress,
      outputMsg: '',
    });
  }
});

router.post('/preview', async function (req, res, next) {
  let outputMsg = '';
  const bodyData = req.body;
  req.session.formData = bodyData;

  //get QR image from api
  console.log('\n#####start getting qrImg');
  //  const postUrl = "https://xqrnftdiffusion.onrender.com";
  /**開発用 */
  //const postUrl = "https://simple-positive-swine.ngrok-free.app";
  // const postUrl = "https://glowing-drake-finer.ngrok-free.app";

  /**本番 */
  const postUrl = "https://wallaby-more-pony.ngrok-free.app/";

  //接続チェック
  try {
    console.log('\n接続チェック');
    const check = await axios.get(postUrl + '/check');
    if (check.status !== 200) {
      throw new Error('Failed to connect to the AI API server.');
    }
    console.log('\ngetなげた');
  } catch (error) {
    return res.send({
      errorMsg: 'Failed to connect to the AI API server.'
    });
  }

  const postData = JSON.stringify({
    qrText: bodyData.qrText,
    imgPrompt: bodyData.imgPrompt,
    genMode: bodyData.genType == 1 ? 1 : 0 //1がreadable
  });

  const postOptions = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  try {
    const response = await axios.post(postUrl, postData, postOptions);
    if (response.data == '' || response.status !== 200) {
      throw new Error('Failed to generate the image due to excession of the limit.');
    }
    qrImgForNft = ipfsPrefix + response.data;
    qrImgUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + response.data.slice(7) + "?pinataGatewayToken=" + process.env.PINATA_GATEWAY_KEY;
    console.log('Response from API: ', qrImgUrl);
    res.send({ qrImgUrl: qrImgUrl });
  } catch (error) {
    console.error(`Problem with request: ${error.message}`);

    //開発用にエラー時もサンプル画像を返す
    // qrImgUrl ='https://ipfs.io/ipfs/' + sampleImageFile.slice(7);
    // res.send(qrImgUrl);

    return res.send({
      errorMsg: 'Failed to generate the image due to excession of the limit.'
    });
  }
});

router.post('/mint', async function (req, res, next) {


  let outputMsg = '';
  const bodyData = req.body;
  const sys_walletAddress = process.env.SYS_WALLET_ADDRESS;
  // console.log(bodyData);




  //可変プロパティの取得
  let properties = {};
  for (let i = 0; i < bodyData.propertyName.length; i++) {
    properties[bodyData.propertyName[i]] = bodyData.propertyValue[i];
  }


  const uploadJson = {
    "EventTitle": bodyData.eventTitle,
    "name": bodyData.eventTitle + bodyData.eventNo,
    "image": qrImgForNft,
    "description": bodyData.description,
    "date": moment().format('x'),
    "edition": "1",
    "NFTFlags": "Transferable",
    "creator": "Axrossroad.co.jp",
    "artists": "Axrossroad.co.jp",
    "attributes": properties
  };
  const options = {
    pinataMetadata: {
      name: bodyData.eventTitle,
    }
  };


  try {
    const pinResponse = await pinata.pinJSONToIPFS(uploadJson, options);
    if (pinResponse.data == '' || pinResponse.status !== 200) {
      throw new Error('An unknown error occurred');
    }
    // console.log(pinResponse);
    ipfsHash = pinResponse.IpfsHash;
    console.log("uploadJson" + ipfsPrefix + ipfsHash);
  } catch (error) {
    console.log(error);
    return res.send({
      errorMsg: 'An unknown error occurred'
    });
  }


  //create NFT
  console.log("\n######start minting nft");
  const net = process.env.TEST_NET;
  console.log("NET URL: ", net);


  const jsonUri = ipfsPrefix + ipfsHash;




  const system_wallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);
  const client = new xrpl.Client(net);
  outputMsg += '\nconnected to' + net;
  try {
    await client.connect();
  } catch (error) {
    res.send({ errorMsg: error.message });
  }


  const transationJson = {
    "TransactionType": "NFTokenMint",
    "Account": sys_walletAddress,
    "URI": xrpl.convertStringToHex(jsonUri),
    "Flags": 8,
    "TransferFee": bodyData.royalty * 1000, // x * 1000
    "NFTokenTaxon": bodyData.eventNo,
    "OtherData": {
      // "EventTitle": bodyData.eventTitle,//ここに書くとbithompのメタデータに反映されるし、画像も表示される。
      "name": bodyData.eventTitle,
      "description": bodyData.description,
      "image": qrImgUrl
    }
  }

  const tx = await client.submitAndWait(transationJson, { wallet: system_wallet });

  console.log(tx);
  const bitcompPrefix = 'https://test.bithomp.com/en/nft/';
  const nftoken_id = tx.result.meta.nftoken_id;
  outputMsg += '\nNFTを作成しました。以下のURLでもNFTを確認できます。';
  outputMsg += '\n' + bitcompPrefix + nftoken_id;

  //NFTokenCreateOfferの作成(売却オファー)
  const NFTokenCreateOfferJson = {
    "TransactionType": "NFTokenCreateOffer",
    "Account": sys_walletAddress,
    "NFTokenID": nftoken_id,
    "Amount": "0",
    "Flags": 1,
    "Destination": user_walletAddress
  };

  const sellOfferTx = await client.submitAndWait(NFTokenCreateOfferJson, { wallet: system_wallet });
  console.log("\n売却オファー\n" + sellOfferTx);

  client.disconnect();
  req.session.tab = 1;


  res.send(outputMsg);
});


module.exports = router;
