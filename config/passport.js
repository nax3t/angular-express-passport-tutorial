// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('../models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

	passport.use('local-login', new LocalStrategy(
	  function(username, password, done) {
	    User.findOne({
	      username: username.toLowerCase()
	    }, function(err, user) {
	      // if there are any errors, return the error before anything else
           if (err)
               return done(err);

           // if no user is found, return the message
           if (!user)
               return done(null, false);

           // if the user is found but the password is wrong
           if (!user.validPassword(password))
               return done(null, false); 

           // all is well, return successful user
           return done(null, user);
	    });
	  }
	));
};