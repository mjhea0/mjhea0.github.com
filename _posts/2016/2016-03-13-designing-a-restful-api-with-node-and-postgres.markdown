---
layout: post
toc: true
title: "Designing a RESTful API with Node and Postgres"
date: 2016-03-13
comments: true
toc: true
categories: [node]
keywords: "node, express, postgres, api, restful api, crud"
description: "This article details how to build a RESTful API with Node, Express, and Postgres."
redirect_from:
  - /blog/2016/03/13/designing-a-restful-api-with-node-and-postgres/
---

In this tutorial we'll create a RESTful web service with JavaScript, Node, Express, Postgres, and pg-promise.

<div style="text-align:center;">
  <img src="/assets/img/blog/node-restful-api.png" style="max-width: 100%; border:0; box-shadow: none;" alt="node restful api">
</div>

<br>

Our app will include the following endpoints:

<table style="font-size:18px;border-spacing:12px 0px;border-collapse:separate;border:1px solid black;">
<thead>
<tr>
<th style="text-align:center"><strong>URL</strong></th>
<th style="text-align:center"><strong>HTTP Verb</strong></th>
<th style="text-align:center"><strong>Action</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>/api/puppies</td>
<td>GET</td>
<td>Return ALL puppies</td>
</tr>
<tr>
<td>/api/puppies/:id</td>
<td>GET</td>
<td>Return a SINGLE puppy</td>
</tr>
<tr>
<td>/api/puppies</td>
<td>POST</td>
<td>Add a puppy</td>
</tr>
<tr>
<td>/api/puppies/:id</td>
<td>PUT</td>
<td>Update a puppy</td>
</tr>
<tr>
<td>/api/puppies/:id</td>
<td>DELETE</td>
<td>Delete a puppy</td>
</tr>
</tbody>
</table>

<br>

