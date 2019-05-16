---
layout: post
toc: true
title: "Handling AJAX Calls With Node.js and Express (part 3)"
date: 2013-12-21
last_modified_at: 2013-12-21
comments: true
toc: true
categories: node
redirect_from:
  - /blog/2013/12/21/handling-ajax-calls-with-node-dot-js-and-express-part-3/
---

Here is an index of all the articles in the series that have been published to date:

- Part 1: [Scraping Craigslist](http://mherman.org/blog/2013/10/20/handling-ajax-calls-with-node-dot-js-and-express-scraping-craigslist/)
- Part 2: [Adding Handlebars](http://mherman.org/blog/2013/11/01/handling-ajax-calls-with-node-dot-js-and-express-part-2/)
- Part 3: [User Authentication with Passport and MongoDB](http://mherman.org/blog/2013/12/21/handling-ajax-calls-with-node-dot-js-and-express-part-3/) **<< CURRENT**
- Part 4: [Refactoring, Adding styles](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-4/)
- Part 5: [Saving Jobs](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-5)


Right now we have a working application, with simple functionality: enter a search keyword, scrape Craigslist, append search results to the DOM via Handlebars:

![main](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/ruby-search-results.png)

Let's pause for a minute and think about the end goal of this application. We want users to be able to search, save, and apply for jobs. We'll discuss this in greater detail in the next post, but for now, let's go ahead and add user authentication via Passport as well as MongoDB.

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Setup

Open your terminal, navigate to your project's root directory, and then install the following packages:

```
$ npm install passport --save
$ npm install passport-google --save
$ npm install mongodb --save
$ npm install mongoose --save
```

Once installed, require the dependencies in "app.js":

``` javascript
var mongoose = require('mongoose')
var passport = require('passport')
var GoogleStrategy = require('passport-google').Strategy;
```

Finally, open a new terminal window, install mongoDB globally, then run the mongo daemon:

```
$ npm install mongodb
$ mongod
```

## Update app.js

Add the following code, just below the development config section:

``` javascript
// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// config
passport.use(new GoogleStrategy({
  returnURL: 'http://127.0.0.1:3000/auth/google/callback',
  realm: 'http://127.0.0.1:3000'
},
function(identifier, profile, done) {
  process.nextTick(function () {
    profile.identifier = identifier;
    return done(null, profile);
  });
 }
));

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}
```

Here we are handling the login and authentication via Google.

Next, update the routes:

``` javascript
// routes
app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/search', ensureAuthenticated, function(req, res){
  res.render('search', { user: req.user });
});

app.get('/searching', function(req, res){
	// input value from search
	var val = req.query.search;
	// url used to search yql
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20craigslist.search" +
	"%20where%20location%3D%22sfbay%22%20and%20type%3D%22jjj%22%20and%20query%3D%22" + val + "%22&format=" +
	"json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

	requests(url,function(data){
		res.send(data);
	});
});

app.get('/auth/google',
  passport.authenticate('google'),
  function(req, res){
});
app.get('/auth/google/callback',
passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/search');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
```

Go through this code slowly to make sure you understand at a high-level what's going on. Comment if you have questions.

Then update the middleware to handle sessions and passport initialization:

``` javascript
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'my_precious' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
```

## Update the Jade files

Since we now have several more routes, let's get our views straightened out.

First, rename "index.jade" to "search.jade" since the searching actually happens on a different route. Update the code to include a logout option:

``` html
extends layout

block content
  h1 search sf jobs
  a(href='/logout') Logout
  br
  br
  input#search(type="search", placeholder="Search Craig's Jobs")
  ul#results
  include template.html

script(src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js")
script(src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.0.0/handlebars.min.js")
script(src="/javascripts/main.js")
```

Next, go ahead and add a new "index.jade" file:

``` html
extends layout

block content
  h1 search login
  .lead please login to search
  br
  a(href='/auth/google') Login with Google

script(src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js")
script(src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.0.0/handlebars.min.js")
script(src="/javascripts/main.js")
```

Before we add Mongo, fire up the server and test everything. If you run into an error, be sure to double check your code with my code from this blog post or the repository (link below).

## MongoDB

Add/update the following code in "app.js":

``` javascript
// connect to the database
mongoose.connect('mongodb://localhost/craigslist');

// create a user model
var User = mongoose.model('User', {
  oauthID: Number
});

// serialize and deserialize
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user._id)
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    console.log(user)
    if(!err) done(null, user);
    else done(err, null)
  })
});

// config
passport.use(new GoogleStrategy({
	returnURL: 'http://127.0.0.1:3000/auth/google/callback',
 	realm: 'http://127.0.0.1:3000'
},
function(accessToken, refreshToken, profile, done) {
User.findOne({ oauthID: profile.id }, function(err, user) {
 if(err) { console.log(err); }
 if (!err && user != null) {
   done(null, user);
 } else {
   var user = new User({
     oauthID: profile.id,
     created: Date.now()
   });
   user.save(function(err) {
     if(err) {
       console.log(err);
     } else {
       console.log("saving user ...");
       done(null, user);
     };
   });
 };
});
}
));
```

## Test again

Fire up the server, then login.

Next, open a new terminal window and type the following commands:

```
$ mongo
MongoDB shell version: 2.4.6
connecting to: test
> use craigslist;
switched to db craigslist
> show collections;
system.indexes
users
> db.users.find({})
{ "_id" : ObjectId("52b5f9ad3aaf9ef010000001"), "__v" : 0 }
>
```

Here we connected to the Mongo database, `craigslist`, then searched the collection and found the created user. You should see the same thing if all went well.

## Conclusion

Grab the final code from the repo found [here](https://github.com/mjhea0/node-express-ajax-craigslist). Ask questions. <3 Next time we'll be taking a step back to create user stories and reorganize our codebase. Perhaps we'll even get to some testing!
