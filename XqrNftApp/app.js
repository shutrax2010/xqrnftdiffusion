var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const crypto = require('crypto');

// Generate a secure secret key
const secretKey = crypto.randomBytes(64).toString('hex');

const session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/mintNft');
var nftListRouter = require('./routes/nftList');
var menuRouter = require('./routes/menu');
var creditTokenRouter = require('./routes/token');
var eventListRouter = require('./routes/eventList');

var app = express();

//nftshop
app.use(express.static(path.join(__dirname, '../NftShop')));

// Redirect from /mockNftShopHome.html to /nftshophome
app.get('/mockNftShopHome.html', (req, res) => {
  res.redirect('/nftshophome');
});
app.get('/mockNftShop.html', (req, res) => {
  res.redirect('/nftshop');
});
app.get('/mockNftView.html', (req, res) => {
  res.redirect('/nftview');
});

app.get('/nftshophome', (req, res) => {
  res.sendFile(path.join(__dirname, '../NftShop/view/mockNftShopHome.html'));
});
app.get('/nftshop', (req, res) => {
  res.sendFile(path.join(__dirname, '../NftShop/view/mockNftShop.html'));
});
app.get('/nftview', (req, res) => {
  res.sendFile(path.join(__dirname, '../NftShop/view/mockNftView.html'));
});
app.get('/common/header.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../NftShop/view/common/header.html'));
});
app.get('/common/footer.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../NftShop/view/common/footer.html'));
});
//nftshop

//for authenticate
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 //Session expire after 1 hour
  }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/mintnft', usersRouter);
app.use('/nftList', nftListRouter);
app.use('/menu', menuRouter);
app.use('/token', creditTokenRouter);
app.use('/eventList', eventListRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