> This tutorial uses the following tools and technologies - Node.js v[4.x](https://nodejs.org/dist/v4.7.2/), [express-generator v4.x](https://github.com/expressjs/generator), [pg-promise v5.x](https://github.com/vitaly-t/pg-promise), PostgreSQL v[9.4](http://www.postgresql.org/docs/9.4/static/release.html), and [Bluebird v3.x](http://bluebirdjs.com)

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project setup

Install the Express Generator (if necessary):

``` sh
$ npm install express-generator@4 -g
```

Create a new project and install the required dependencies:

``` sh
$ express node-postgres-promises
$ cd node-postgres-promises
$ npm install
```

Test!

``` sh
$ npm start
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser, and you should see the familiar "Welcome to Express" text. Kill the server when done. Now let's set up the Postgres bindings via [pg-promise](https://www.npmjs.com/package/pg-promise)...

Install `pg-promise`

``` sh
$ npm install pg-promise@5 --save
```

Why `pg-promise` instead of `pg`? Put simply, pg-promise abstracts away much of the difficult, low-level connection management, allowing you to focus on the business logic. Further, the library includes a powerful [query formatting engine](https://www.npmjs.com/package/pg-promise#queries-and-parameters) and support for [automated transactions](https://www.npmjs.com/package/pg-promise#transactions).

Finally, create a new file in the project root called *queries.js*:

``` javascript
var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = 'postgres://localhost:5432/puppies';
var db = pgp(connectionString);

// add query functions

module.exports = {
  getAllPuppies: getAllPuppies,
  getSinglePuppy: getSinglePuppy,
  createPuppy: createPuppy,
  updatePuppy: updatePuppy,
  removePuppy: removePuppy
};
```

Here, we created an instance of `pg-promise` and assigned it to a variable, `pgp`.

Did you notice that we passed an object, `options`, during the initialization process? This is required, even if you do not pass any properties/[initialization options](https://www.npmjs.com/package/pg-promise#initialization-options) to the object. In this case, we [overrode](https://www.npmjs.com/package/pg-promise#promiselib) pg-promise's default promise library - ES6 Promises - with [Bluebird](http://bluebirdjs.com) by setting the `promiseLib` property in the `options` object.

> Why Bluebird? It's loaded with features and reputed to be [faster](http://programmers.stackexchange.com/questions/278778/why-are-native-es6-promises-slower-and-more-memory-intensive-than-bluebird) than ES6 Promises.

Don't forget to install Bluebird:

``` sh
$ npm install bluebird@3 --save
```

Next, we defined a connection string, and then passed it to the pg-promise instance to create a global connection instance.

Done!

## Postgres setup

Create a new file also in the root called *puppies.sql* and then add the following code:

``` sql
DROP DATABASE IF EXISTS puppies;
CREATE DATABASE puppies;

\c puppies;

CREATE TABLE pups (
  ID SERIAL PRIMARY KEY,
  name VARCHAR,
  breed VARCHAR,
  age INTEGER,
  sex VARCHAR
);

INSERT INTO pups (name, breed, age, sex)
  VALUES ('Tyler', 'Retrieved', 3, 'M');
```

Run the file to create the database, apply the schema, and add one row to the newly created database:

``` sh
$ psql -f puppies.sql

DROP DATABASE
CREATE DATABASE
CREATE TABLE
INSERT 0 1
```

## Routes

Now we can set up the route handlers in *index.js*:

``` javascript
var express = require('express');
var router = express.Router();

var db = require('../queries');


router.get('/api/puppies', db.getAllPuppies);
router.get('/api/puppies/:id', db.getSinglePuppy);
router.post('/api/puppies', db.createPuppy);
router.put('/api/puppies/:id', db.updatePuppy);
router.delete('/api/puppies/:id', db.removePuppy);


module.exports = router;
```

## Queries

Next, let's add the SQL queries to the *queries.js* file...

### GET All Puppies

``` javascript
function getAllPuppies(req, res, next) {
  db.any('select * from pups')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL puppies'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}
```

In the above code, we utilized the `any` [Query Result Mask](https://www.npmjs.com/package/pg-promise#query-result-mask) to query the database, which returns a promise object. This method is used to indicate that we are expecting any number of results back. Success and failures are then handled by `.then()` and `.catch()`.

Besides, `any`, you can use the following [Query Result Masks](https://www.npmjs.com/package/pg-promise#query-result-mask) (just to name a few):

  - `one` - a single row is expected
  - `many` - one or more rows are expected
  - `none` - no rows are expected
  - `result` - passes the original object when resolved (we'll look at an example of this shortly)

Test the request out in the browser - [http://localhost:3000/api/puppies](http://localhost:3000/api/puppies):

``` json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Tyler",
      "breed": "Shih-tzu",
      "age": 3,
      "sex": "M"
    }
  ],
  "message": "Retrieved ALL puppies"
}
```

### GET Single Puppy

``` javascript
function getSinglePuppy(req, res, next) {
  var pupID = parseInt(req.params.id);
  db.one('select * from pups where id = $1', pupID)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ONE puppy'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}
```

Again, test in the browser: [http://localhost:3000/api/puppies/1](http://localhost:3000/api/puppies/1)

``` json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Tyler",
    "breed": "Shih-tzu",
    "age": 3,
    "sex": "M"
  },
  "message": "Retrieved ONE puppy"
}
```

### POST

``` javascript
function createPuppy(req, res, next) {
  req.body.age = parseInt(req.body.age);
  db.none('insert into pups(name, breed, age, sex)' +
      'values(${name}, ${breed}, ${age}, ${sex})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Inserted one puppy'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}
```

Test with curl in a new terminal window:

``` sh
$ curl --data "name=Whisky&breed=annoying&age=3&sex=f" \
http://127.0.0.1:3000/api/puppies
```

You should see:

``` sh
{
  "status": "success",
  "message": "Inserted one puppy"
}
```

Double check the GET ALL route in your browser to ensure that the new puppy is now part of the collection.

### PUT

``` javascript
function updatePuppy(req, res, next) {
  db.none('update pups set name=$1, breed=$2, age=$3, sex=$4 where id=$5',
    [req.body.name, req.body.breed, parseInt(req.body.age),
      req.body.sex, parseInt(req.params.id)])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated puppy'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}
```

Test!

``` sh
$ curl -X PUT --data "name=Hunter&breed=annoying&age=33&sex=m" \
http://127.0.0.1:3000/api/puppies/1
```

### Delete

``` javascript
function removePuppy(req, res, next) {
  var pupID = parseInt(req.params.id);
  db.result('delete from pups where id = $1', pupID)
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .json({
          status: 'success',
          message: `Removed ${result.rowCount} puppy`
        });
      /* jshint ignore:end */
    })
    .catch(function (err) {
      return next(err);
    });
}
```

So, we used the `result` [Query Result Mask](https://www.npmjs.com/package/pg-promise#query-result-mask), in order to get the number of records affected by the query.

``` sh
$ curl -X DELETE http://127.0.0.1:3000/api/puppies/1
```

Result:

``` sh
{
  "status": "success",
  "message": "Removed 1 puppy"
}
```

## Error Handling

Update the error handlers in *app.js* to serve up JSON:

``` javascript
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status( err.code || 500 )
    .json({
      status: 'error',
      message: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  .json({
    status: 'error',
    message: err.message
  });
});
```

## Conclusion

We now have a basic RESTful API built with Node, Express, and pg-promise. Be sure to comment below if you have any questions.

Grab the code from the [repo](https://github.com/mjhea0/node-postgres-promises).

> **NOTE**: Check out [pg-promise-demo](https://github.com/vitaly-t/pg-promise-demo) for a more comprehensive example of setting up your database layer.
