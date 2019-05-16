---
layout: post
toc: true
title: "Node, Express, and MongoDB - a primer"
date: 2014-12-31
last_modified_at: 2014-12-31
comments: true
toc: true
categories: node
keywords: "node, express, mongodb, mongoose"
description: "This article details how to create a basic web app with Node, Express, and MongoDB."
redirect_from:
  - /blog/2014/12/31/node-and-mongoose-a-primer/
---

Welcome. Using Node, Express, and Mongoose, let's create an interactive form.

> Before you start, make sure you have [Node](http://nodejs.org/download/) installed for your specific operating system. This tutorial also uses [Express](http://expressjs.com/) v4.9.0 and [Mongoose](http://mongoosejs.com/) v3.8.21.

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Start by installing the Express generator, which will be used to create a basic project for us:

``` sh
$ npm install -g express-generator@4
```

> The `-g` flag means that we're installing this on our entire system.

Navigate to a convenient directory, like your "Desktop" or "Documents", then create your app:

``` sh
$ express node-mongoose-form
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

Don't worry about the files and folders for now. Just know that we have created a boilerplate that could be used for a number of Node applications. This took care of the heavy lifting, adding common files and functions associated with all apps.

Notice the *package.json* file. This stores your project's dependencies, which we still need to install:

``` sh
$ cd node-mongoose-form
$ npm install
```

Now let's install one last dependency:

``` sh
$ npm install mongoose --save
```

> The `--save` flag adds the dependencies and their versions to the *package.json* file. Take a look.

## Sanity check

Let's test our setup by running the app:

``` sh
$ npm start
```

Navigate to [http://localhost:3000/](http://localhost:3000/) in your browser and you should see the "Welcome to Express" text.

### Supervisor

I highly recommend setting up [Supervisor](https://github.com/isaacs/node-supervisor) so that you can run your app and watch for code changes. Check out the above link to learn more.

``` sh
$ npm install supervisor -g
```

Kill the server by pressing CTRL-C.

Once installed, let's update the *package.json* file to utilize Supervisor to run our program.

Simply change this-

``` javascript
"scripts": {
  "start": "node ./bin/www"
},
```

To this:

``` javascript
"scripts": {
  "start": "supervisor ./bin/www"
},
```

Let's test again:

``` sh
$ npm start
```

In your terminal you should see:

``` sh
Watching directory 'node-mongoose-form' for changes.
```

If you see that, you know it's working right. Essentially, Supervisor is watching that directory for code changes, and if they do occur, then it will refresh your app for you so you don't have to constantly kill the server then start it back up. It saves a lot of time and keystrokes.

Awesome. With the setup out of the way, let's get our hands dirty and actually build something!

## Routes

Grab your favorite text editor, and then open the main file, *app.js*, which houses all of the business logic. Take a look at the routes:

``` javascript
app.use('/', routes);
app.use('/users', users);
```

Understanding how routes work as well as how to trace all the files associated with an individual route is an important skill to learn. You'll be able to approach most applications and understand how they work just by starting with the routes.

Let's look at this route:

``` javascript
app.use('/users', users)
```

Here, we know that this route is associated with the `/users` endpoint. What's an endpoint? Simply navigate to [http://localhost:3000/users](http://localhost:3000/users).

So the end user navigates to that endpoint and expects *something* to happen. That could mean some HTML is rendered or perhaps JSON is returned. That's not important at this point. For now, let's look at how Node handles that logic for "handling routes".

Also, within that route, you can see the variable `users`. Where is this file this file? It's at the top, and it loads in another file within our app:

``` javascript
var users = require('./routes/users');
```

Open that file:

``` javascript
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

module.exports = router;
```

What's happening here? We won't touch everything but essentially when that endpoint is hit it responds by sending text in the form of a response to the end user - "respond with a resource". Now, of course you don't always have to send text. You could respond with a template or view like a Jade file that gets rendered into HTML. We'll look at how this works in just a minute when we add our own routes.

**Make sure you understand everything in this section before moving on. This is very important**.

### Add a new route

Let's now add a new route that renders an HTML form to the end user.

Start by adding the route handler in the *app.js* file:

``` javascript
app.use('/form', form);
```

> Remember this simply means `app.use('/ENDPOINT', VARIABLE_NAME);`,

Use the `form` variable to require a JS file within our routes folder.

``` javascript
var form = require('./routes/form');
```

Take a look in the terminal. You should see an error, indicating Node can't find that './routes/form' module. We need to create it!

Create that JS file/module by saving an empty file called *form.js* to the "routes" directory. Add the following code:

``` javascript
var express = require('express');
var router = express.Router();

/* GET form. */
router.get('/', function(req, res) {
  res.send('My funky form');
});

module.exports = router;
```

> Remember what this code `res.send('My funky form');` should do? If not, review the previous section.

Navigate to [http://localhost:3000/form](http://localhost:3000/form). You should see the text "'My funky form" on the page. Sweet.

## Jade

Jade is a templating language, which compiles down to HTML. It makes it easy to separate logic from markup.

Take a quick look at the *layout.jade* and *index.jade* files within the "views" folder. There's a relationship between those two files. It's called inheritance. We define the base structure in the *layout* file, which contains common structure that can be reused in multiple places.

Do you see the `block` keyword?

What really happens when the *index* file is rendered is that it first inherits the base template because of the `extends` keywords. So, the *layout* template then gets rendered, which eventually pulls in the child template, overwriting the `block` keyword with:

``` html
h1= title
  p Welcome to #{title}
```

Hope that makes sense. If not, check out [this](http://www.learnjade.com/tour/template-inheritance/) resource for more info.

### Setup *form.jade*

Create a new file called "form.jade" in the "views" directory, and then add the following code:

``` html
extends layout

block content
  h1= title
  p Welcome to #{title}
```

The same thing is happening here with inheritance. If you're unfamiliar with Jade syntax, `title` is essentially a variable, which we can pass in from `./routes/form.js`.

Update `./routes/form.js` by changing-

``` javascript
res.send('My funky form');
```

To:

``` javascript
res.render('form', { title: 'My funky form' });
```

This just says, "When a user hits the `/form` endpoint, render the *form.jade* file and pass in `My funky form` as the title."

> Keep in mind that all Jade files are converted to HTML. Browsers can't read the Jade syntax, so it must be in HTML by the time the end user sees it.

Ready to test? Simple refresh [http://localhost:3000/form](http://localhost:3000/form).

Did it work? If yes, move on. If not, go back through this section and review. Look in your terminal as well to see the error(s). If you're having problems, don't beat yourself up. It's all part of learning!

### Update *form.jade*

So, let's update the Jade syntax to load a form.

``` html
extends layout

block content
  //- passed into layout.jade when form.jade is rendered
  block content
    h1= title
    form(method="post" action="/create")
      label(for="comment") Got something to say:
      input(type="text", name="comment", value=comment)
      input(type="submit", value="Save")
```

I'm not going to touch on all the Jade syntax, but essentially, we have just a basic HTML form to submit comments.

Refresh your browser. Do you see the form? Try clicking save. What happens? Well, you just tried to send a POST request to the `/create` endpoint, which does not exist. Let's set it up.

## Add route handler for `/create`

Open *app.js* and add a new route:

``` javascript
app.use('/create', form);
```

> Notice how we're using the same `form` variable. What does this mean?

Open *form.js* to add the logic for this new route:

``` javascript
var express = require('express');
var router = express.Router();

/* GET form. */
router.get('/', function(req, res) {
  res.render('form', { title: 'My funky form' });
});

/* POST form. */
router.post('/', function(req, res) {
  console.log(req.body.comment);
  res.redirect('form');
});

module.exports = router;
```

Test this out again. Now, when you submit the form, we have the `/create` endpoint setup, which then grabs the text from the input box via `req.body.comment`. Make sure the text is consoled to your terminal.

Okay. So, we are handling the routes, rendering the right template, let's now setup Mongoose to save the data from our form.

## Setup Mongoose

[Mongoose](http://mongoosejs.com/) is awesome. Start with defining the Schema, which then maps to a collection in Mongo. It utilizes OOP.

Create a file called *database.js* in your app's root directory, then add the following code:

``` javascript
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var Comment = new Schema({
    title : String,
});

mongoose.model('comments', Comment);

mongoose.connect('mongodb://localhost/node-comment');
```

Here, we required/included the Mongoose library along with a reference to the `Schema()` method. As said, you always start with defining the schema, then we linked it to collection called "comments". Finally, we opened a connection to an instance of our local MongoDB.

> If you don't have the MongoDB server running. Do so now. Open a new terminal window, and run the command `sudo mongod`.

Next, open *app.js* and require the Mongoose config at the very top of the file:

``` javascript
// mongoose config
require('./database');
```

With Mongoose setup, we need to update *form.js* to create (via POST) and read (via GET) data from the Mongo collection.

## Handling form GET requests

Open *form.js*. Require Mongoose as well as the `comments` model, which we already created:

``` javascript
var mongoose = require('mongoose');
var Comment = mongoose.model('comments');
```

Now, update the function handling GET requests:

``` javascript
/* GET form. */
router.get('/', function(req, res) {
  Comment.find(function(err, comments){
    console.log(comments)
    res.render(
      'form',
      {title : 'My funky form', comments : comments}
    );
  });
});
```

`Comment.find()` grabs all comments from the Mongo collection, which we assign to the variable `comments`. We can now use that variable in our Jade file.

## Update *form.jade* to display comments

Let's add a loop to iterate through the comments and then display the `title` key from the collection.

``` html
extends layout

block content
  //- passed into layout.jade when form.jade is rendered
  block content
    h1= title
    form(method="post" action="/create")
      label(for="comment") Got something to say:
      input(type="text", name="comment", value=comment)
      input(type="submit", value="Save")
    br
    - for comment in comments
      p= comment.title
```

> Do you remember where we set the `title` key? Check out the database schema in *database.js*.

Before this will actually work - e.g., display comments - we first need to add the logic to insert data into the Mongo collection.

## Handling form POST requests

Back in *form.js*, update the function handling POST requests:

``` javascript
/* POST form. */
router.post('/', function(req, res) {
  new Comment({title : req.body.comment})
  .save(function(err, comment) {
    console.log(comment)
    res.redirect('form');
  });
});
```

The simply saves a new comment, which again is grabbed from the form via `req.body.comment`.

## Sanity Check

Refresh you app. Add some comments. If you've done everything correctly, the comments should be displayed beneath the form.

## Conclusion

That's it. Grab the code from the [repository](https://github.com/mjhea0/node-form-refresh). Cheers!
