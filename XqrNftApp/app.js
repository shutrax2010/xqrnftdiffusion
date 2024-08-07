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
var nftShopHomeRouter = require('./routes/nftShopHome');
var nftShopRouter = require('./routes/nftShop');
var nftViewRouter = require('./routes/nftView');

var app = express();

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
app.use('/nftShopHome', nftShopHomeRouter);
app.use('/nftShop', nftShopRouter);
app.use('/nftView', nftViewRouter);

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
