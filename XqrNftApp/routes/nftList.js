const express = require('express');
const router = express.Router();
const xrpl = require('xrpl');
const axios = require('axios'); // Ensure axios is required
require('dotenv').config();
const { log, error } = require('./logger');
const { isAuthenticated } = require('../authMiddleware');
const { XummSdk } = require('xumm-sdk');
const session = require('express-session');

const Sdk = new XummSdk(process.env.XUMM_APIKEY, process.env.XUMM_APISECRET);

// Fetch NFTs owned by an account
//router.get('/', async function (req, res, next) {
router.get('/',isAuthenticated, async function(req, res, next) {
  //const walletAddress = process.env.SYS_WALLET_ADDRESS;
  const walletAddress = req.session.account;
  const bithompUrl = process.env.BITHOMP_URL;
  const defaultTab = req.session.tab || 0;

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
    const sysNftsResponse = await client.request({
      method: 'account_nfts',
      account: process.env.SYS_WALLET_ADDRESS
    });

    const nfts = await Promise.all(nftsResponse.result.account_nfts.map(async nft => {
      let imageUrl = ''; // Initialize imageUrl
      let name = '';
      let offers ='';

      const uri = nft.URI ? Buffer.from(nft.URI, 'hex').toString() : null; // Decode URI from hex
      console.log("uri : ",uri);

      if (uri != null && uri !== "") {
          if (uri.startsWith('ipfs://')) {
            const ipfsjson = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + uri.slice(7);
            try {
              const response = await axios.get(ipfsjson);
              if (response.data) {
                name = response.data.name || 'Unnamed NFT';
                const url = response.data.image;
                if (url.startsWith('ipfs://')) {
                  imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7);
                } else if (url.startsWith('https://ipfs.io/ipfs/')) {
                  imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/" + url.slice(16);
                }
              }
            } catch (error) {
              name = uri;
            }

          }else if(uri.startsWith('ipfs.io/')){
            const ipfsjson = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7);

            try {
              const response = await axios.get(ipfsjson);
              if (response.data) {
                name = response.data.name || 'Unnamed NFT';
                const url = response.data.image;
                if (url.startsWith('ipfs://')) {
                  imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7);
                } else if (url.startsWith('https://ipfs.io/ipfs/')) {
                  imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/" + url.slice(16);
                }
              }
            } catch (error) {
              name = uri;
            }
          }
      }else if(uri.startsWith('https://')){
        const ipfsjson = uri;
        try {
          const response = await axios.get(ipfsjson);
          if (response.data) {
            name = response.data.name || 'Unnamed NFT';
            const url = response.data.image || response.data.QRImage;
            if (url.startsWith('ipfs://')) {
              imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7);
            } else if (url.startsWith('https://ipfs.io/ipfs/')) {
              imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/" + url.slice(16);
            }
          }
        } catch (error) {
          name = uri;
        }
      } else {
        name = "Unnamed NFT";
      }
      // Fetch sell offers for the NFT
      try {
        const offersResponse = await client.request({
          method: 'nft_sell_offers',
          nft_id: nft.NFTokenID
        });
        if (offersResponse.result.offers) {
          offers = offersResponse.result.offers.filter(offer => offer.owner === walletAddress);
        }else{
          offers ='';
        }
      } catch (offerError) {
        //console.error(`Error fetching offers for NFT ${nft.NFTokenID}:`, offerError);
      }

      return {
        id: nft.NFTokenID,
        name,
        uri: nft.URI || 'N/A', // Fallback URI if nft.URI is falsy
        imageUrl,
        offers
      };
    }));

    const Sysnfts = await Promise.all(sysNftsResponse.result.account_nfts.map(async nft => {
      let imageUrl = ''; // Initialize imageUrl
      let name = '';
      let offers = [];
      const uri = nft.URI ? Buffer.from(nft.URI, 'hex').toString() : null; // Decode URI from hex
      console.log("uri : ",uri);

      if (uri != null && uri !== "") {
          if (uri.startsWith('ipfs://')) {
            const ipfsjson = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + uri.slice(7);
            try {
              const response = await axios.get(ipfsjson);
              if (response.data) {
                name = response.data.name || 'Unnamed NFT';
                const url = response.data.image;
                if (url.startsWith('ipfs://')) {
                  imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7);
                } else if (url.startsWith('https://') || url.startsWith('http://')) {
                  imageUrl = url;
                }
              }
            } catch (error) {
              name = uri;
            }

          }else if(uri.startsWith('ipfs.io/')){
            const ipfsjson = "https://" + uri;

            try {
              const response = await axios.get(ipfsjson);
              if (response.data) {
                name = response.data.name || 'Unnamed NFT';
                const url = response.data.image;
                if (url.startsWith('ipfs://')) {
                  imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7);
                } else if (url.startsWith('https://') || url.startsWith('http://')) {
                  imageUrl = url;
                }
                else{
                  imageUrl = "https://" + url;
                }
              }
            } catch (error) {
              name = uri;
            }
          }
      }else if(uri.startsWith('https://')){
        const ipfsjson = uri;
        try {
          const response = await axios.get(ipfsjson);
          if (response.data) {
            name = response.data.name || 'Unnamed NFT';
            const url = response.data.image || response.data.QRImage;
            if (url.startsWith('ipfs://')) {
              imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7);
            } else if (url.startsWith('https://') || url.startsWith('http://')) {
              imageUrl = url;
            }
            else{
              imageUrl = "https://" + url;
            }
          }
        } catch (error) {
          name = uri;
        }
      } else {
        name = "Unnamed NFT";
      }
            // Fetch sell offers for the NFT
            try {
              const offersResponse = await client.request({
                method: 'nft_sell_offers',
                nft_id: nft.NFTokenID
              });
              if (offersResponse.result.offers) {
                offers = offersResponse.result.offers.filter(offer => offer.destination === walletAddress);
              }
            } catch (offerError) {
              //console.error(`Error fetching offers for NFT ${nft.NFTokenID}:`, offerError);
            }
            return{
              id: nft.NFTokenID,
              name,
              uri: nft.URI || 'N/A', // Fallback URI if nft.URI is falsy
              imageUrl,
              offers
            }
    }));

    // Sort nfts array by name
    nfts.sort((a, b) => a.name.localeCompare(b.name));

    client.disconnect();
    res.render('nftList', { nfts, walletAddress,bithompUrl,Sysnfts,defaultTab });

  } catch (error) {
    console.error('Error fetching NFTs:', error);
    res.status(500).json({ message: 'Error fetching NFTs', error });
  }
});

