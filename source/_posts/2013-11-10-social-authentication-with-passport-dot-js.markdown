---
layout: post
toc: true
title: "Social Authentication with Passport.js"
date: 2013-11-10 08:28
comments: true
categories: node
---

**In this post we'll add social authentication - Facebook, Twitter, Github, Google, and Instagram - to Node.js.**

**Updates**:

- *November 27th, 2015* - Refactored and added Instagram Authentication

This post uses the following dependencies:

- chai v3.4.1
- express v3.3.4
- jade v0.34.1
- mocha v2.3.4
- mongodb v1.3.23
- mongoose v3.8.37
- passport v0.3.2
- passport-facebook v2.0.0
- passport-github2 v0.1.9
- passport-google-oauth2 v0.1.6
- passport-instagram v1.0.0
- passport-twitter v1.0.3
- should v7.1

## Setup

### Download the starter template

``` sh
$ git clone https://github.com/mjhea0/node-bootstrap3-template.git passport-examples
$ cd passport-examples
$ npm install
```

### Test locally

``` sh
$ node app
```

Navigate to [http://127.0.0.1:1337/](http://127.0.0.1:1337/)

### Install additional dependencies:

``` sh
$ npm install passport@0.3.2 --save
$ npm install passport-facebook@2.0.0 --save
$ npm install passport-github2@0.1.9 --save
$ npm install passport-google-oauth2@0.1.6 --save
$ npm install passport-instagram@1.0.0 --save
$ npm install passport-twitter@1.0.3 --save
$ npm install jade@0.34.1 mongodb@1.3.23 mongoose@3.8.37 --save
```

## Register OAuth

Register your application (or in this case a dummy application) with all of the OAuth providers you want to use. Each OAuth provider handles authentication differently and has names for their authentication keys, so make sure to read the documentation before setting up an application.

> In all cases use the following url for the callback URL - "http://127.0.0.1:1337/auth/[oauth_provider_name]/callback". Also, be sure to take note of the generated authentication keys.

### Facebook

- [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)

![fb](https://raw.github.com/mjhea0/passport-examples/master/public/img/facebook.png)

### Twitter

- [https://apps.twitter.com/](https://apps.twitter.com/)

![twitter](https://raw.github.com/mjhea0/passport-examples/master/public/img/twitter.png)

### Github

- [https://github.com/settings/developers](https://github.com/settings/developers)

![github](https://raw.github.com/mjhea0/passport-examples/master/public/img/github.png)

### Google

- [https://console.developers.google.com](https://console.developers.google.com)

![google](https://raw.github.com/mjhea0/passport-examples/master/public/img/google.png)

### Instagram

- [https://instagram.com/developer/](https://instagram.com/developer/)

![instagram](https://raw.github.com/mjhea0/passport-examples/master/public/img/instagram.png)

## Setup an Authentication File

Create a separate file in the root directory called *oauth.js* and add the following code:

``` javascript
var ids = {
  facebook: {
    clientID: 'get_your_own',
    clientSecret: 'get_your_own',
    callbackURL: 'http://127.0.0.1:1337/auth/facebook/callback'
  },
  twitter: {
    consumerKey: 'get_your_own',
    consumerSecret: 'get_your_own',
    callbackURL: "http://127.0.0.1:1337/auth/twitter/callback"
  },
  github: {
    clientID: 'get_your_own',
    clientSecret: 'get_your_own',
    callbackURL: "http://127.0.0.1:1337/auth/github/callback"
  },
  google: {
    clientID: 'get_your_own',
    clientSecret: 'get_your_own',
    callbackURL: 'http://127.0.0.1:1337/auth/google/callback'
  },
  instagram: {
    clientID: 'get_your_own',
    clientSecret: 'get_your_own',
    callbackURL: 'http://127.0.0.1:1337/auth/instagram/callback'
  }
};

module.exports = ids;
```

> Make sure to add this file to the *.gitignore* so when you push to Github, your keys are not included in the repo.

## Edit *app.js*

Add the following requirements:

``` javascript
var passport = require('passport');
var config = require('./oauth.js');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;
```

Update the rest of *app.js* with the following code (check the comments for a brief explanation):

``` javascript
// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// config
passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'my_precious' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// routes
app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){});
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// port
app.listen(1337);

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}
```

## Edit *index.jade*

Add the following URL:

``` jade
a(href="/auth/facebook") Login via Facebook
```

## Edit *account.jade*

Add a new file called *account.jade* to the "views" folder with the following code:

``` jade
!!! 5
html
  head
    title= title
    meta(name='viewport', content='width=device-width, initial-scale=1.0')
    link(href='/css/bootstrap.min.css', rel='stylesheet', media='screen')
  body
  .container
    h1 You are logged in.
    p.lead Say something worthwhile here.
    a(href="/") Go home
    br
    a(href="/ping") Ping
    br
    br
    a(href="/logout") Logout

  script(src='http://code.jquery.com/jquery.js')
  script(src='js/bootstrap.min.js')
```

## Test Facebook Auth

Fire up the server and test! You should be redirected to the `/account` page after authentication.

> Make sure to load [http://127.0.0.1:1337/](http://127.0.0.1:1337/) in your browser rather than [http://localhost:1337/](http://localhost:1337/).

## Add Remaining Social Providers

Add the remaining social providers, one by one, testing as you go, until your *app.js* file looks like this:

``` javascript
// dependencies
var fs = require('fs');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var config = require('./oauth.js');
var mongoose = require('mongoose');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;


// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// config
passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}
));
passport.use(new TwitterStrategy({
  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret,
  callbackURL: config.twitter.callbackURL
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}
));
passport.use(new GithubStrategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.github.callbackURL
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}
));
passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL,
  passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));
passport.use(new InstagramStrategy({
  clientID: config.instagram.clientID,
  clientSecret: config.instagram.clientSecret,
  callbackURL: config.instagram.callbackURL
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}
));

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'my_precious' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// routes
app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){});
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){});
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/github',
  passport.authenticate('github'),
  function(req, res){});
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/google',
  passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'
  ] }
));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/instagram',
  passport.authenticate('instagram'),
  function(req, res){});
app.get('/auth/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// port
app.listen(1337);

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = app;
```

> Don't worry - we will be cleaning up the code in a bit, breaking up *app.js* into several files. For now, we just want to ensure that authentication works.

## Update *index.jade*

``` jade
!!! 5
html
  head
    title= title
    meta(name='viewport', content='width=device-width, initial-scale=1.0')
    link(href='/css/bootstrap.min.css', rel='stylesheet', media='screen')
  body
  .container
    h1 Say something meaningful here.
    p.lead Say something worthwhile here.
    a(href="/") Go home
    br
    a(href="/ping") Ping
    br
    br
    a(href="/auth/facebook") Login via Facebook
    br
    a(href="/auth/twitter") Login via Twitter
    br
    a(href="/auth/github") Login via Github
    br
    a(href="/auth/google") Login via Google
    br
    a(href="/auth/instagram") Login via Instagram

  script(src='http://code.jquery.com/jquery.js')
  script(src='js/bootstrap.min.js')
```

**Test all providers again multiple times.**

## Mongoose

Now let's take it a step further and save the user in MongoDB via [Mongoose](http://mongoosejs.com/).

Add the following code just before the `config` section in *app.js*:

``` javascript
// connect to the database
mongoose.connect('mongodb://localhost/passport-example');

// create a user model
var User = mongoose.model('User', {
  oauthID: Number,
  name: String,
  created: Date
});
```

Update the `FacebookStrategy` so that it saves the user if s/he doesn't exist in the database:

``` javascript
passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));
```

Move the serialization/deserialization after the `config` section and update:

``` javascript
// serialize and deserialize
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user._id);
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    console.log(user);
      if(!err) done(null, user);
      else done(err, null);
    });
});
```

Update the `/account` route:

``` javascript
app.get('/account', ensureAuthenticated, function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if(err) {
      console.log(err);  // handle errors
    } else {
      res.render('account', { user: user});
    }
  });
});
```

## Test Redux

Fire up the server and make sure Facebook authentication is still working. Once logged in, open a mongo shell and ensure there is a new user in the database. Log in and log out several times with Facebook. Check the mongo shell again. There should still only be one user.

## Current Codebase

Update the remaining strategies so that users are saved in the database:

``` javascript
// dependencies
var fs = require('fs');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var config = require('./oauth.js');
var mongoose = require('mongoose');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;

// connect to the database
mongoose.connect('mongodb://localhost/passport-example');

// create a user model
var User = mongoose.model('User', {
  oauthID: Number,
  name: String,
  created: Date
});

// config
passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new TwitterStrategy({
  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret,
  callbackURL: config.twitter.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new GithubStrategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.github.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new InstagramStrategy({
  clientID: config.instagram.clientID,
  clientSecret: config.instagram.clientSecret,
  callbackURL: config.instagram.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'my_precious' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// serialize and deserialize
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user._id);
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    console.log(user);
      if(!err) done(null, user);
      else done(err, null);
    });
});

// routes
app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get('/account', ensureAuthenticated, function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if(err) {
      console.log(err);  // handle errors
    } else {
      res.render('account', { user: user});
    }
  });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){});
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){});
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/github',
  passport.authenticate('github'),
  function(req, res){});
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/google',
  passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'
  ] }
));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/instagram',
  passport.authenticate('instagram'),
  function(req, res){});
app.get('/auth/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// port
app.listen(1337);

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = app;
```

It's a mess. Let's clean it up, breaking apart concerns, and add in the remaining mongoose code.

## Code Cleanup

Create a separate file for your Mongoose schema called *users.js*:

``` javascript
var mongoose = require('mongoose');

// create a user model
var User = mongoose.model('User', {
  oauthID: Number,
  name: String,
  created: Date
});


module.exports = User;
```

> Make sure to add the file as a dependency in *app.js*: `var User = require('./user.js')`, and then remove the user model from *app.js* as well.

Now let's move the social config to a separate file called *authentication.js*:

``` javascript
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('./user.js');
var config = require('./oauth.js');

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('./user.js');
var config = require('./oauth.js');

module.exports = passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));
```

> Make sure to Then remove the `FacebookStrategy` from *app.js*.

#### Update the dependencies in *app.js*

``` javascript
// dependencies
var fs = require('fs');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var config = require('./oauth.js');
var User = require('./user.js');
var mongoose = require('mongoose');
var passport = require('passport');
var fbAuth = require('./authentication.js');
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;
```

Test again!

## Mongoose Redux

Move the remaining auth configs to *authentication.js* and add in the mongoose code to save the user:

``` javascript
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;
var User = require('./user.js');
var config = require('./oauth.js');

module.exports = passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new TwitterStrategy({
  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret,
  callbackURL: config.twitter.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new GithubStrategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.github.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

passport.use(new InstagramStrategy({
  clientID: config.instagram.clientID,
  clientSecret: config.instagram.clientSecret,
  callbackURL: config.instagram.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));
```

Your *app.js* file should now look like this:

``` javascript
// dependencies
var fs = require('fs');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var config = require('./oauth.js');
var User = require('./user.js');
var mongoose = require('mongoose');
var passport = require('passport');
var fbAuth = require('./authentication.js');
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var InstagramStrategy = require('passport-instagram').Strategy;

// connect to the database
mongoose.connect('mongodb://localhost/passport-example');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'my_precious' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// serialize and deserialize
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user._id);
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    console.log(user);
      if(!err) done(null, user);
      else done(err, null);
    });
});

// routes
app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get('/account', ensureAuthenticated, function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if(err) {
      console.log(err);  // handle errors
    } else {
      res.render('account', { user: user});
    }
  });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){});
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){});
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/github',
  passport.authenticate('github'),
  function(req, res){});
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/google',
  passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'
  ] }
));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/auth/instagram',
  passport.authenticate('instagram'),
  function(req, res){});
app.get('/auth/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// port
app.listen(1337);

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = app;

```

Continue to break apart *app.js* - i.e., moving your routes to a new file. Once done, test everything out again. Drop the database in mongo shell to ensure that new users are still added.

## Unit Tests

#### Install Mocha:

``` sh
$ npm install mocha@2.3.4 chai@3.4.1 should@7.1 --save
```

Update the `scripts` in *package.json*

``` json
"scripts": {
  "start": "node app.js",
  "test": "make test"
},
```

Add a *Makefile* to the root and include the following code:

```
test:
    @./node_modules/.bin/mocha

.PHONY: test
```

Create a new folder called "test", and then tun `make test` from the command line. If all is well, you should see - `0 passing (1ms)`.

Create a new file called *test.user.js* with the following code and save the file in "test":

``` javascript
var should = require('should');
var mongoose = require('mongoose');
var User = require('../user.js');
var db;

describe('User', function() {

  before(function(done) {
    db = mongoose.connect('mongodb://localhost/test');
    done();
  });

  after(function(done) {
    mongoose.connection.close();
    done();
  });

  beforeEach(function(done) {

    var user = new User({
      oauthID: 12345,
      name: 'testy',
      created: Date.now()
    });

    user.save(function(error) {
      if (error) console.log('error' + error.message);
      else console.log('no error');
      done();
    });

  });

  afterEach(function(done) {
    User.remove({}, function() {
      done();
    });
  });

  it('find a user by username', function(done) {
    User.findOne({ oauthID: 12345, name: "testy" }, function(err, user) {
      user.name.should.eql('testy');
      user.oauthID.should.eql(12345);
      console.log("   name: ", user.name);
      console.log("   oauthID: ", user.oauthID);
      done();
    });
  });

});
```

Run `make test` again. You should see that the test passed - `1 passing (47ms)`.

## Conclusion

Simple, right? Grab the final code [here](https://github.com/mjhea0/passport-examples).

![fb](https://raw.github.com/mjhea0/passport-examples/master/public/img/final.png)
