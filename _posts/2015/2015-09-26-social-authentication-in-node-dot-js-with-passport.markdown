---
layout: post
toc: true
title: "Social Authentication in Node.js with Passport"
date: 2015-09-26
comments: true
toc: true
categories: [node, auth]
keywords: "node, express, passport, authentication, social auth"
description: "Let's look at how to set up Social Authentication with Passport."
redirect_from:
  - /blog/2015/09/26/social-authentication-in-node-dot-js-with-passport/
---

[Passport](https://github.com/jaredhanson/passport) is a library that provides a mechanism for easily setting up an authentication/registration system with support for [several frameworks and auth providers](https://github.com/jaredhanson/passport#strategies). In this tutorial, we’ll demonstrate in detail how to integrate this library into a Node.JS/Express 4 application to provide user authentication through LinkedIn, Github, and Twitter using OAuth 2.0.

<div style="text-align:center;">
  <img src="/assets/img/blog/passport-social-auth.png" style="max-width: 100%; border:0;" alt="passport social auth">
</div>

We will be using:

  - NodeJS v[4.1.1](https://nodejs.org/docs/v4.1.1/api/all.html)
  - ExpressJS v[4.13.1](http://expressjs.com/4x/api.html)
  - Mongoose v[4.1.8](http://mongoosejs.com/docs/guide.html)
  - Passport Strategies:
      - passport: v[0.3.0](https://github.com/jaredhanson/passport)
      - passport-linkedin: v[1.0.0](https://github.com/jaredhanson/passport-linkedin)
      - passport-github2: v[0.1.9](https://github.com/cfsghost/passport-github)
      - passport-twitter: v[1.0.3](https://github.com/jaredhanson/passport-twitter)

> For all dependencies, please view the *package.json* file in the [repo](https://github.com/mjhea0/passport-social-auth).

{% if page.toc %}
{% include contents.html %}
{% endif %}

## OAuth 2.0?

[OAuth 2.0](http://oauth.net/2/) is the successor of the OAuth protocol ([open standard for authorization](https://en.wikipedia.org/wiki/OAuth)), which enables third-party applications, such as the one we'll be building, access to an HTTP service without having to share secure credentials.

## Project Setup

Let's get started!

### Boilerplate

Start by downloading the project structure from the [Github repo](https://github.com/mjhea0/passport-social-auth/releases/tag/v1).

You should have:

``` sh
├── client
│   └── public
│       ├── css
│       │   └── main.css
│       └── js
│           └── main.js
├── package.json
└── server
    ├── app.js
    ├── bin
    │   └── www
    ├── routes
    │   └── index.js
    └── views
        ├── error.html
        ├── index.html
        └── layout.html
```

## Passport

Install Passport as well as the specific [Passport Strategies](https://github.com/jaredhanson/passport#search-all-strategies):

``` sh
$ npm install passport@0.3.0 --save
$ npm install passport-github2@0.1.9 passport-linkedin@1.0.0 passport-twitter@1.0.3 --save
```

Create an "auth" directory in the "server" and add the following files:

``` sh
└── auth
  ├── github.js
  ├── linkedin.js
  └── twitter.js
```

Add the Passport dependency to *app.js*:

``` javascript
var passport = require('passport');
```

Install the [express session](https://github.com/expressjs/session) middleware:

``` sh
$ npm install express-session@1.11.3 --save
```

And add it as a dependency:

``` javascript
var session = require('express-session');
```

Then add the required middleware:

``` javascript
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
```

### Configuration

Add a *_config.js* file to the "server" and add the following:

``` javascript
var ids = {
  github: {
    clientID: 'get_your_own',
    clientSecret: 'get_your_own',
    callbackURL: "http://127.0.0.1:3000/auth/github/callback"
  },
  linkedin: {
    clientID: 'get_your_own',
    clientSecret: 'get_your_own',
    callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback"
  },
  twitter: {
    consumerKey: 'get_your_own',
    consumerSecret: 'get_your_own',
    callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
  }
};

module.exports = ids;
```

Make sure to add this file to your *.gitignore* since this will contain sensitive info.

### MongoDB and Mongoose

Install [Mongoose](http://mongoosejs.com/):

``` sh
$ npm install mongoose@4.1.8 --save
```

Require the dependency in *app.js*:

``` javascript
var mongoose = require('mongoose');
```

Then establish the connection to MongoDB within *app.js*:

``` javascript
// *** mongoose *** //
mongoose.connect('mongodb://localhost/passport-social-auth');
```

Add a Mongoose Schema to a new file called *user.js* in a new folder, within "server", called "models":

``` javascript
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create User Schema
var User = new Schema({
  name: String,
  someID: String
});


module.exports = mongoose.model('users', User);
```

### Serialize and Deserialize

Passport needs to serialize and deserialize user instances from a session store to support login sessions. To add this functionality, create an *init.js* file within the "auth" directory, and then add the following code:

``` javascript
var passport = require('passport');
var User = require('../models/user');


module.exports = function() {

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

};
```

### Routes and Views

Before we test, add the following route-

``` javascript
router.get('/login', function(req, res, next) {
  res.send('Go back and register!');
});
```

-and update the *index.html* file:

{% raw %}
``` html
{% extends 'layout.html' %}

{% block title %}{% endblock %}


{% block content %}

  <div class="container">

    <h1>{{ title }}</h1>
    <p>Welcome! Please Login.</p>
    <hr><br>
    <a href="/auth/linkedin" class="btn btn-default">LinkedIn</a>
    <a href="/auth/github" class="btn btn-default">Github</a>
    <a href="/auth/twitter" class="btn btn-default">Twitter</a>

  </div>

{% endblock %}
```
{% endraw %}

### Sanity Check

Test this code to make sure all is well:

``` sh
$ npm start
```

Once done, kill the server, and then commit your code and push to Github.

> Need the updated code? Grab it [here](https://github.com/mjhea0/passport-social-auth/releases/tag/v2).

## LinkedIn Auth

> [https://github.com/jaredhanson/passport-linkedin](https://github.com/jaredhanson/passport-linkedin)

For almost all of the strategies, you will need to-

1. Create an app through the auth provider
1. Update the config file with the required IDs and keys as well as a callback URL
1. Configure the Passport strategy
1. Add the required routes
1. Update the view

### Create an App

Navigate to [LinkedIn Developers](https://www.linkedin.com/developer/apps/) to register a new application. Just enter dummy info, make sure to add the callback - [http://127.0.0.1:3000/auth/linkedin/callback](http://127.0.0.1:3000/auth/linkedin/callback) - and update the config within the app:

``` javascript
linkedin: {
 clientID: 'ADD YOUR ID HERE',
 clientSecret: 'ADD YOUR SECRET HERE',
 callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback"
},
```

### Configure Strategy

> [https://github.com/jaredhanson/passport-linkedin#usage](https://github.com/jaredhanson/passport-linkedin#usage)

Add the following code to *linkedin.js*:

``` javascript
var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin');

var User = require('../models/user');
var config = require('../_config');
var init = require('./init');

passport.use(new LinkedInStrategy({
    consumerKey: config.linkedin.clientID,
    consumerSecret: config.linkedin.clientSecret,
    callbackURL: config.linkedin.callbackURL
  },
  // linkedin sends back the tokens and progile info
  function(token, tokenSecret, profile, done) {

    var searchQuery = {
      name: profile.displayName
    };

    var updates = {
      name: profile.displayName,
      someID: profile.id
    };

    var options = {
      upsert: true
    };

    // update the user if s/he exists or add a new user
    User.findOneAndUpdate(searchQuery, updates, options, function(err, user) {
      if(err) {
        return done(err);
      } else {
        return done(null, user);
      }
    });
  }

));

// serialize user into the session
init();


module.exports = passport;
```

Aside for the Passport magic, you can see that we're either updating the user, if the user is found, or creating a new user, if a user is not found.

### Add Routes

> [https://github.com/jaredhanson/passport-linkedin#authenticate-requests](https://github.com/jaredhanson/passport-linkedin#authenticate-requests)

Update the routes with:

``` javascript
router.get('/auth/linkedin', passportLinkedIn.authenticate('linkedin'));

router.get('/auth/linkedin/callback',
  passportLinkedIn.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
```

Add in the dependency as well:

``` javascript
var passportLinkedIn = require('../auth/linkedin');
```

### Sanity Check

Test this out. *Be sure to use [http://127.0.0.1:3000/](http://127.0.0.1:3000/) rather than [http://localhost:3000/](http://localhost:3000/).*

Now, let's just duplicate that workflow for the remaining providers...

## Github Auth

> [https://github.com/cfsghost/passport-github](https://github.com/cfsghost/passport-github)

### Create an App

Again, create an app, adding in the correct callback URL, and add the given client ID and Secret Key to the *_config.js* file.

### Configure Strategy

> [https://github.com/cfsghost/passport-github#configure-strategy](https://github.com/cfsghost/passport-github#configure-strategy)

``` javascript
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

var User = require('../models/user');
var config = require('../_config');
var init = require('./init');


passport.use(new GitHubStrategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.github.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {

    var searchQuery = {
      name: profile.displayName
    };

    var updates = {
      name: profile.displayName,
      someID: profile.id
    };

    var options = {
      upsert: true
    };

    // update the user if s/he exists or add a new user
    User.findOneAndUpdate(searchQuery, updates, options, function(err, user) {
      if(err) {
        return done(err);
      } else {
        return done(null, user);
      }
    });
  }

));

// serialize user into the session
init();


module.exports = passport;
```

### Add Routes

> [https://github.com/cfsghost/passport-github#authenticate-requests](https://github.com/cfsghost/passport-github#authenticate-requests)

``` javascript
var passportGithub = require('../auth/github');

router.get('/auth/github', passportGithub.authenticate('github', { scope: [ 'user:email' ] }));

router.get('/auth/github/callback',
  passportGithub.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
```

## Twitter Auth

> [https://github.com/jaredhanson/passport-twitter](https://github.com/jaredhanson/passport-twitter)

### Create an App

Create an app on the [Twitter Developer page](https://apps.twitter.com/), and grab the Consumer Key and Secret.

### Configure Strategy

> [https://github.com/jaredhanson/passport-twitter#configure-strategy](https://github.com/jaredhanson/passport-twitter#configure-strategy)

``` javascript
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var User = require('../models/user');
var config = require('../_config');
var init = require('./init');

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: config.twitter.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {

    var searchQuery = {
      name: profile.displayName
    };

    var updates = {
      name: profile.displayName,
      someID: profile.id
    };

    var options = {
      upsert: true
    };

    // update the user if s/he exists or add a new user
    User.findOneAndUpdate(searchQuery, updates, options, function(err, user) {
      if(err) {
        return done(err);
      } else {
        return done(null, user);
      }
    });
  }

));

// serialize user into the session
init();


module.exports = passport;
```

### Add Routes

> [https://github.com/jaredhanson/passport-twitter#authenticate-requests](https://github.com/jaredhanson/passport-twitter#authenticate-requests)

``` javascript
var passportTwitter = require('../auth/twitter');

router.get('/auth/twitter', passportTwitter.authenticate('twitter'));

router.get('/auth/twitter/callback',
  passportTwitter.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
```

## Conclusion

Try adding some additional [strategies](https://github.com/jaredhanson/passport#strategies), comment below if you have questions, and grab the final code from the [repo](https://github.com/mjhea0/passport-social-auth).

Thanks for reading!
