const express = require('express');
const router = express.Router();

// Example route handler for nftList
router.get('/', async function(req, res, next) {
  const menuItems = [
    { label: 'Home', action: 'navigate("/")' },
    { label: 'NFT List', action: 'navigate("/nftList")' },
    { label: 'Mint Nft', action: 'navigate("/mintNft")' },
    // Add more menu items as needed
  ];

  // Render nftList.ejs with menuItems
  res.render('menu', { menuItems });
});

module.exports = router;
