const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../authMiddleware');

// Example route handler for nftList
router.get('/', isAuthenticated, async function (req, res, next) {
  const menuItems = [
    { label: 'Kabuki Musical:\nKanjicho', action: '/mintNft', image: '../assets/login-background.png' },
    { label: 'J-League Match:\nUeno Pandas vs.\nAkihabara Electrics', action: '/mintNft', image: '../assets/login-background2.png' },
    { label: 'Summer Music\nFestival 2024', action: '/mintNft', image: '../assets/login-background3.png' },
    { label: 'Future Art Party', action: '/mintNft', image: '../assets/login-background4.png' },
  ];

  // Render nftList.ejs with menuItems
  res.render('eventList', { menuItems });
});

module.exports = router;
