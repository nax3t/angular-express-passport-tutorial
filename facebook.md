# Add facebook auth to your app with passport

First thing we'll want to do is add a few more dependencies to our `package.json`

```
"dotenv": "^1.2.0",
"passport-facebook": "^2.0.0"
```

Be sure to run `npm install`

We'll use `passport-facebook` for our passport strategy configuration and `dotenv` to hide our API's secret key and client ID.

Now open up your backend's `app.js` file from your app's root directory and add the following after your `body-parser` code:

```js
//Load .env file
var dotenv = require('dotenv');
dotenv.load();
```

Now visit the [Facebook developer's portal](https://developers.facebook.com/) and where it says `My Apps` select `Add a New App` from the dropdown. Select `WWW` from the app options, enter a name for your app, click through and enter a category, click through again, scroll down to app configuration and enter your site url `http://localhost:3000/auth/facebook/callback`. 

Scroll to the bottom and select `skip to the developer dashboard`, this is where you'll get access to your Client ID and Secret Key.

Take that information and enter it into a `.env` file inside of your app's root directory. (First be sure to add `.env` to your `.gitignore` file)

```
FB_CLIENT_ID=123456789
FB_SECRET=a1b2c3d4e5f6g7h8j9k0
FB_CALLBACK_URL=http://localhost:3000/auth/facebook/callback
```

Replace everything after the `=` signs with your information, the FB_CALLBACK_URL should remain the same.

_Note: This should work fine, but if your app still won't recognize the ENV variables, try exporting them manually from the command line, e.g., open up your terminal and type: `export FB_CLIENT_ID=123456789` and do the same for your FB_SECRET and FB_CALLBACK_URL_

Now let's configure oath, create a file called `oath.js` inside of your `config` directory that lives inside of app's root directory. Add the following:

```js
module.exports = {
facebookAuth: {
   clientID: process.env.FB_CLIENT_ID,
   clientSecret: process.env.FB_SECRET,
   callbackURL: process.env.FB_CALLBACK_URL,
   enableProof: false
  }
}
```

Now we can modify our passport configuration file to add the facebook strategy.
Open `app_name -> config -> passport.js` and add the following below where you require local-strategy:

```js
var FacebookStrategy = require('passport-facebook').Strategy;
var configAuth       = require('./oauth');
```

Now add this to the bottom of your app before the closing `}` bracket from the `module.exports = function(passport) {`:

```js
// Facebook strategy
passport.use(new FacebookStrategy({

   // pull in our app id and secret from our auth.js file
   clientID        : configAuth.facebookAuth.clientID,
   clientSecret    : configAuth.facebookAuth.clientSecret,
   callbackURL     : configAuth.facebookAuth.callbackURL

},

// facebook will send back the token and profile
function(token, refreshToken, profile, done) {
   // asynchronous
   process.nextTick(function() {

       // find the user in the database based on their facebook id
       User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

           // if there is an error, stop everything and return that
           // ie an error connecting to the database
           if (err)
               return done(err);

           // if the user is found, then log them in
           if (user) {
               return done(null, user); // user found, return that user
           } else {
               // if there is no user found with that facebook id, create them
               var newUser            = new User();

               // set all of the facebook information in our user model
               newUser.facebook.id    = profile.id; // set the users facebook id                   
               newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
               newUser.facebook.name  = profile.displayName; // look at the passport user profile to see how names are returned

               // save our user to the database
               newUser.save(function(err) {
                   if (err)
                       throw err;

                   // if successful, return the new user
                   return done(null, newUser);
               });
           }

       });
   });

}));
```

Okay, the facebook-strategy is in place, but we need to update our user model to reflect the code in our passport configuration. Open up `app_name -> models -> user.js` and replace your user schema with:

```js
// define the schema for our user model
var userSchema = mongoose.Schema({
  username: String,
  password: String,
  email: String,
  firstName: String,
  lastName: String,
  facebook: {
    id: String,
    token: String,
    name: String
  }
});
```

We're almost done, now let's go add the backend routes that allow us to grant access from facebook and redirect to our app. Open up `app_name -> routes -> auth.js` and add the following code before the closing `};` bracket from `module.exports = function(app, passport) {`:

```js

// Facebook auth routes
app.get('/auth/facebook', function authenticateFacebook (req, res, next) {
  req.session.returnTo = '/#' + req.query.returnTo; 
  next ();
},
passport.authenticate ('facebook'));

app.get('/auth/facebook/callback', function (req, res, next) {
 var authenticator = passport.authenticate ('facebook', {
   successRedirect: req.session.returnTo,
   failureRedirect: '/'
  });

delete req.session.returnTo;
authenticator (req, res, next);
})
```

Let's add a facebook login button to both our `login` and `signup` pages (inside of `app_name -> public -> views`:

```html
<p>Login or Register with:</p>

<a href="/auth/facebook?returnTo={{'/profile'}}" class="btn btn-primary"><span class="fa fa-facebook"></span> Facebook</a>
```

You can see how the query string from the end of the anchor tag's href will allow us to redirect to a route being used by the angular router, thus bridging us from the backend routing to the front end.

One last thing, let's make sure the `profile` page will display the user's name when they log in with facebook.

Open up `app_name -> public -> views -> profile.html` and replace the code there with:

```html
<h1>Profile</h1>

<h3>User: {{ currentUser.username || currentUser.facebook.name }}</h3>
```

All done! Bear in mind this is a very basic implementation, if you're going to use this in production you'll want to add some error handling.

-------------------------
## Sources

- [Passport-facebook - Scotch.io](https://scotch.io/tutorials/easy-node-authentication-facebook)
- [Redirection issue](https://github.com/jaredhanson/passport-facebook/issues/106)

--------------------------

Shout out to Tim Garcia and Elie Schoppik for helping out!

