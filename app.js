//Express
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

//Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
require('./config/passport')(passport); // pass passport for configuration

//Database
var mongoose = require('mongoose');
var db = require("./models");

//Cookie and session
var cookieParser = require('cookie-parser');
var session = require('express-session');
app.use(session({
  secret: 'this is the secret'
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

//Body-parser
var bodyParser = require('body-parser');
app.use(bodyParser.json()); //for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
}));

// routes ======================================================================
// require('./routes/auth.js')(app, passport); // load our routes and pass in our app and fully configured passport
// process the login form
app.post("/login", passport.authenticate('local-login'), function(req, res) {
  res.json(req.user);
});

// handle logout
app.post("/logout", function(req, res) {
  req.logOut();
  res.send(200);
})

// loggedin
app.get("/loggedin", function(req, res) {
  res.send(req.isAuthenticated() ? req.user : '0');
});

// signup
app.post("/signup", function(req, res) {
  db.User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (user) {
      res.json(null);
      return;
    } else {
    	console.log("Hello world", req.body)
      var newUser = new db.User();
      newUser.username = req.body.username;
      newUser.password = newUser.generateHash(req.body.password);
      newUser.roles = ['student'];
      newUser.save(function(err, user) {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }
          res.json(user);
        });
      });
    }
  });
});

app.listen(3000);