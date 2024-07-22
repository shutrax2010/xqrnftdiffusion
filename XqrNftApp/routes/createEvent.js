const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../authMiddleware');

// Example route handler for nftList
router.get('/',isAuthenticated, async function(req, res, next) {
  const menuItems = [
    { label: 'Kabuki Musical:\nKanjicho', action: 'navigate("/mintNft")', image:'../assets/login-background2.png' },
  ];

  // Render nftList.ejs with menuItems
  res.render('createEvent', { menuItems });
});

module.exports = router;
