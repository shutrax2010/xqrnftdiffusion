var express = require('express');
var router = express.Router();

const { isAuthenticated } = require('../authMiddleware');


router.get('/', isAuthenticated, function(req, res, next) {
    if (req.session.authenticated) {
        user_walletAddress = req.session.account;
        res.render('token');
    }
});

module.exports = router;