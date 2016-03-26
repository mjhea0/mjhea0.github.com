---
layout: post
toc: true
title: "Node, Express, Swig, and MongoDB - getting started with CRUD"
date: 2015-08-24 08:11
comments: true
categories: node

keywords: "node, express, mongodb, mongoose, swig"
description: "This article details how to create a basic web app with Node, Express, Swig, and MongoDB."
---

**Let's create a basic CRUD app using Node, Express, Swig, and MongoDB.**

<div style="text-align:center;">
  <img src="/images/node-express.png" style="max-width: 100%; border:0;" alt="mean stack authentication">
</div>

<br>

> This tutorial utilizes [Node](http://nodejs.org/) v0.12.5, [Express](http://expressjs.com/) v4.13.1, [Swig](http://paularmstrong.github.io/swig/) and [Mongoose](http://mongoosejs.com/) v4.1.3.

## Getting started

Start by downloading the [Express application generator](http://expressjs.com/starter/generator.html) (if you don't already have it) to create a basic Express project:

```sh
$ npm install express-generator -g
```

> The `-g` flag indicates that you want to install the package globally, on your entire system.

Navigate to a convenient directory, like your "Desktop" or "Documents", then create the boilerplate:

```sh
$ express node-express-swig-mongo
$ cd node-express-swig-mongo
```

Check out the project structure:

```sh
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

Don't worry about the files and folders for now. Just know that we have created a boilerplate that can be used for a number of Node/Express applications. This took care of the heavy lifting, adding common files, folders, and scripts generally associated with all apps.

Notice the *package.json* file. This stores your project's dependencies, which we still need to install:

```sh
$ npm install
```

Now let's install Mongoose and Swig:

```sh
$ npm install mongoose swig --save
```

> The `--save` flag adds the dependencies and their versions to the *package.json* file. Take a look.

## Sanity check

Let's test our setup by running the app:

```sh
$ npm start
```

Navigate to [http://localhost:3000/](http://localhost:3000/) in your browser and you should see the "Welcome to Express" text. Once done, kill the server by pressing CTRL-C.

## Nodemon

Before moving on, let's setup [Nodemon](http://nodemon.io/) so that you can run your app and watch for code changes without having to manually restart the server. Check out the link above to learn more.

```sh
$ npm install nodemon -g
```

Let's test again:

```sh
$ nodemon
```

In your terminal you should see:

```sh
23 Aug 16:31:02 - [nodemon] v1.4.1
23 Aug 16:31:02 - [nodemon] to restart at any time, enter `rs`
23 Aug 16:31:02 - [nodemon] watching: *.*
23 Aug 16:31:02 - [nodemon] starting `node ./bin/www`
```

Essentially, Nodemon is watching for code changes, and if they do occur, then it will refresh the local server for you so you don't have to constantly kill the server then start it back up. It saves a lot of time and keystrokes.

Awesome. With the setup done, let's build something!

## Routes

Grab your favorite text editor (such as [Sublime](http://www.sublimetext.com/) or [Atom](https://atom.io/)), and then open the main file, *app.js*, which houses much of the business logic. Take a look at the routes:

```javascript
app.use('/', routes);
app.use('/users', users);
```

Understanding how routes work as well as how to trace all the files associated with an individual route is an important skill to learn. You'll be able to approach most applications and understand how they work just by starting with the routes.

Let's look at this route:

```javascript
app.use('/users', users)
```

Here, we know that this route is associated with the `/users` endpoint. What's an endpoint? Simply navigate to [http://localhost:3000/users](http://localhost:3000/users).

The end user navigates to that endpoint and expects *something* to happen. That could mean some HTML is rendered or perhaps JSON is returned. That's not important at this point. For now, let's look at how Node handles the logic for "handling routes".

Also, within that route, you can see the variable `users`. Where is in this file? It's at the top, and it loads in another file within our app:

```javascript
var users = require('./routes/users');
```

Open that file:

```javascript
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

module.exports = router;
```

**What's happening here?** Essentially when that endpoint is hit, it responds by sending text in the form of a response to the end user - "respond with a resource". Now, of course you don't always have to send text. You could respond with a template or view like a Jade or Swig template file that gets rendered into HTML. We'll look at how this works in just a minute when we add our own routes.

**Make sure you understand everything in this section before moving on.**

### Add a new route

Let's now add a new route that renders a HTML form to the end user.

Start by adding the route handler in the *app.js* file:

```javascript
app.use('/api', api);
```

> Remember this simply means `app.use('/ENDPOINT', VARIABLE_NAME);`,

Use the `api` variable to require a JS file within our routes folder.

```javascript
var api = require('./routes/api');
```

Take a look in the terminal. You should see an error, indicating Node can't find the `./routes/api` module. We need to create it!

Create a new file called *api.js* in the "routes" directory. Add the following code:

```javascript
var express = require('express');
var router = express.Router();


router.get('/superheros', function(req, res) {
  res.send('Just a test');
});

module.exports = router;
```

> Do you remember what this code `res.send('Just a test');` will do? If not, review the previous section.

Navigate to [http://localhost:3000/api/superheros](http://localhost:3000/api/superheros). You should see the text "Just a test" on the page.

## Swig

Swig is a templating language, which compiles down to HTML, making it easy to separate logic from markup. For more on Swig, check out the [Primer on Swig Templating](http://mherman.org/blog/2015/08/23/primer-on-swig-templating/#.VdpL_VNViko).

Take a quick look at the *layout.jade*, *index.jade*, and *error.jade* files within the "views" folder. Right now these files are using [Jade](http://jade-lang.com/) templating. Let's update these files to remove Jade and add Swig. First, remove the *.jade* extension from each file and add a *.html* extension. Now we can update the actual syntax...

***layout.html***

{% raw %}
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{{ title }}</title>
    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
    <link rel="stylesheet" href="/css/main.css">
  </head>
  <body>
    {% block content %}
    {% endblock %}
    <script type="text/javascript" src="//code.jquery.com/jquery-2.1.4.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="/js/main.js"></script>
  </body>
</html>
```
{% endraw %}

***index.html***

{% raw %}
```html
{% extends 'layout.html' %}

{% block title %}{% endblock %}


{% block content %}

  <div class="container">

    <h1>{{ title }}</h1>
    <p>Welcome to {{ title }}</p>

  </div>

{% endblock %}
```
{% endraw %}

***error.html***

{% raw %}
```html
{% extends 'layout.html' %}

{% block title %}{% endblock %}


{% block content %}

  <div class="container">

    <h1>{{ message }}</h1>
    <h2>{{ error.status }}</h2>
    <pre>{{ error.stack }}</pre>

  </div>

{% endblock %}
```
{% endraw %}

Finally, update *app.js* by requiring the following dependency at the top of the file:

```javascript
var swig = require('swig');
```

Then set Swig as the template engine by replacing `app.set('view engine', 'jade');` with-

```javascript
var swig = new swig.Swig();
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
```

Jump back to the "views", and take a look at *layout.html* and *index.html*. There's a relationship between those two files. We define the base structure in the *layout* file, which contains common structure that can be reused in multiple places.

Do you see the `block` keyword?

What really happens when the *index* file is rendered is that it first renders the base template because of the `extends` keyword. So, the *layout* template then gets rendered, which eventually pulls in the child template, overwriting the `block` keyword with:

{% raw %}
```html
<div class="container">

  <h1>{{ title }}</h1>
  <p>Welcome to {{ title }}</p>

</div>
```
{% endraw %}

Hope that makes sense. If not, check out [this](http://mherman.org/blog/2015/08/23/primer-on-swig-templating/#template-inheritence) resource for more info on template inheritance.

### Setup *api.html*

Create a new file called *api.html* in the "views" directory, and then add the following code:

{% raw %}
```html
{% extends 'layout.html' %}

{% block title %}{% endblock %}


{% block content %}

  <div class="container">

    <h1>{{ title }}</h1>
    <p>Welcome to {{ title }}</p>

  </div>

{% endblock %}
```
{% endraw %}

The same thing is happening here with inheritance. If you're unfamiliar with Swig syntax, {% raw %}`{{ title }}`{% endraw %} is essentially a variable, which we can pass in from `./routes/api.js`.

Update `./routes/api.js` by changing-

```javascript
res.send('Just a test');
```

-to-

```javascript
res.render('api', { title: 'Superhero API' });
```

This just says, "When a user hits the `/api/superheros` endpoint, render the *api.html* file and pass in `Superhero API` as the title."

> Keep in mind that all Swig files are converted to HTML since browsers can't read the Swig templating syntax.

Ready to test? Simple refresh [http://localhost:3000/api/superheros](http://localhost:3000/api/superheros).

Did it work? If yes, move on. If not, go back through this section and review.

### Update *api.html*

So, let's update the template to display a form:

{% raw %}
```html
{% extends 'layout.html' %}

{% block title %}{% endblock %}


{% block content %}

  <div class="container">

    <h1>{{ title }}</h1>

    <br>

    <form method="post" action="/api/superheros" class="form-inline">
      <div class="form-group">
        <label>Superhero name</label>
        <input type="text" name="name" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-default">Save</button>
    </form>

  </div>

{% endblock %}
```
{% endraw %}

Refresh your browser. Do you see the form? Try clicking save. What happens? Well, you just tried to send a POST request to the `/api/superheros` endpoint, which does not exist - so you should see a 404 error. Let's set up the route handler.

## POST requests (part 1)

Open *api.js* to add the logic for this new route:

```javascript
var express = require('express');
var router = express.Router();


router.get('/superheros', function(req, res) {
  res.render('api', { title: 'Superhero API' });
});

router.post('/superheros', function(req, res) {
  console.log(req.body.name);
  res.redirect('/api/superheros');
});

module.exports = router;
```

Test this out again. Now, when you submit the form, we have the `/api/superheros` endpoint setup, which then grabs the text from the input box via `req.body.name`. Make sure the text is consoled in your terminal.

Okay. So, we are handling the routes and rendering the right template, but we still need to setup Mongoose to save the data from our form before we can finish with the POST request.

## Mongoose

[Mongoose](http://mongoosejs.com/) is used for interacting with MongoDB. Start with defining the Schema, which then maps to a collection in Mongo.

Create a file called *database.js* in your app's root directory, then add the following code:

```javascript
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var Superhero = new Schema(
  {name : String}
);

mongoose.model('superheros', Superhero);

mongoose.connect('mongodb://localhost/node-superhero');
```

Here, we required/included the Mongoose library along with a reference to the `Schema()` method. As said, you always start with defining the schema, then we linked it to collection called "superheros". Finally, we opened a connection to an instance of our local MongoDB.

> If you don't have the MongoDB server running. Do so now. Open a new terminal window, and run the command `sudo mongod`. If you need to set up MongoDB, follow the Installation steps [here](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/).

Next, open *app.js* and require the Mongoose config at the very top of the file:

```javascript
// mongoose config
require('./database');
```

With Mongoose setup, we need to update *api.js* to create (via POST) and read (via GET) data from the Mongo collection.

## GET requests (all resources)

Open *api.js*. Require Mongoose as well as the `superheros` model, which we already created:

```javascript
var mongoose = require('mongoose');
var Superhero = mongoose.model('superheros');
```

Now, update the function handling GET requests:

```javascript
router.get('/superheros', function(req, res) {
  Superhero.find(function(err, superheros){
    console.log(superheros)
    res.render(
      'api',
      {title : 'Superhero API', superheros : superheros}
    );
  });
});
```

`Superhero.find()` grabs all superheros from the Mongo collection, which we assign to the variable `superheros`. We can now use that variable in the Swig template.

### Update *api.html* to display superheros

Let's add a loop to iterate through the superheros and then display the `name` key from the collection.

{% raw %}
```html
{% extends 'layout.html' %}

{% block title %}{% endblock %}


{% block content %}

  <div class="container">

    <h1>{{ title }}</h1>

    <br>

    <form method="post" action="/api/superheros" class="form-inline">
      <div class="form-group">
        <label>Superhero name</label>
        <input type="text" name="name" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-default">Save</button>
    </form>

    <hr><br>

    <h2>All Superheros</h2>

    <ul>
    {% for superhero in superheros %}
      <li>{{superhero.name}}</li>
    {% endfor %}
    </ul>

  </div>

{% endblock %}
```
{% endraw %}

> Do you remember where we set the `name` key? Check out the database schema in *database.js*.

Before this will actually work - e.g., display superheros - we first need to add the logic to insert data into the Mongo collection.

## POST requests (part 2)

Back in *api.js*, update the function for handling POST requests:

```javascript
router.post('/superheros', function(req, res) {
  new Superhero({name : req.body.name})
  .save(function(err, superhero) {
    console.log(superhero)
    res.redirect('/api/superheros');
  });
});
```

This simply saves a new superhero, which again is grabbed from the form via `req.body.name`.

## Sanity Check

Refresh you app. Add some superheros. If you've done everything correctly, the superheros should be displayed beneath the form.

What about updates? And deletions? First, let's display a single superhero.

## GET requests (single resource)

Update the list item in the HTML file like so to give each item a unique URL.

{% raw %}
```html
<li><a href="superhero/{{superhero.id}}">{{superhero.name}}</a></li>
```
{% endraw %}

Now, let's add a new route handler to *api.js* to display a single superhero:

```javascript
router.get('/superhero/:id', function(req, res) {
  var query = {"_id": req.params.id};
  Superhero.findOne(query, function(err, superhero){
    console.log(superhero)
    res.render(
      'superhero',
      {title : 'Superhero API - ' + superhero.name, superhero : superhero}
    );
  });
});
```

What's next? A new template. *superhero.html*:

{% raw %}
```html
{% extends 'layout.html' %}

{% block title %}{% endblock %}


{% block content %}

  <div class="container">

    <h1>{{ title }}</h1>

    <br>

    <form method="post" action="/api/superhero/{{superhero.id}}?_method=PUT">
      <div class="form-group">
        <label>Superhero name</label>
        <input type="text" name="name" class="form-control" value="{{superhero.name}}" required>
      </div>
      <button type="submit" class="btn btn-default">Update</button>
    </form>

    <br>

    <form method="post" action="/api/superhero/{{superhero.id}}?_method=DELETE" class="form-inline">
      <button type="submit" class="btn btn-default">Delete</button>
    </form>

  </div>

{% endblock %}
```
{% endraw %}

Test this out.

## PUT requests

Since most browsers do not handle PUT or DELETE requests, we need to use the [method-override](https://github.com/expressjs/method-override) middleware to handle such requests.

Install via NPM:

```sh
$ npm install method-override --save
```

Add the requirement to *app.js*:

```javascript
var methodOverride = require('method-override');
```

Then define the middleware just below the view engine setup in *app.js*:

```javascript
app.use(methodOverride('_method'))
```

Finally, add the route handler to *api.js*:

```javascript
router.put('/superhero/:id', function(req, res) {
  var query = {"_id": req.params.id};
  var update = {name : req.body.name};
  var options = {new: true};
  Superhero.findOneAndUpdate(query, update, options, function(err, superhero){
    console.log(superhero)
    res.render(
      'superhero',
      {title : 'Superhero API - ' + superhero.name, superhero : superhero}
    );
  });
});
```

Here, we are simply searching Mongo for the correct superhero via the Mongo ID and then updating the superhero name, which comes from the form, `req.body.name`. By setting `new` to `true`, we're able to grab the updated superhero information after the changes are made in Mongo. Try removing this option. What happens?

## DELETE requests

With the button already set up in the template, we just need to add the route handler to *api.js*:

```javascript
router.delete('/superhero/:id', function(req, res) {
  var query = {"_id": req.params.id};
  Superhero.findOneAndRemove(query, function(err, superhero){
    console.log(superhero)
    res.redirect('/api/superheros');
  });
});
```

Again, we're querying the database by the Mongo ID and then removing it. Simple, right?

## Conclusion

That's it. Post your questions below. Grab the code from the [repository](https://github.com/mjhea0/node-express-swig-mongo). Cheers!
