const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../authMiddleware');

// Example route handler for nftList
router.get('/',isAuthenticated, async function(req, res, next) {
  const menuItems = [
    { label: 'Get Credit Tokens', action: 'navigate("/token")' },
    { label: 'Create NFT Tickets', action: 'navigate("/createEvent")' },
    { label: 'View Tickets', action: 'navigate("/nftList")' },
    { label: 'Find Events', action: 'navigate("")' },
    { label: 'About PhygitalifyQR', action: 'navigate("")' },
    { label: 'Policy', action: 'navigate("")' },
  ];

  // Render nftList.ejs with menuItems
  res.render('menu', { menuItems });
});

module.exports = router;
