const express = require('express');
const router = express.Router();
const xrpl = require('xrpl');
const axios = require('axios'); // Ensure axios is required
require('dotenv').config();
const { log, error } = require('./logger');
const { isAuthenticated } = require('../authMiddleware');

// Fetch NFTs owned by an account
router.get('/', async function(req, res, next) {
  const walletAddress = process.env.SYS_WALLET_ADDRESS;

  if (!walletAddress) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
  try {
    await client.connect();
    const nftsResponse = await client.request({
      method: 'account_nfts',
      account: walletAddress
    });

    const nfts = await Promise.all(nftsResponse.result.account_nfts.map(async nft => {
      let imageUrl = ''; // Initialize imageUrl
      let name = '';
      let offers = []; // Array to store offers

      const uri = nft.URI ? Buffer.from(nft.URI, 'hex').toString() : null; // Decode URI from hex

      if (uri != null && uri !== "") {
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          try {
            const response = await axios.get(uri);
            if (response.data && response.data.QRImage) {
              log("response.data : ", response.data);
              name = response.data.NFTName || 'Unnamed NFT';
              const url = response.data.QRImage;
              imageUrl = "https://ipfs.io/ipfs/" + url.slice(7);
              console.log("Generated Image URL:", imageUrl); // Log imageUrl for verification
            }
          } catch (error) {
            console.error(`Error fetching metadata for NFT ${nft.NFTokenID}:`, error);
            name = uri; // Use URI as the name if fetching metadata fails
          }
        } else {
          name = uri; // Use URI as the name if it does not start with http or https
        }
      } else {
        name = 'Unnamed NFT'; // Fallback to 'Unnamed NFT' if URI is null
      }

      // Fetch buy offers for the NFT
      try {
        const offersResponse = await client.request({
          method: 'nft_buy_offers',
          nft_id: nft.NFTokenID
        });
        if (offersResponse.result.offers) {
          offers = offersResponse.result.offers;
          log("offers : ",offers);
        }
      } catch (offerError) {
        console.error(`Error fetching offers for NFT ${nft.NFTokenID}:`, offerError);
      }

      return {
        id: nft.NFTokenID,
        name,
        uri: nft.URI || 'N/A', // Fallback URI if nft.URI is falsy
        imageUrl,
        offers
      };
    }));

    client.disconnect();
    res.render('nftList', { nfts, walletAddress });

  } catch (error) {
    console.error('Error fetching NFTs:', error);
    res.status(500).json({ message: 'Error fetching NFTs', error });
  }
});

// Route to accept an offer
router.post('/accept-offer', isAuthenticated, async function(req, res) {
  console.log('Accept Offer endpoint accessed');
  const { offerId } = req.body;

  // Validate offerId
  if (!offerId) {
    return res.status(400).json({ message: 'Offer ID is required' });
  }

  const walletAddress = process.env.SYS_WALLET_ADDRESS;
  const walletSecret = process.env.SYS_WALLET_SEED;

  // Ensure user is authenticated
  if (!walletAddress || !walletSecret) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
  try {
    await client.connect();

    const wallet = xrpl.Wallet.fromSeed(walletSecret);
    const transaction = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: walletAddress,
      NFTokenBuyOffer: offerId // Assuming NFTokenBuyOffer is correct for your use case
    };

    const prepared = await client.autofill(transaction);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    client.disconnect();

    res.json({ message: 'Offer accepted successfully', result });

  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ message: 'Error accepting offer', error });
  }
});


module.exports = router;