// Route to accept an offer
//router.post('/accept-offer', isAuthenticated, async function(req, res) {
router.post('/accept-offer', async function (req, res) {
  const { offerId } = req.body;

  // Validate offerId
  if (!offerId) {
    return res.status(400).json({ message: 'Offer ID is required' });
  }

  const walletAddress = req.session.account;

  // Ensure user is authenticated
  if (!walletAddress) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    // Create a payload for the Xumm app
    const payload = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: walletAddress,
      NFTokenSellOffer: offerId // Assuming NFTokenSellOffer is correct for your use case
    };

    const payloadResponse = await Sdk.payload.createAndSubscribe(payload, async (event) => {
      // This callback is called when the payload resolves (signed or rejected)
      if (event.data.signed === true) {
        res.json({ message: 'Offer accepted successfully', result: event.data });
      } else {
        res.status(400).json({ message: 'Offer acceptance declined' });
      }
    });

    // Send the QR code URL back to the client to be scanned by the Xumm app
    res.json({ payloadUrl: payloadResponse.created.refs.qr_png });

  } catch (error) {
    res.status(500).json({ message: 'Error accepting offer', error });
  }
});

router.post('/create-offer', async function (req, res) {
  const { nftId, price } = req.body;
  const walletAddress = req.session.account;

  if (!walletAddress) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const payload = {
      TransactionType: 'NFTokenCreateOffer',
      Account: walletAddress,
      NFTokenID: nftId,
      Amount: (price * 1000000).toString(), // Convert XRP to drops
      Flags: xrpl.NFTokenCreateOfferFlags.tfSellNFToken
    };

    const payloadResponse = await Sdk.payload.createAndSubscribe(payload, async (event) => {
      // This callback is called when the payload resolves (signed or rejected)
      if (event.data.signed === true) {
        res.json({ message: 'Offer accepted successfully', result: event.data });
      } else {
        res.status(400).json({ message: 'Offer acceptance declined' });
      }
    });

    // Send the QR code URL back to the client to be scanned by the Xumm app
    res.json({ payloadUrl: payloadResponse.created.refs.qr_png });

  } catch (error) {
    res.status(500).json({ message: 'Error accepting offer', error });
  }
});


module.exports = router;
