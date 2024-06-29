const express = require('express');
const router = express.Router();

// Example route handler for nftList
router.get('/', async function(req, res, next) {
  const menuItems = [
    { label: 'Create NFT Tickets', action: 'navigate("/mintNft")' },
    { label: 'View Tickets', action: 'navigate("/nftList")' },
    { label: 'Find Events', action: 'navigate("")' },
    { label: 'About PhygitalifyQR', action: 'navigate("")' },
    { label: 'Policy', action: 'navigate("")' },
  ];

  // Render nftList.ejs with menuItems
  res.render('menu', { menuItems });
});

module.exports = router;
