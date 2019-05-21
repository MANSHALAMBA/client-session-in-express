var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('client-sessions');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dashboard = require('./routes/dashboard');

var app = express();

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var dbo;
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  dbo=db.db("clientsessionexpress");
});

// view engine setup
var swig=require('swig');
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  cookieName: 'session',
  secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: true,
  ephemeral: true
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);




app.post('/login', function(req, res) {
  dbo.collection("users").findOne({ email: req.body.email }, function(err, user) {
    if (!user) {
      res.send("Invalid email.");
    } else {
      if (req.body.password === user.password) {
        console.log("/login"+req.session.user);
        req.session.user = user;
        res.redirect('/dashboard');
        console.log("/login after redirection"+req.session.user.email);
        
      } else {
        res.send("Invalid password.");
      }
    }
  });
});

app.get('/dashboard', function(req, res) {
  if (req.session && req.session.user) { // Check if session exists
    // lookup the user in the DB by pulling their email from the session
    console.log("/dashboard"+req.session.user.email);
    dbo.collection("users").findOne({ email: req.session.user.email }, function (err, user) {
      if (!user) {
        // if the user isn't found in the DB, reset the session info and
        // redirect the user to the login page
        req.session.reset();
        res.redirect('/login');
      } else {
        
 
        // render the dashboard page
        res.render('dashboard', {
          message:"hello"+user.email,
         });  
      }
    });
  } else {
    res.redirect('/login');
  }                     
});

app.post('/logout', function(req, res) {
  console.log("/logout"+req.session.user.email);
  req.session.reset();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
