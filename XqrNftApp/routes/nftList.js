const express = require('express');
const router = express.Router();
const xrpl = require('xrpl');
const axios = require('axios');
require('dotenv').config();
const { log, error } = require('./logger');
const { isAuthenticated } = require('../authMiddleware');

// Fetch NFTs owned by an account
//router.get('/',isAuthenticated , async function(req, res, next) {
router.get('/', async function(req, res, next) {
  //const walletAddress = req.session.account;
  const walletAddress = process.env.SYS_WALLET_ADDRESS;

  if (!walletAddress) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  //const client = new xrpl.Client(req.session.uri);
  const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
  try {
    await client.connect();
    const nftsResponse = await client.request({
      method: 'account_nfts',
      account: walletAddress
    });
    client.disconnect();

    const nfts = await Promise.all(nftsResponse.result.account_nfts.map(async nft => {
      log('nftsResponse.result.account_nfts : ',nftsResponse.result.account_nfts);
      let imageUrl = ''; // Initialize imageUrl
      let name = '';

      const uri = nft.URI ? Buffer.from(nft.URI, 'hex').toString() : 'N/A';
      
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        try {
          const response = await axios.get(uri);
          if (response.data && response.data.QRImage) {
            log("response.data : ",response.data);
            name = response.data.NFTName|| 'Unnamed NFT';
            url = response.data.QRImage;
            imageUrl = "https://ipfs.io/ipfs/" + url.slice(7);
            console.log("Image URL:", imageUrl); // Log imageUrl for verification
          }
        } catch (error) {
          console.error(`Error fetching metadata for NFT ${nft.NFTokenID}:`, error);
        }
      }

      return {
        id: nft.NFTokenID,
        name,
        uri,
        imageUrl,
        flags: nft.Flags
      };
    }));

    res.render('nftList', { nfts, walletAddress });

  } catch (error) {
    console.error('Error fetching NFTs:', error);
    res.status(500).json({ message: 'Error fetching NFTs', error });
  }
});

module.exports = router;
