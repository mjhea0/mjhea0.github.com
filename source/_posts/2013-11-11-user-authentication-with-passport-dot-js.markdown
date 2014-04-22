---
layout: post
title: "User Authentication with Passport.js"
date: 2013-11-11 07:45
comments: true
categories: node
---

**Change Log**

1. *November 21st, 2013:* After a user registers, they are automatically logged in

<br>

In this post I'll demonstrate how to add user authentication to Node.js with Passport.js.

> If you're interested in social authentication, please check out [this](http://mherman.org/blog/2013/11/10/social-authentication-with-passport-dot-js/) blog post. 

## Contents

1. Setup
2. Edit app.js
3. Mongoose
4. Add routes
5. Test 
6. Edit index.jade
7. Add login.jade
8. Add register.jade
9. Test redux
10. Unit tests
11. Error handling
12. Conclusion

## Setup

#### Download the starter template

```sh
$ git clone https://github.com/mjhea0/node-bootstrap3-template.git passport-local
$ cd passport-local
$ npm install
```

#### Install MongoDB Globally

```sh
$ npm install -g mongodb
```

#### Start MongoDB

In a new terminal window, start the MongoDB daemon:

```sh
$ sudo mongod
```
#### Test locally

Return to your other terminal window and run:

```sh
$ node app
```
 
Navigate to [http://localhost:1337/](http://localhost:1337/)

#### Install additional dependencies:

```sh
$ npm install passport --save
$ npm install passport-local --save
$ npm install npm install jade --save
$ npm install npm install mongodb --save
$ npm install mongoose --save
$ npm install passport-local-mongoose --save
```

## Edit app.js 

#### Make sure your requirements look like this:

```javascript
var path = require('path');
var express = require('express');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
```

#### Update the rest of “app.js” with the following code (check the comments for a brief explanation):

```javascript
// main config
var app = express();
app.set('port', process.env.PORT || 1337);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose');

// routes
require('./routes')(app);

app.listen(app.get('port'), function(){
  console.log(("Express server listening on port " + app.get('port')))
});
```

## Mongoose

Let's get the database going ...

#### Add a new file called "account.js" to a new directory called "models" with the following code:

```javascript
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    nickname: String,
    birthdate: Date
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
```

## Add routes

#### Add a new file called "routes.js" to the root directory with the following code:

```javascript
var passport = require('passport');
var Account = require('./models/account');

module.exports = function (app) {
    
  app.get('/', function (req, res) {
      res.render('index', { user : req.user });
  });

  app.get('/register', function(req, res) {
      res.render('register', { });
  });

  app.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
          res.redirect('/');
        });
    });
  });

  app.get('/login', function(req, res) {
      res.render('login', { user : req.user });
  });

  app.post('/login', passport.authenticate('local'), function(req, res) {
      res.redirect('/');
  });

  app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });

  app.get('/ping', function(req, res){
      res.send("pong!", 200);
  });
  
};
```

## Test

Fire up the server. Make sure you do not get any errors. You should PUSH to git and/or Github now.

## Edit index.jade

#### Add the following urls/logic:

```jade
if (!user)
  a(href="/login") Login
  br
  a(href="/register") Register
if (user)
  p You are currently logged in as #{user.username}
  a(href="/logout") Logout
```

## Add login.jade

#### Add a new file called "login.jade" to the "views" folder with the following code:

```jade
doctype html
html
  head
    title= title
    meta(name='viewport', content='width=device-width, initial-scale=1.0')
    link(href='/css/bootstrap.min.css', rel='stylesheet', media='screen')
    script(src='http://code.jquery.com/jquery.js')
    script(src='js/bootstrap.min.js')
  body
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

## Add register.jade

#### Add a new file called "register.jade" to the "views" folder with the following code:

```javascript
doctype html
html
  head
    title= title
    meta(name='viewport', content='width=device-width, initial-scale=1.0')
    link(href='/css/bootstrap.min.css', rel='stylesheet', media='screen')
    script(src='http://code.jquery.com/jquery.js')
    script(src='js/bootstrap.min.js')
  body
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

## Test redux

Fire up the server and test! Register, then login. PUSH to git again.

![login](https://raw.github.com/mjhea0/passport-local/master/login.png)

## Unit tests

#### Install Mocha:

```sh
$ npm install mocha --save
$ npm install chai --save
$ npm install should --save
```

#### Update the `scripts` in "package.json"

```json
"scripts": {
"start": "node app.js",
"test": "make test"
},
```

#### Add a Makefile to the root and include the following code:

```
test:
    @./node_modules/.bin/mocha

.PHONY: test
```

> Take note of the spacing on the second line. This **must** be a tab or you will see an error.

#### Create a new folder called "test" in the root as well

#### Run `make test` from the command line. If all is setup correctly, you should see - `0 passing (1ms)`.

#### Create a new file called "test.user.js" with the following code and save the file in "test":

```javascript
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
   mongoose.connection.close()
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
      console.log("   username: ", account.username)
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
#### Run `make tests`. You should see that it passed- `1 passing (43ms)`.

## Error handling

Right now we have some poorly handled errors that are confusing for the end user. For example, try to register a name that already exists, or login with a username that doesn't exist. This can and should be handled better.

### Registration

First, update the `/register` route so an error is thrown, which gets sent to jade template, if a user tries to register a username that already exists:

```javascript
app.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
          return res.render("register", {info: "Sorry. That username already exists. Try again."});
        }

        passport.authenticate('local')(req, res, function () {
          res.redirect('/');
        });
    });
});
```

Then add the following code to the bottom of the "register.jade" template:

```jade
br
h4= info
```

Next, if you try to login with a username and password combo that does not exist, the user is redirected to a page with just the word "Unauthorized" on it. This is confusing and unhelpful. See if you can fix this on your own. Cheers!

## Conclusion

Simple, right? Grab the final code [here](https://github.com/mjhea0/passport-local).
