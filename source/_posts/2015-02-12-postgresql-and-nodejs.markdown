---
layout: post
toc: true
title: "PostgreSQL and NodeJS"
date: 2015-02-12 19:07
comments: true
categories: node
keywords: "node, express, angular, postgres"
description: "This article details how to build a todo app with Node, Express, Angular, and Postgres."
---

**Today we're going to build a CRUD todo single page application with Node, Express, Angular, and PostgreSQL.**

![node todo app](https://raw.githubusercontent.com/mjhea0/node-postgres-todo/master/_blog/node-todo-postges.jpg)

**Updated on October 5th, 2015** - Refactored connection handling to fix [this issue](https://github.com/mjhea0/node-postgres-todo/issues/3). For more, view the [pull request](https://github.com/mjhea0/node-postgres-todo/pull/4).

> Technologies/Tools used - [Node](http://nodejs.org/) v0.10.36, [Express](https://www.npmjs.com/package/express) v4.11.1, [Angular](https://angularjs.org/) v1.3.12.

## Project Setup

Start by installing the [Express generator](http://expressjs.com/starter/generator.html) if you don't already have it:

```sh
$ npm install -g express-generator@4
```

Then create a new project and install the dependencies:

```sh
$ express node-postgres-todo
$ cd node-postgres-todo && npm install
```

Add [Supervisor](https://github.com/isaacs/node-supervisor) to watch for code changes:

```sh
$ npm install supervisor -g
```

Update the ‘start’ script in the _package.json_ file:

```json
"scripts": {
  "start": "supervisor ./bin/www"
},
```

Run the app:

```sh
$ npm start
```

Then navigate to [http://localhost:3000/](http://localhost:3000/) in your browser. You should see the "Welcome to Express" text.

## Postgres Setup

> Need to setup Postgres? On a Mac? Check out [Postgres.app](http://postgresapp.com/).

With your Postgres server up and listening on port 5432, making a database connection is easy with the [pg](https://www.npmjs.com/package/pg) library:

```sh
$ npm install pg --save
```

Now let’s set up a simple table creation script:

```javascript
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/todo';

var client = new pg.Client(connectionString);
client.connect();
var query = client.query('CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');
query.on('end', function() { client.end(); });
```

Save this as _database.js_ in a new folder called "models".

Here we create a new instance of `Client` to interact with the database and then establish communication with it via the `connect()` method. We then set run a SQL query via the `query()` method. Communication is closed via the `end()` method. Be sure to check out the [documentation](https://github.com/brianc/node-postgres/wiki/Client) for more info.

Make sure you have a database called "todo" setup, and then run the script to setup the table and subsequent fields:

```sh
$ node models/database.js
```

Verify the table/schema creation in [psql](http://postgresguide.com/utilities/psql.html):

```sh
michaelherman=# \c todo
You are now connected to database "todo" as user "michaelherman".
todo=# \d+ items
                                                     Table "public.items"
  Column  |         Type          |                     Modifiers                      | Storage  | Stats target | Description
----------+-----------------------+----------------------------------------------------+----------+--------------+-------------
 id       | integer               | not null default nextval('items_id_seq'::regclass) | plain    |              |
 text     | character varying(40) | not null                                           | extended |              |
 complete | boolean               |                                                    | plain    |              |
Indexes:
    "items_pkey" PRIMARY KEY, btree (id)
```

With the database connection setup along with the "items" table, we can now configure the CRUD portion of our app.

## Server-Side: Routes

Let’s keep it simple by adding all endpoints to the _index.js_ file within the "routes" folder. Make sure to update the imports:

```javascript
var express = require('express');
var router = express.Router();
var pg = require('pg');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
```

Now, let’s add each endpoint.

<table style="font-size:16px;border-spacing:10px 0px;border-collapse:separate;border:1px solid black;">
<thead>
<tr>
<th style="text-align:center"><strong>Function</strong></th>
<th style="text-align:center"><strong>URL</strong></th>
<th style="text-align:center"><strong>Action</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>CREATE</td>
<td>/api/v1/todos</td>
<td>Create a single todo</td>
</tr>
<tr>
<td>READ</td>
<td>/api/v1/todos</td>
<td>Get all todos</td>
</tr>
<tr>
<td>UPDATE</td>
<td>/api/v1/todos/:todo_id</td>
<td>Update a single todo</td>
</tr>
<tr>
<td>DELETE</td>
<td>/api/v1/todos/:todo_id</td>
<td>Delete a single todo</td>
</tr>
</tbody>
</table>

<br>

Follow along with the inline comments below for an explanation of what’s happening. Also, be sure to check out the [pg documentation](https://github.com/brianc/node-postgres/wiki/Connection) to learn about connection pooling. How does that differ from `pg.Client`?

### Create

```javascript
router.post('/api/v1/todos', function(req, res) {

    var results = [];

    // Grab data from http request
    var data = {text: req.body.text, complete: false};

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Insert Data
        client.query("INSERT INTO items(text, complete) values($1, $2)", [data.text, data.complete]);

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM items ORDER BY id ASC");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });


    });
});
```

Test this out via Curl in your terminal:

```sh
$ curl --data "text=test&complete=false" http://127.0.0.1:3000/api/v1/todos
```

Then confirm that the data was INSERT’ed correctly into the database via psql:

```sh
todo=# SELECT * FROM items ORDER BY id ASC;
 id | text  | complete
----+-------+----------
  1 | test  | f
(1 row)
```

### Read

```javascript
router.get('/api/v1/todos', function(req, res) {

    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM items ORDER BY id ASC;");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });

    });

});
```

Add a few more rows of data via Curl, and then test the endpoint out in your browser at [http://localhost:3000/api/v1/todos](http://localhost:3000/api/v1/todos). You should see an array of JSON objects:

```json
[
    {
        id: 1,
        text: "test",
        complete: false
    },
    {
        id: 2,
        text: "test2",
        complete: false
    },
    {
        id: 3,
        text: "test3",
        complete: false
    }
]
```

### Update

```javascript
router.put('/api/v1/todos/:todo_id', function(req, res) {

    var results = [];

    // Grab data from the URL parameters
    var id = req.params.todo_id;

    // Grab data from http request
    var data = {text: req.body.text, complete: req.body.complete};

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).send(json({ success: false, data: err}));
        }

        // SQL Query > Update Data
        client.query("UPDATE items SET text=($1), complete=($2) WHERE id=($3)", [data.text, data.complete, id]);

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM items ORDER BY id ASC");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });
    });

});
```

Again, test via Curl:

```sh
$ curl -X PUT --data "text=test&complete=true" http://127.0.0.1:3000/api/v1/todos/1
```

Navigate to [http://localhost:3000/api/v1/todos](http://localhost:3000/api/v1/todos) to make sure the data has been updated correctly.

```json
[
    {
        id: 1,
        text: "test",
        complete: true
    },
    {
        id: 2,
        text: "test2",
        complete: false
    },
    {
        id: 3,
        text: "test3",
        complete: false
    }
]
```

### Delete

```javascript
router.delete('/api/v1/todos/:todo_id', function(req, res) {

    var results = [];

    // Grab data from the URL parameters
    var id = req.params.todo_id;


    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Delete Data
        client.query("DELETE FROM items WHERE id=($1)", [id]);

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM items ORDER BY id ASC");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });
    });

});
```

Final Curl test:

```sh
$ curl -X DELETE http://127.0.0.1:3000/api/v1/todos/3
```

And you should now have:

```json

[
    {
        id: 1,
        text: "test",
        complete: true
    },
    {
        id: 2,
        text: "test2",
        complete: false
    }
]
```

## Refactoring

Before we jump to the client-side to add Angular, be aware that our code should be refactored to address a few issues. We’ll handle this later on in this tutorial, but this is an excellent opportunity to refactor the code on your own. Good luck!

## Client-Side: Angular

Let’s dive right in to Angular.

> Keep in mind that this is not meant to be an exhaustive tutorial. If you’re new to Angular I suggest following my "AngularJS by Example" tutorial - [Building a Bitcoin Investment Calculator](https://github.com/mjhea0/thinkful-angular).

### Module

Create a file called _app.js_ in the "public/javascripts" folder. This file will house our Angular module and controller:

```javascript
angular.module('nodeTodo', [])

.controller('mainController', function($scope, $http) {

    $scope.formData = {};
    $scope.todoData = {};

    // Get all todos
    $http.get('/api/v1/todos')
        .success(function(data) {
            $scope.todoData = data;
            console.log(data);
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });
});
```

Here we define our module as well as the controller. Within the controller we are using the [`$http`](https://docs.angularjs.org/api/ng/service/$http) service to make an AJAX request to the `'/api/v1/todos'` endpoint and then updating the scope accordingly.

What else is going on?

Well, we’re [injecting](https://docs.angularjs.org/guide/di) the `$scope` and `$http` services. Also, we’re defining and updating `$scope` to handle [binding](https://docs.angularjs.org/guide/databinding).

### Update `/` Route

Let’s update the main route in _index.js_ within the "routes" folder:

```javascript
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../views', 'index.html'));
});
```

So when the end user hits the main endpoint, we send the _index.html_ file. This file will contain our HTML and Angular templates.

Make sure to add the following dependency as well:

```javascript
var path = require('path');
```

### View

Now, let’s add our basic Angular view within _index.html_:

```html
<!DOCTYPE html>
<html ng-app="nodeTodo">
  <head>
    <title>Todo App - with Node + Express + Angular + PostgreSQL</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="http://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet" media="screen">
  </head>
  <body ng-controller="mainController">
    <div class="container">
      <ul ng-repeat="todo in todoData">
        <li></li>
      </ul>
    </div>
    <script src="http://code.jquery.com/jquery-1.11.2.min.js" type="text/javascript"></script>
    <script src="http://netdna.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js" type="text/javascript"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.12/angular.min.js"></script>
    <script src="javascripts/app.js"></script>
  </body>
</html>
```

This should all be straightforward. We bootstrap Angular - `ng-app="nodeTodo"`, define the scope of the controller - `ng-controller="mainController"` - and then use `ng-repeat` to loop through the `todoData` object, adding each individual todo to the page.

### Module (round two)

Next, let’s update the module to handle the Create and Delete functions:

```javascript
// Create a new todo
$http.post('/api/v1/todos', $scope.formData)
    .success(function(data) {
        $scope.formData = {};
        $scope.todoData = data;
        console.log(data);
    })
    .error(function(error) {
        console.log('Error: ' + error);
    });

// Delete a todo
$http.delete('/api/v1/todos/' + todoID)
    .success(function(data) {
        $scope.todoData = data;
        console.log(data);
    })
    .error(function(data) {
        console.log('Error: ' + data);
    });
```

Now, let’s update our view…

### View (round two)

Simply update each list item like so:

{% raw %}
```html
<li><input type="checkbox" ng-click="deleteTodo(todo.id)">&nbsp;{{ todo.text }}</li>
```
{% endraw %}

This uses the [`ng-click`](https://docs.angularjs.org/api/ng/directive/ngClick) directive to call the `deleteTodo()` function - which we still need to define - that takes a unique `id` associated with each todo as an argument.

### Module (round three)

Update the controller:

```javascript
// Delete a todo
$scope.deleteTodo = function(todoID) {
    $http.delete('/api/v1/todos/' + todoID)
        .success(function(data) {
            $scope.todoData = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
};
```

We simply wrapped the delete functionality in the `deleteTodo()` function. Test this out. Make sure that when you click a check box the todo is removed.

### View (round three)

To handle the creation of a new todo, we need to add an HTML form:

{% raw %}
```html
<div class="container">

  <form>
    <div class="form-group">
      <input type="text" class="form-control input-lg" placeholder="Add a todo..." ng-model="formData.text">
    </div>
    <button type="submit" class="btn btn-primary btn-lg" ng-click="createTodo()">Add Todo</button>
  </form>

  <ul ng-repeat="todo in todoData">
    <li><input type="checkbox" ng-click="deleteTodo(todo.id)">&nbsp;{{ todo.text }}</li>
  </ul>

</div>
```
{% endraw %}

Again, we use `ng-click` to call a function in the controller.

### Module (round four)

```javascript
// Create a new todo
$scope.createTodo = function(todoID) {
    $http.post('/api/v1/todos', $scope.formData)
        .success(function(data) {
            $scope.formData = {};
            $scope.todoData = data;
            console.log(data);
        })
        .error(function(error) {
            console.log('Error: ' + error);
        });
};
```

Test this out!

## View (round four)

With the main functionality done, let’s update the front-end to make it look, well, presentable.

**HTML**:

{% raw %}
```html
<!DOCTYPE html>
<html ng-app="nodeTodo">
  <head>
    <title>Todo App - with Node + Express + Angular + PostgreSQL</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- styles -->
    <link href="http://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet" media="screen">
    <link href="stylesheets/style.css" rel="stylesheet" media="screen">
  </head>
  <body ng-controller="mainController">

    <div class="container">

      <div class="header">
        <h1>Todo App</h1>
        <hr>
        <h1 class="lead">Node + Express + Angular + PostgreSQL</h1>
      </div>

      <div class="todo-form">
        <form>
          <div class="form-group">
            <input type="text" class="form-control input-lg" placeholder="Enter text..." ng-model="formData.text">
          </div>
          <button type="submit" class="btn btn-primary btn-lg btn-block" ng-click="createTodo()">Add Todo</button>
        </form>
      </div>

      <br>

      <div class="todo-list">
        <ul ng-repeat="todo in todoData">
          <li><h3><input class="lead" type="checkbox" ng-click="deleteTodo(todo.id)">&nbsp;{{ todo.text }}</li></h3><hr>
        </ul>
      </div>

    </div>

    <!-- scripts -->
    <script src="http://code.jquery.com/jquery-1.11.2.min.js" type="text/javascript"></script>
    <script src="http://netdna.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js" type="text/javascript"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.12/angular.min.js"></script>
    <script src="javascripts/app.js"></script>
  </body>
</html>
```
{% endraw %}

**CSS**:

```css
body {
  padding: 50px;
  font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;
}

a {
  color: #00B7FF;
}

ul {
  list-style-type: none;
  padding-left: 10px;
}

.container {
  max-width: 400px;
  background-color: #eeeeee;
  border: 1px solid black;
}

.header {
  text-align: center;
}
```

How’s that? Not up to par? Continue working on it on your end.

## Refactoring (for real)

Now that we added the front-end functionality, let’s update our application’s structure and refactor parts of the code.

### Structure

Since our application is logically split between the client and server, let’s do the same for our project structure. So, make the following changes to your folder structure:

```sh
├── app.js
├── bin
│   └── www
├── client
│   ├── public
│   │   ├── javascripts
│   │   │   └── app.js
│   │   └── stylesheets
│   │       └── style.css
│   └── views
│       └── index.html
├── config.js
├── package.json
└── server
    ├── models
    │   └── database.js
    └── routes
        └── index.js
```

Now, we need to make a few updates to the code:

_server/routes/index.js_:

```javascript
res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'index.html'));
```

_app.js_:

```javascript
var routes = require('./server/routes/index');
```

_app.js_:

```javascript
app.use(express.static(path.join(__dirname, './client', 'public')));
```

### Configuration

Next, let’s move the `connectionString` variable - which specifies the database URI (`process.env.DATABASE_URL || 'postgres://localhost:5432/todo';`) - to a configuration file since we are reusing the same same connection throughout our application.

Create a file called _config.js_ in the root directory, and then add the following code to it:

```javascript
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/todo';

module.exports = connectionString;
```

Then update the `connectionString` variable in both _server/models/database.js_ and _server/routes/index.js_:

```javascript
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
```

And make sure to add `var path = require('path');` to the former file as well.

### Utility Function

Did you notice in our routes that we are reusing the same code in each of the CRUD functions:

```javascript
// SQL Query > Select Data
var query = client.query("SELECT * FROM items ORDER BY id ASC");

// Stream results back one row at a time
query.on('row', function(row) {
    results.push(row);
});

// After all data is returned, close connection and return results
query.on('end', function() {
    client.end();
    return res.json(results);
});

// Handle Errors
if(err) {
  console.log(err);
}
```

We should abstract that out into a utility function so we're not duplicating code. Do this on your own, and then post a link to your code in the comments for review.

## Conclusion and next steps

That's it! Now, since there's a number of moving pieces here, please review how each piece fits into the overall process and whether each is part of the client or server-side. Comment below with questions. Grab the code from the [repo](https://github.com/mjhea0/node-postgres-todo).

<br><hr><br>

**Finally, this app is far from finished. What else do we need to do?**

1. Handle Permissions via [passport.js](http://passportjs.org/)
1. Add a task runner - like [Gulp](http://gulpjs.com/)
1. Test with [Mocha](http://mochajs.org/) and [Chai](http://chaijs.com/)
1. Check test coverage with [Istanbul](https://github.com/gotwarlost/istanbul)
1. Add [promises](https://docs.angularjs.org/api/ng/service/$q)
1. Use [Bower](http://bower.io/) for managing client-side dependencies
1. Utilize Angular [Routing](https://docs.angularjs.org/api/ngRoute/provider/$routeProvider), [form validation](https://docs.angularjs.org/guide/forms), [Services](https://docs.angularjs.org/guide/services), and [Templates](https://docs.angularjs.org/guide/templates)
1. Handle updates/PUT requests
1. Update the Express [View Engine](http://expressjs.com/guide/using-template-engines.html) to HTML
1. Better manage the database layer by adding an ORM - like [Sequelize](http://sequelizejs.com/) (*check out my follow-up post on [Node, Postgres, and Sequelize](http://mherman.org/blog/2015/10/22/node-postgres-sequelize/#.Vi7efBNViko)*) - and a means of managing [migrations](https://sequelize.readthedocs.org/en/latest/docs/migrations/)

What else? Comment below.
