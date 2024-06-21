const express = require('express');
const router = express.Router();
const xrpl = require('xrpl');
const axios = require('axios');
const { isAuthenticated } = require('../authMiddleware');

// Fetch NFTs owned by an account
router.get('/',isAuthenticated , async function(req, res, next) {
  const walletAddress = req.session.account;

  if (!walletAddress) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const client = new xrpl.Client(req.session.uri);
  try {
    await client.connect();
    const nftsResponse = await client.request({
      method: 'account_nfts',
      account: walletAddress
    });
    client.disconnect();

    const nfts = await Promise.all(nftsResponse.result.account_nfts.map(async nft => {
      let imageUrl = ''; // Initialize imageUrl

      const uri = nft.URI ? Buffer.from(nft.URI, 'hex').toString() : 'N/A';
      
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        try {
          const response = await axios.get(uri);
          if (response.data && response.data.QRImage) {
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
