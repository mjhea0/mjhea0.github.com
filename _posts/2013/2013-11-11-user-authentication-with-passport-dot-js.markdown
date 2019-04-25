---
layout: post
toc: true
title: "User Authentication with Passport.js"
date: 2013-11-11
comments: true
toc: true
categories: [node, auth]
redirect_from:
  - /blog/2013/11/11/user-authentication-with-passport-dot-js/
---

In this post I'll demonstrate how to add user authentication to Node.js with Passport.js.

> If you're interested in social authentication, please check out [this](http://mherman.org/blog/2013/11/10/social-authentication-with-passport-dot-js/) blog post.

**Updates:**

- *November 21st, 2013:* After a user registers, they are automatically logged in
- *May 15th, 2014:* Added info about salt and hashing passwords

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Setup

#### Download the starter template

``` sh
$ git clone https://github.com/mjhea0/node-bootstrap3-template.git passport-local
$ cd passport-local
$ npm install
```

#### Install MongoDB Globally

``` sh
$ npm install -g mongodb
```

#### Start MongoDB

In a new terminal window, start the MongoDB daemon:

``` sh
$ sudo mongod
```
#### Test locally

Return to your other terminal window and run:

``` sh
$ node app
```

Navigate to [http://localhost:1337/](http://localhost:1337/)

#### Install additional dependencies:

``` sh
$ npm install passport --save
$ npm install passport-local --save
$ npm install jade --save
$ npm install mongodb --save
$ npm install mongoose --save
$ npm install passport-local-mongoose --save
```

## Edit app.js

#### Make sure your requirements look like this:

``` javascript
var path = require('path');
var express = require('express');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
```

#### Update the rest of “app.js” with the following code (check the comments for a brief explanation):

``` javascript
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

``` javascript
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    password: String
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
```

You may be wondering about password security, specifically salting/hashing the password. Fortunately, the [passport-local-mongoose](https://github.com/saintedlama/passport-local-mongoose) package automatically takes care of salting and hashing the password. More on this further down.

## Add routes

#### Add a new file called "routes.js" to the root directory with the following code:

``` javascript
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

``` jade
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

``` jade
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

``` javascript
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

Remember how I said that we'd look at salting and hashing a password again? Well, let's check our Mongo database to ensure that it's working.

When I tested the user registration, I used "Michael" for both my username and password.

Let's see what this looks like in the database:

``` sh
$ mongo
MongoDB shell version: 2.4.6
connecting to: test
> use passport_local_mongoose
switched to db passport_local_mongoose
> db.accounts.find()
{ "salt" : "2c0804ac9e1e7238eec9b110261ebaa78735252f17b795a1c8c65bb54e111838", "hash" : "801806d559e871ca3ae8ae12ede04035b17c3005f98ccc85368679c22de175d76d5d13dfb0fb076bd124c7d67961c50a5ec649638bc5baa1e3a29385000777624465287afac61cf57c10ee897baec378bdf31e087fd7e1b158e799e6e94316b7db0ebac5014034801d71e680dd5b9813b3f1b688018dd03daf1350dc9549bc6829ccc7e4fe00d4eca752c1bff8afab08d598f29e7bab475dd093d0e6d1694c2671172d1d23e8b0ddfdaaea1a940509d496fed6c0a2921b51aa351b7c73bf30ec66cfc0c3fb396646e92902d831d6f58f362aae9e609bdc2b20502eb73331b2e94fbb698359519dde3566538c4b471ffb45bf623d9de647199b0045e63a06c2205e02f0d500d13d3a1e2564690d7e82f4e26339c4be0c60f69057d93a6d20e12591b33104bba7c884c3f5379c52aed55a4f9b2a392d2c5ae6f9d8e2f3b1f233b99d4ebb41190aa4123c3e42baf9516cb9d586934f39e2dc742b8b0d731e00fad955951e40ecc933c1e27b432761c76a915aea4c3026003c472d78c184f9d0b45be59030740ccd9cf037a23c439bb60eccae5ae4de954779ddfdff17852d7fded26f886568d5c21250fde2ee679532bbb8c38c32aab29b3796455839ebeb9e913dc21a717c24e30caf4354c4be46de53a6c2254c5b11548654ba24411a422e669170084b6a31c23593ff627f165430933b60bde1019bbbaa148c275d7ed5dbe89d", "username" : "michael", "_id" : ObjectId("537554b8a1fbed4845000001"), "__v" : 0 }
>
```

So, you can see that we have a document with five keys:

- Username is as we expected.
- _id pertains to the unique id associated with that document.
- __v is the [version #](http://mongoosejs.com/docs/guide.html#versionKey) for that specific documents.
- Finally, instead of a password key we have both a salt and a hash key. For more on how these are generated, please refer to the [passport-local-mongoose](https://github.com/saintedlama/passport-local-mongoose#hash-algorithm) documentation.

## Unit tests

#### Install Mocha:

``` sh
$ npm install mocha --save
$ npm install chai --save
$ npm install should --save
```

#### Update the `scripts` in "package.json"

``` json
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

``` javascript
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

``` jade
br
h4= info
```

Next, if you try to login with a username and password combo that does not exist, the user is redirected to a page with just the word "Unauthorized" on it. This is confusing and unhelpful. See if you can fix this on your own. Cheers!

## Conclusion

Simple, right? Grab the final code [here](https://github.com/mjhea0/passport-local).
