# Passport Authentication with Express and Angular
A quick source code tutorial for adding passport authentication to a MEAN stack app

First create an express app, you'll need the following node packages in your package.json:

```
  "dependencies": {
    "bcrypt-nodejs": "0.0.3",
    "body-parser": "^1.14.2",
    "cookie-parser": "^1.4.0",
    "express": "^4.13.3",
    "express-session": "^1.12.1",
    "mongoose": "^4.3.4",
    "morgan": "^1.6.1",
    "passport": "^0.3.2",
    "passport-local": "^1.0.0"
  }
```

Now structure your app as follows:

```
-- app_name
---- config
-------- passport.js
---- models
-------- index.js
-------- user.js
---- public
------ js
---------- app.js
---------- controllers.js
------ views
---------- home.html
---------- login.html
---------- profile.html
---------- signup.html
------ index.html
---- routes
-------- auth.js
---- .gitignore
---- app.js
---- package.json
```

Be sure to add `node_modules` to your .gitignore

Now let's handle our backend code:

in `app_name -> app.js` add the following code:

```js
//Express
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

//Passport
var passport = require('passport');
require('./config/passport')(passport); // pass passport for configuration

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
require('./routes/auth.js')(app, passport); // load our routes and pass in our app and fully configured passport


app.listen(3000);
```

In your `routes -> auth.js` add the following:

```js
var db = require("../models");

module.exports = function(app, passport) {
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
          var newUser = new db.User();
          newUser.username = req.body.username.toLowerCase();
          newUser.password = newUser.generateHash(req.body.password);
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
};
```

Now let's configure passport, we'll use the passport.js file to abstract some of the logic away from our main server file, thus modularizing and cleaning up our code a bit. Open up `config -> passport.js` and add the following:

```js
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
```

Now let's connect to our database and build out a schema for our user model. Open up `models -> index.js` and add the following: 

```js
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/passport-db");

mongoose.set("debug", true);

module.exports.User = require("./user");
```

now open up `models -> user.js` and add the code below:

```js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
  username: String,
  password: String
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
```

You can see where we've used bcrypt to generate a hash and validate passwords on signup and login, respectively.

That's it for the backend, now let's write our angular code and add some views.

Open `app_name -> public -> index.html` and copy over this code:

```html
<!DOCTYPE html>
<html lang="en" ng-app="PassportApp">
	<head>
		<meta charset="UTF-8">
		<title>Passport Angular</title>
		<!-- Latest compiled and minified CSS -->
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
	</head>
	<body>
		<nav ng-controller="NavCtrl">
		   <a href="#home">Home</a> |
		   <span ng-show="!currentUser">
		     <a href="#login">Login</a> |
		     <a href="#signup">Sign Up</a>
		   </span>
		   <span ng-show="currentUser">
		     <a href="#profile">Profile</a> |
		     <a href="#logout" ng-click="logout()">Logout</a>
		   </span>
		</nav>
		<div ng-view>
		</div>
		<!-- jQuery -->
		<script src="https://code.jquery.com/jquery-2.1.4.min.js" type="text/javascript"></script>
		<!-- Latest compiled and minified JavaScript -->
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
		<!-- Angular -->
		<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular.min.js"></script>
		<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular-route.js"></script>
		<script src="./js/app.js" type="text/javascript"></script>
		<script src="./js/controllers.js" type="text/javascript"></script>
	</body>
</html>
```

Great, now let's create out views. Copy the following code into each respective view template:

# Home

```html
<h1>Home</h1>
```

# Signup

```html
<h1>Sign Up</h1>

<p>
  <input ng-model="user.username"/></br>
  <input ng-model="user.password" type="password" /></br>
  <input ng-model="user.password2" type="password" /></br>
  <button ng-click="signup(user)">Sign Up</button>
</p>
```

# Login

```html
<h1>Login</h1>

<p>
  <input ng-model="user.username"/></br>
  <input ng-model="user.password" type="password"/></br>
  <button ng-click="login(user)">Login</button>
</p>
```

# Profile

```html
<h1>Profile</h1>

<h3>User: {{ currentUser.username }}</h3>
```

Alright we're almost there! Let's add our main angular logic to the `app.js` file inside of the `js` directory:

```js
var app = angular.module("PassportApp", ["ngRoute"]);

app.config(function($routeProvider) {
  $routeProvider
    .when('/home', {
      templateUrl: 'views/home.html'
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'LoginCtrl'
    })
    .when('/signup', {
      templateUrl: 'views/signup.html',
      controller: 'SignUpCtrl'
    })
    .when('/profile', {
      templateUrl: 'views/profile.html',
      resolve: {
        logincheck: checkLoggedin
      }
    })
    .otherwise({
      redirectTo: '/home'
    })
});

var checkLoggedin = function($q, $timeout, $http, $location, $rootScope) {
  var deferred = $q.defer();

  $http.get('/loggedin').success(function(user) {
    $rootScope.errorMessage = null;
    //User is Authenticated
    if (user !== '0') {
      $rootScope.currentUser = user;
      deferred.resolve();
    } else { //User is not Authenticated
      $rootScope.errorMessage = 'You need to log in.';
      deferred.reject();
      $location.url('/login');
    }
  });
  return deferred.promise;
}
```

And finally, put the following code into the `controllers.js` file, also living inside of the `js` folder:

```js
app.controller("NavCtrl", function($rootScope, $scope, $http, $location) {
  $scope.logout = function() {
    $http.post("/logout")
      .success(function() {
        $rootScope.currentUser = null;
        $location.url("/home");
      });
  }
});

app.controller("SignUpCtrl", function($scope, $http, $rootScope, $location) {
  $scope.signup = function(user) {

    if (user.password == user.password2) {
      $http.post('/signup', user)
        .success(function(user) {
          $rootScope.currentUser = user;
          $location.url("/profile");
        });
    }
  }
});

app.controller("LoginCtrl", function($location, $scope, $http, $rootScope) {
  $scope.login = function(user) {
    $http.post('/login', user)
      .success(function(response) {
        $rootScope.currentUser = response;
        $location.url("/profile");
      });
  }
});
```

That's it! Now fire up your server and give it a try, you should now have a working local authentication stratey in place. Don't forget to run `mongod` in a separate tab before starting your server.

# [Facebook strategy tutorial](./facebook.md)

-------------------------
## Sources

- [Express and Passport - Scotch.io](https://scotch.io/tutorials/easy-node-authentication-setup-and-local)
- [Angular, Express and Passport - YouTube tutorial](https://www.youtube.com/watch?v=jtaSRzP0i30&feature=youtu.be)
- [Source code from tutorial above](https://github.com/soaresdiogo/authenticatePassport)

--------------------------
