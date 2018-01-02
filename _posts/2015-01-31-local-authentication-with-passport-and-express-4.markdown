---
layout: post
toc: true
title: "User Authentication with Passport and Express 4"
date: 2015-01-31 07:07
comments: true
toc: true
categories: [node, auth]
keywords: "node, express, passport, authentication"
description: "This article details how to add user authentication to Node/Express 4 with Passport.js"
---

This post demonstrates how to add user authentication to Node/Express with Passport.js.

> If you're interested in social authentication via Passport, please check out [this](http://mherman.org/blog/2015/09/26/social-authentication-in-node-dot-js-with-passport/) blog post. Looking for an Express 3 authentication tutorial? Check out this [post](http://mherman.org/blog/2013/11/11/user-authentication-with-passport-dot-js/).

Before you start, make sure you have [Node](http://nodejs.org/download/) installed for your specific operating system. This tutorial also uses the following tools/technologies:

- [Express](https://www.npmjs.com/package/express) v4.11.1
- [Mongoose](https://www.npmjs.com/package/mongoose) v4.4.1
- [Passport](https://www.npmjs.com/package/passport) v0.2.1
- [Passport-local](https://www.npmjs.com/package/passport-local): v1.0.0
- [Passport-local-mongoose](https://www.npmjs.com/package/passport-local-mongoose): v1.0.0

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Start by installing the Express generator, which we'll use to generate a basic project boilerplate:

``` sh
$ npm install -g express-generator@4
```

> The `-g` flag means that we're installing this globally, on our entire system.

Navigate to a convenient directory, like your "Desktop" or "Documents", then create your app:

``` sh
$ express passport-local-express4
```

Check out the project structure:

```
├── app.js
├── bin
│   └── www
├── package.json
├── public
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       └── style.css
├── routes
│   ├── index.js
│   └── users.js
└── views
    ├── error.jade
    ├── index.jade
    └── layout.jade
```

This took care of the heavy lifting, adding common files and functions associated with all apps.

### Install/Update Dependencies

Update the *package.json* file to reference the correct dependencies:

``` json
{
  "name": "passport-local-express4",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node ./bin/www"
  },
  "repository": {
    "type": "git",
    "url": "git@github.com:mjhea0/passport-local-express4.git"
  },
  "author": "Michael Herman <michael@mherman.org>",
  "license": "MIT",
  "dependencies": {
    "body-parser": "^1.10.2",
    "chai": "~1.8.1",
    "connect-flash": "^0.1.1",
    "cookie-parser": "^1.3.3",
    "debug": "^2.1.1",
    "express": "^4.11.1",
    "express-session": "^1.10.1",
    "jade": "^1.9.1",
    "mocha": "~1.14.0",
    "mongoose": "^4.4.1",
    "morgan": "^1.5.1",
    "passport": "^0.2.1",
    "passport-local": "^1.0.0",
    "passport-local-mongoose": "^1.0.0",
    "serve-favicon": "^2.2.0",
    "should": "~2.1.0"
  }
}
```

Now install the dependencies:

``` sh
$ cd express-local-express4
$ npm install
```

### Sanity Check

Let's test our setup by running the app:

``` sh
$ node ./bin/www
```

Navigate to [http://localhost:3000/](http://localhost:3000/) in your browser and you should see the "Welcome to Express" text staring back.

### Setup MongoDB

Install:

``` sh
$ npm install -g mongodb
```

Then, in a new terminal window, start the MongoDB daemon:

``` sh
$ sudo mongod
```

## Edit *app.js*

### Update the Requirements

Add the following requirements:

``` javascript
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
```

### Update *app.js*

Update all of *app.js* with the following code (check the comments for a brief explanation):

``` javascript
// dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose_express4');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
```

## Mongoose

Let's get the Mongoose up and running. Add a new file called *account.js* to a new directory called "models" with the following code:

``` javascript
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    password: String
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
```

You may be wondering about password security, specifically salting/hashing the password. Fortunately, the [passport-local-mongoose](https://github.com/saintedlama/passport-local-mongoose) package automatically takes care of salting and hashing the password for us. More on this further down.

### Sanity Check

Again, test the app:

``` sh
$ node ./bin/www
```

Make sure you still see the same "Welcome to Express" text.

## Add Routes

Within the "routes" folder, add the following code to the *index.js* file:

``` javascript
var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();


router.get('/', function (req, res) {
    res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

module.exports = router;
```

## Test

Fire up the server. Navigate to [http://localhost:3000/ping](http://localhost:3000/ping). Make sure you do not get any errors and that you see the word "pong!".

## Views

### *layout.jade*

Update:

```
doctype html
html
  head
    title= title
    meta(name='viewport', content='width=device-width, initial-scale=1.0')
    link(href='http://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css', rel='stylesheet', media='screen')
    link(rel='stylesheet', href='/stylesheets/style.css')
  body
    block content

  script(src='http://code.jquery.com/jquery.js')
  script(src='http://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js')
```

### *index.jade*

Update:

``` jade
extends layout

block content
  if (!user)
    a(href="/login") Login
    br
    a(href="/register") Register
  if (user)
    p You are currently logged in as #{user.username}
    a(href="/logout") Logout
```

### *login.jade*

Add a new file called *login.jade* to the views:

``` jade
extends layout

block content
  .container
    h1 Login Page
    p.lead Say something worthwhile here.
    br
    form(role='form', action="/login",method="post", style='max-width: 300px;')
      .form-group
          input.form-control(type='text', name="username", placeholder='Enter Username')
      .form-group
        input.form-control(type='password', name="password", placeholder='Password')
      button.btn.btn-default(type='submit') Submit
      &nbsp;
      a(href='/')
        button.btn.btn-primary(type="button") Cancel
```

### *register.jade*

Add another file called *register.jade* to the views:

``` javascript
extends layout

block content
  .container
    h1 Register Page
    p.lead Say something worthwhile here.
    br
    form(role='form', action="/register",method="post", style='max-width: 300px;')
      .form-group
          input.form-control(type='text', name="username", placeholder='Enter Username')
      .form-group
        input.form-control(type='password', name="password", placeholder='Password')
      button.btn.btn-default(type='submit') Submit
      &nbsp;
      a(href='/')
        button.btn.btn-primary(type="button") Cancel
```

## Test Redux

Fire up the server and test! Register, and then login.

Remember how I said that we'd look at salting and hashing a password again? Well, let's check our Mongo database to ensure that it's working.

When I tested the user registration, I used "michael" for both my username and password.

Let's see what this looks like in the database:

``` sh
$ mongo
MongoDB shell version: 2.4.6
connecting to: test
> use passport_local_mongoose_express4
switched to db passport_local_mongoose_express4
> db.accounts.find()
{ "salt" : "9ffd63f2bcce58bf79691cacfaae678f690dd73ef778445bf79f97c41934189b", "hash" : "17eabe62d459acdb4f3d8eaab7369a1e989c6150e231d1e87a7cf1c31dfc7eafc0616732a6db8f08c413dcbec06c95d512cef55503a1fe9a7ed5dc15ecf5cf67c114af5a659c79bb47039082a3af933e1c32dd2519b8be11596a775e1d262fd53437927e0fd948b76e738f342904a598e6c533445351c9b3d629aa118adfbe0646a80539e816c06248e353b1787dbd8c646a2ed018bbf5e58fb6a6cc1f32c6ea61b3e52230cfdf75a9f4b7ba20b3d3ae3b86f5816f5df9c48f9d1bb4a9c42e30bf646c3810d050847c1905e5a95f53c81078090e42ba58799187a61b047376def48fb640a4f48eca4c7f35610eafc2c770e61172b11c7e98c36281983de56414fa95e0708c9a6458a903baaf3818a3e4675b39418b358f51f45aca792e606f692e0a7d3667d111d00d0f521257d3486cbcff250dc7d9859ab80f9d56a3d272fb0ebb2e7dd969c0749361153c6bde62ad50b3d47233424034b959c78225db000cc1416aa0d555016f1b666d2da709e69c5030ee39753597a1d06ec0a4e001e22bff37947c1b993794d21667dc6c65e4116dd5ca216a161aa9026063e0b12e1165ffa5c827a6803df6765766cc55bcca122cd4d9f572353a988f90200ffc4a610d9eca83df01d6f30af78f9ec476fc974bc1d3a5fd2759a56486795bd7d993462a8d2f9b9c42d3197cd7b9855f17eaac4073a4d843d56b5c9a75b86cc1bb8b27ec", "username" : "michael", "_id" : ObjectId("54c7bbbfaf54064909921a36"), "__v" : 0 }
>
```

So, you can see that we have a document with five keys:

- `username` is as we expected - "michael"
- `_id` pertains to the unique id associated with that document.
- `__v` is the [version #](http://mongoosejs.com/docs/guide.html#versionKey) for that specific documents.
- Finally, instead of a password key we have both a salt and a hash key. For more on how these are generated, please refer to the [passport-local-mongoose](https://github.com/saintedlama/passport-local-mongoose#hash-algorithm) documentation.

## Unit/Integration tests

First, update the `scripts` object in *package.json*:

``` json
"scripts": {
  "start": "node ./bin/www",
  "test": "make test"
 },
```

Now add a Makefile to the root and include the following code:

```
test:
    @./node_modules/.bin/mocha

.PHONY: test
```

> Take note of the spacing on the second line. This **must** be a tab or you will see an error.

Create a new folder called "test", and then run `make test` from the command line. If all is well, you should see - `0 passing (1ms)`. Now we just need to add some tests...

### Add tests

Add a new file called *test.user.js* to the "test folder:

``` javascript
var should = require("should");
var mongoose = require('mongoose');
var Account = require("../models/account.js");
var db;

describe('Account', function() {

    before(function(done) {
        db = mongoose.connect('mongodb://localhost/test');
            done();
    });

    after(function(done) {
        mongoose.connection.close();
        done();
    });

    beforeEach(function(done) {
        var account = new Account({
            username: '12345',
            password: 'testy'
        });

        account.save(function(error) {
            if (error) console.log('error' + error.message);
            else console.log('no error');
            done();
        });
    });

    it('find a user by username', function(done) {
        Account.findOne({ username: '12345' }, function(err, account) {
            account.username.should.eql('12345');
            console.log("   username: ", account.username);
            done();
        });
    });

    afterEach(function(done) {
        Account.remove({}, function() {
            done();
        });
     });

});
```

Now run `make tests`. You should see that it passed - `1 passing (43ms)`.

## Error handling

Right now we have some poorly handled errors that are confusing to the end user. For example, try to register a name that already exists, or login with a username that doesn't exist. This can and *should* be handled better.

First, update the `/register` route so an error is thrown:

``` javascript
router.post('/register', function(req, res, next) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
          return res.render('register', { error : err.message });
        }

        passport.authenticate('local')(req, res, function () {
            req.session.save(function (err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        });
    });
});
```

Then add the following code to the *layout.jade* template, just below the `body` tag:

``` jade
if (error && error.length > 0)
  br
  h4.error-msg= error
  br
```

Test this out.

## Conclusion

That's it. Grab the code from the [repository](https://github.com/mjhea0/passport-local-express4). Cheers!
