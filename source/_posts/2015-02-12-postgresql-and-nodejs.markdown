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

**Updates:**

- 09/25/2016:
  - Upgraded to the latest versions of Node v[6.6.0](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V6.md#6.6.0), Express v[4.13.4](http://expressjs.com/en/4x/api.html), and [Angular](https://angularjs.org/) v[1.5.6](https://code.angularjs.org/1.5.6/docs/guide).
  - Updated to [es6](http://es6-features.org).
- 10/05/2015: Refactored connection handling to fix [this issue](https://github.com/mjhea0/node-postgres-todo/issues/3). For more, view the [pull request](https://github.com/mjhea0/node-postgres-todo/pull/4).

## Project Setup

Start by installing the [Express generator](http://expressjs.com/en/starter/generator.html):

``` sh
$ npm install -g express-generator@4.13.4
```

Then create a new project and install the dependencies:

``` sh
$ express node-postgres-todo
$ cd node-postgres-todo && npm install
```

Add [Supervisor](https://github.com/isaacs/node-supervisor) to watch for code changes:

``` sh
$ npm install supervisor@0.11.0 -g
```

Update the `start` script in the *package.json* file:

``` json
"scripts": {
  "start": "supervisor ./bin/www"
},
```

Run the app:

``` sh
$ npm start
```

Then navigate to [http://localhost:3000/](http://localhost:3000/) in your browser. You should see the "Welcome to Express" text.

## Postgres Setup

> Need to setup Postgres? On a Mac? Check out [Postgres.app](http://postgresapp.com/).

With your Postgres server up and running on port 5432, making a database connection is easy with the [pg](https://www.npmjs.com/package/pg) library:

``` sh
$ npm install pg@6.1.0 --save
```

Now let’s set up a simple table creation script:

``` javascript
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/todo';

const client = new pg.Client(connectionString);
client.connect();
const query = client.query(
  'CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');
query.on('end', () => { client.end(); });
```

Save this as *database.js* in a new folder called "models".

Here we create a new instance of `Client` to interact with the database and then establish communication with it via the `connect()` method. We then run a SQL query via the `query()` method. Finally, communication is closed via the `end()` method. Be sure to check out the [documentation](https://github.com/brianc/node-postgres/wiki/Client) for more info.

Make sure you have a database called "todo" created, and then run the script to set up the table and subsequent fields:

``` sh
$ node models/database.js
```

Verify the table/schema creation in [psql](http://postgresguide.com/utilities/psql.html):

``` sh
$ psql
#\c todo
You are now connected to database "todo" as user "michaelherman".
todo=# \d items
                                 Table "public.items"
  Column  |         Type          |                     Modifiers
----------+-----------------------+----------------------------------------------------
 id       | integer               | not null default nextval('items_id_seq'::regclass)
 text     | character varying(40) | not null
 complete | boolean               |
Indexes:
    "items_pkey" PRIMARY KEY, btree (id)

todo=#
```

With the database connection setup along with the "items" table, we can now configure the CRUD portion of our app.

## Server-Side: Routes

Let’s keep it simple by adding all endpoints to the *index.js* file within the "routes" folder. Make sure to update the imports:

``` javascript
const express = require('express');
const router = express.Router();
const pg = require('pg');
const path = require('path');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/todo';
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

``` javascript
router.post('/api/v1/todos', (req, res, next) => {
  const results = [];
  // Grab data from http request
  const data = {text: req.body.text, complete: false};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO items(text, complete) values($1, $2)',
    [data.text, data.complete]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM items ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});
```

Test this out via Curl in a new terminal window:

``` sh
$ curl --data "text=test&complete=false" http://127.0.0.1:3000/api/v1/todos
```

Then confirm that the data was INSERTed correctly into the database via psql:

``` sh
todo=# SELECT * FROM items ORDER BY id ASC;
 id | text  | complete
----+-------+----------
  1 | test  | f
(1 row)
```

### Read

``` javascript
router.get('/api/v1/todos', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM items ORDER BY id ASC;');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});
```

Add a few more rows of data via Curl, and then test the endpoint out in your browser at [http://localhost:3000/api/v1/todos](http://localhost:3000/api/v1/todos). You should see an array of JSON objects:

``` json
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

``` javascript
router.put('/api/v1/todos/:todo_id', (req, res, next) => {
  const results = [];
  // Grab data from the URL parameters
  const id = req.params.todo_id;
  // Grab data from http request
  const data = {text: req.body.text, complete: req.body.complete};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Update Data
    client.query('UPDATE items SET text=($1), complete=($2) WHERE id=($3)',
    [data.text, data.complete, id]);
    // SQL Query > Select Data
    const query = client.query("SELECT * FROM items ORDER BY id ASC");
    // Stream results back one row at a time
    query.on('row', (row) => {
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

``` sh
$ curl -X PUT --data "text=test&complete=true" http://127.0.0.1:3000/api/v1/todos/1
```

Navigate to [http://localhost:3000/api/v1/todos](http://localhost:3000/api/v1/todos) to make sure the data has been updated correctly.

``` json
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

``` javascript
router.delete('/api/v1/todos/:todo_id', (req, res, next) => {
  const results = [];
  // Grab data from the URL parameters
  const id = req.params.todo_id;
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Delete Data
    client.query('DELETE FROM items WHERE id=($1)', [id]);
    // SQL Query > Select Data
    var query = client.query('SELECT * FROM items ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});
```

Final Curl test:

``` sh
$ curl -X DELETE http://127.0.0.1:3000/api/v1/todos/3
```

And you should now have:

``` json

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

Create a file called *app.js* in the "public/javascripts" folder. This file will house our Angular module and controller:

``` javascript
angular.module('nodeTodo', [])
.controller('mainController', ($scope, $http) => {
  $scope.formData = {};
  $scope.todoData = {};
  // Get all todos
  $http.get('/api/v1/todos')
  .success((data) => {
    $scope.todoData = data;
    console.log(data);
  })
  .error((error) => {
    console.log('Error: ' + error);
  });
});
```

Here we define our module as well as the controller. Within the controller we are using the [$http](https://code.angularjs.org/1.5.6/docs/api/ng/service/$http) service to make an AJAX request to the `'/api/v1/todos'` endpoint and then updating the scope accordingly.

What else is going on?

Well, we’re [injecting](https://code.angularjs.org/1.5.6/docs/guide/di) the `$scope` and `$http` services. Also, we’re defining and updating `$scope` to handle [binding](https://code.angularjs.org/1.5.6/docs/guide/databinding).

### Update Main Route

Let’s update the main route in *index.js* within the "routes" folder:

``` javascript
router.get('/', (req, res, next) => {
  res.sendFile('index.html');
});
```

So when the user hits the main endpoint, we send the *index.html* file. This file will contain our HTML and Angular templates.

Make sure to add the following dependency as well:

``` javascript
const path = require('path');
```

### View

Now, let’s add our basic Angular view within *index.html*:

{% raw %}
```html
<!DOCTYPE html>
<html ng-app="nodeTodo">
  <head>
    <title>Todo App - with Node + Express + Angular + PostgreSQL</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet" media="screen">
  </head>
  <body ng-controller="mainController">
    <div class="container">
      <ul ng-repeat="todo in todoData">
        <li>{{ todo.text }}</li>
      </ul>
    </div>
    <script src="//code.jquery.com/jquery-2.2.4.min.js" type="text/javascript"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" type="text/javascript"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.6/angular.min.js"></script>
    <script src="javascripts/app.js"></script>
  </body>
</html>
```
{% endraw %}

Add this to the "public" folder.

This should all be straightforward. We bootstrap Angular - `ng-app="nodeTodo"`, define the scope of the controller - `ng-controller="mainController"` - and then use `ng-repeat` to loop through the `todoData` object, adding each individual todo to the page.

### Module (round two)

Next, let’s update the module to handle the create and delete functions:

``` javascript
// Create a new todo
$scope.createTodo = () => {
  $http.post('/api/v1/todos', $scope.formData)
  .success((data) => {
    $scope.formData = {};
    $scope.todoData = data;
    console.log(data);
  })
  .error((error) => {
    console.log('Error: ' + error);
  });
};
// Delete a todo
$scope.deleteTodo = (todoID) => {
  $http.delete('/api/v1/todos/' + todoID)
  .success((data) => {
    $scope.todoData = data;
    console.log(data);
  })
  .error((data) => {
    console.log('Error: ' + data);
  });
};
```

Now, let’s update our view...

### View (round two)

Simply update the list item like so:

{% raw %}
``` html
<li><input type="checkbox" ng-click="deleteTodo(todo.id)">&nbsp;{{ todo.text }}</li>
```
{% endraw %}

This uses the [`ng-click`](https://code.angularjs.org/1.5.6/docs/api/ng/directive/ngClick) directive to call the `deleteTodo()` function that takes a unique `id` associated with each todo as an argument.

Test this out. Make sure that when you click a check box the todo is removed.

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

Again, we use `ng-click` to call the `createTodo()` function in the controller. Test this out!

## View (round four)

With the main functionality done, let’s update the front-end to make it look a bit more presentable.

**HTML**:

{% raw %}
``` html
<!DOCTYPE html>
<html ng-app="nodeTodo">
  <head>
    <title>Todo App - with Node + Express + Angular + PostgreSQL</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet" media="screen">
    <link rel="stylesheet" href="/stylesheets/style.css" media="screen">
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
          <li><h3><input class="lead" type="checkbox" ng-click="deleteTodo(todo.id)">&nbsp;{{ todo.text }}</h3></li><hr>
        </ul>
      </div>
    </div>
    <script src="//code.jquery.com/jquery-2.2.4.min.js" type="text/javascript"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" type="text/javascript"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.6/angular.min.js"></script>
    <script src="javascripts/app.js"></script>
  </body>
</html>
```
{% endraw %}

**CSS**:

``` css
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

Now that we added the front-end functionality, let’s update the app structure and refactor parts of the code.

### Structure

Since our application is logically split between the client and server, let’s do the same for our project structure. So, make the following changes to your folder structure:

```sh
├── app.js
├── bin
│   └── www
├── client
│   ├── javascripts
│   │   └── app.js
│   ├── stylesheets
│   │   └── style.css
│   └── views
│       └── index.html
├── package.json
└── server
    ├── models
    │   └── database.js
    └── routes
        └── index.js
```

Now we need to make a few updates to the code:

*server/routes/index.js*:

``` javascript
router.get('/', (req, res, next) => {
  res.sendFile(path.join(
    __dirname, '..', '..', 'client', 'views', 'index.html'));
});
```

*app.js*:

``` javascript
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routes = require('./server/routes/index');
// var users = require('./routes/users');

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client')));

app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});


module.exports = app;
```

### Utility Function

Did you notice in our routes that we are reusing much of the same code in each of the CRUD functions:

``` javascript
pg.connect(connectionString, (err, client, done) => {
  // Handle connection errors
  if(err) {
    done();
    console.log(err);
    return res.status(500).json({success: false, data: err});
  }
  // SQL Query > Select Data
  const query = client.query('SELECT * FROM items ORDER BY id ASC;');
  // Stream results back one row at a time
  query.on('row', (row) => {
    results.push(row);
  });
  // After all data is returned, close connection and return results
  query.on('end', () => {
    done();
    return res.json(results);
  });
});
```

We should abstract that out into a utility function so we're not duplicating code. Do this on your own, and then post a link to your code in the comments for review.

## Conclusion and next steps

That's it! Since there's a number of moving pieces here, please review how each piece fits into the overall process and whether each is part of the client or server. Comment below with questions. Grab the code from the [repo](https://github.com/mjhea0/node-postgres-todo).

<br><hr><br>

**This app is far from finished. What else do we need to do?**

1. Handle Permissions via [passport.js](http://passportjs.org/)
1. Add a task runner - like [Gulp](http://gulpjs.com/)
1. Test with [Mocha](http://mochajs.org/) and [Chai](http://chaijs.com/)
1. Check test coverage with [Istanbul](https://github.com/gotwarlost/istanbul)
1. Add [promises](https://docs.angularjs.org/api/ng/service/$q)
1. Use [Bower](http://bower.io/) for managing client-side dependencies
1. Utilize Angular [Routing](https://docs.angularjs.org/api/ngRoute/provider/$routeProvider), [form validation](https://docs.angularjs.org/guide/forms), [Services](https://docs.angularjs.org/guide/services), and [Templates](https://docs.angularjs.org/guide/templates)
1. Handle updates (PUT requests)
1. Better manage the database layer by adding an ORM - like [Sequelize](http://sequelizejs.com/) (*check out my follow-up post on [Node, Postgres, and Sequelize](http://mherman.org/blog/2015/10/22/node-postgres-sequelize/#.Vi7efBNViko)*) - and a means of managing [migrations](https://sequelize.readthedocs.org/en/latest/docs/migrations/)

What else? Comment below.
