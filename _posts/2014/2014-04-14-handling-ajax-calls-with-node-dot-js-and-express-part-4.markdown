---
layout: post
toc: true
title: "Handling AJAX Calls With Node.js and Express (part 4)"
date: 2014-04-14
last_modified_at: 2014-04-14
comments: true
toc: true
categories: node
redirect_from:
  - /blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-4/
---

Articles in the series:

- Part 1: [Scraping Craigslist](http://mherman.org/blog/2013/10/20/handling-ajax-calls-with-node-dot-js-and-express-scraping-craigslist/)
- Part 2: [Adding Handlebars](http://mherman.org/blog/2013/11/01/handling-ajax-calls-with-node-dot-js-and-express-part-2/)
- Part 3: [User Authentication with Passport and MongoDB](http://mherman.org/blog/2013/12/21/handling-ajax-calls-with-node-dot-js-and-express-part-3/)
- Part 4: [Refactoring, Adding styles](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-4/) **<< CURRENT**
- Part 5: [Saving Jobs](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-5)

If you've been following along with this series, you should have a basic application for searching and scraping Craigslist for jobs in San Francisco. The end goal is to have an application that users can login to, then search for jobs. From there the end user can either apply for jobs or save jobs they may be interested in.

Before adding any additional functionality, we need to refactor the code a bit by moving some code out of *app.js* and into separate modules so that the entire app is more modular.

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Configuration

First, move the config settings into a separate file, outside the main project. It's always a good idea to separate configuration from actual code so that other users who wish to use your project can easily make it their own by quickly adding their own configuration.

Create a *config.js* file and add the following code:

``` javascript
module.exports = {
  google: {
    returnURL: 'http://127.0.0.1:3000/auth/google/callback',
    realm: 'http://127.0.0.1:3000'
  },
  mongoUrl: 'mongodb://localhost/craigslist'
};
```

Then make sure to include the file as part of *app.js*'s dependencies:

``` javascript
var config = require('./config');
```

Finally, update these two areas within *app.js*:

``` javascript
// connect to the database
mongoose.connect(config.mongoUrl);
```

And:

``` javascript
passport.use(new GoogleStrategy({
  returnURL: config.google.returnURL,
  realm: config.google.realm
},
```

## User Model

Next, update the user schema for mongoose.

Create a new folder called "models" and add a file called *user.js* to hold the user schema:

``` javascript
var mongoose = require('mongoose');
var config = require('../config');

console.log(config);

// create a user model
var userSchema = new mongoose.Schema({
  name: String,
  email: {type: String, lowercase: true }
});

module.exports = mongoose.model('User', userSchema);
```

Add this to the dependencies:

``` javascript
var user = require('./models/user');
```

Then update *app.js*:

``` javascript
// passport settings
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user.id)
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  user.findOne({_id : id}, function(err, user) {
    console.log(user)
    if(!err) done(null, user);
    else done(err, null)
  });
});

passport.use(new GoogleStrategy({
  returnURL: config.google.returnURL,
  realm: config.google.realm
},
  function(identifier, profile, done) {
    console.log(profile.emails[0].value)
    process.nextTick(function() {
      var query = user.findOne({'email': profile.emails[0].value});
      query.exec(function(err, oldUser) {
        if(oldUser) {
          console.log("Found registered user: " + oldUser.name + " is logged in!");
          done(null, oldUser);
        } else {
          var newUser = new user();
          newUser.name = profile.displayName;
          newUser.email = profile.emails[0].value;
          console.log(newUser);
          newUser.save(function(err){
            if(err){
              throw err;
            }
            console.log("New user, " + newUser.name + ", was created");
            done(null, newUser);
          });
        }
      });
    });
  }
));
```

The Passport code searches the database to see if a user already exists before creating a new one - which is no different from last time. However, see if you can dig a bit deeper and see the subtle differences.

## Routes

Next, move the main routing into a separate module by adding the following code to *routes/index.js*:

``` javascript
var request = require('request');

exports.index = function(req, res){
  res.render('index', { user: req.user });
};

exports.search = function(req, res) {
  res.render('search', { user: req.user.name });
};

exports.searching = function(req, res){
  // input value from search
  var val = req.query.search;
  // url used to search yql
  var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20craigslist.search" +
  "%20where%20location%3D%22sfbay%22%20and%20type%3D%22jjj%22%20and%20query%3D%22" + val + "%22&format=" +
  "json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

  requests(url,function(data){
    res.send(data);
  });
};

function requests(url, callback) {
  // request module is used to process the yql url and return the results in JSON format
  request(url, function(err, resp, body) {
    var resultsArray = [];
    body = JSON.parse(body);
    // console.log(body.query.results.RDF.item)
    // logic used to compare search results with the input from user
    if (!body.query.results.RDF.item) {
      results = "No results found. Try again.";
      callback(results);
    } else {
      results = body.query.results.RDF.item;
      for (var i = 0; i < results.length; i++) {
        resultsArray.push(
          {title:results[i].title[0], about:results[i]["about"], desc:results[i]["description"]}
        );
      };
    };
    // pass back the results to client side
    callback(resultsArray);
  });
};
```

Again, add the dependency: `var routes = require('./routes');`

The routes section in *app.js* should now look like this:

``` javascript
// user routes
app.get('/', routes.index);
app.get('/search', ensureAuthenticated, routes.search);
app.get('/searching', ensureAuthenticated, routes.searching);
app.get('/logout', function(req, res){
  req.logOut();
  res.redirect('/');
});

// auth routes
app.get('/auth/google',
  passport.authenticate('google'),
  function(req, res){
});
app.get('/auth/google/callback',
passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/search');
  }
);

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}
```

## Passport

Now, move the main authentication code to a separate file.

Create a new file called *authentication.js* and add the following code:

``` javascript
// authentication

var passport = require('passport')
var GoogleStrategy = require('passport-google').Strategy;
var config = require('./config');
var user = require('./models/user');

// passport settings
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user.id)
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  user.findOne({_id : id}, function(err, user) {
    console.log(user)
    if(!err) done(null, user);
    else done(err, null)
  });
});

passport.use(new GoogleStrategy({
  returnURL: config.google.returnURL,
  realm: config.google.realm
},
  function(identifier, profile, done) {
    console.log(profile.emails[0].value)
    process.nextTick(function() {
      var query = user.findOne({'email': profile.emails[0].value});
      query.exec(function(err, oldUser) {
        if(oldUser) {
          console.log("Found registered user: " + oldUser.name + " is logged in!");
          done(null, oldUser);
        } else {
          var newUser = new user();
          newUser.name = profile.displayName;
          newUser.email = profile.emails[0].value;
          console.log(newUser);
          newUser.save(function(err){
            if(err){
              throw err;
            }
            console.log("New user, " + newUser.name + ", was created");
            done(null, newUser);
          });
        }
      });
    });
  }
));

module.exports = passport;
```

Then back in *app.js*, make sure to import that module back in by adding it as a dependency:

``` javascript
var passport = require('./authentication');
```

Fire up the server, and test your app out. If it all went well, everything should still work properly.

Finally, let's update the styles.

## Styles

First, add in a [Bootstrap](http://getbootstrap.com/) stylesheet to the *layout.jade* file:

``` html
link(rel='stylesheet', href='//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css')
```

### index.jade

``` html
extends layout

block content
    h1 Search Login
    .lead Please login to search
    br
    form(METHOD="LINK", ACTION="/auth/google")
        input(type="submit", value="Login with Google", class='btn btn-large btn-primary')

    script(src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js")
    script(src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.0.0/handlebars.min.js")
    script(src="/javascripts/main.js")
```

### search.jade

``` html
extends layout

block content
    h1 Search SF Jobs
    .lead Welcome, #{user}
    form(METHOD="LINK", ACTION="logout")
        input(type="submit", value="Logout", class='btn btn-sm btn-primary')
    br
    br
    input#search(type="search", placeholder="search...")
    br
    br
    ul#results
    include template.html

    script(src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js")
    script(src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.0.0/handlebars.min.js")
    script(src="/javascripts/main.js")
```

Wait? How did we capture the user's name? Go back and look at the `/searching` route.

Looks a little better. :)

![part-4](https://raw.githubusercontent.com/mjhea0/node-express-ajax-craigslist/master/img/part4.png)

Alright, next time we'll expand the app's functionality to allow users to save jobs they may be interested in applying to at a later date. Until then, check out the latest code [here](https://github.com/mjhea0/node-express-ajax-craigslist). Cheers!
