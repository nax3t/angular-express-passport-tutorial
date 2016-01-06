//Express
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

//Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

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

passport.use(new LocalStrategy(
  function(username, password, done) {
    //Consultando o usuário
    db.User.findOne({
      username: username,
      password: password
    }, function(err, user) {
      if (user) {
        return done(null, user);
      }
      return done(null, false, {
        message: 'Unable to login'
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

//Foi acrescentado a autenticação
app.post("/login", passport.authenticate('local'), function(req, res) {
  //console.log("/login");
  //console.log(req.user);
  res.json(req.user);
});

//Criando o logout
app.post("/logout", function(req, res) {
  req.logOut();
  res.send(200);
})


//Criando o loggedin
app.get("/loggedin", function(req, res) {
  res.send(req.isAuthenticated() ? req.user : '0');
});

//Criando o registro do usuário
app.post("/signup", function(req, res) {
  db.User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (user) {
      res.json(null);
      return;
    } else {
      var newUser = new db.User(req.body);
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
  //var newUser = req.body;
  //console.log(newUser);
});

//Function para não deixar ver o json de usuarios acessando pela URL
var auth = function(req, res, next) {
  if (!req.isAuthenticated())
    res.send(401);
  else
    next();
}

//Listar usuarios somente se for role admin
app.get("/rest/user", auth, function(req, res) {
  db.User.find(function(err, users) {
    res.json(users);
  });
})

app.listen(3000);