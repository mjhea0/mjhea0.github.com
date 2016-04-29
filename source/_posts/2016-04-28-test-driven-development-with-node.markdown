---
layout: post
toc: true
title: "Test Driven Development with Node, Postgres, and Knex (Red/Green/Refactor)"
date: 2016-04-28 08:07:39 -0600
comments: true
categories: node
keywords: "node, express, postgres, knex, api, restful api, crud, mocha, chai, integration tests"
description: "This article takes a test-driven approach to developing a RESTful API with Node, Express, Knex, and Postgres."
---

**Today we will be developing a RESTful API with [Node](https://nodejs.org), [Express](http://expressjs.com/), [Knex](http://knexjs.org/) - a SQL query builder - and [PostgreSQL](http://www.postgresql.org/) using test driven development (TDD).**

This post assumes prior knowledge of:

- SQL
- Node/Express
- NPM Packages

## Getting Started

Before we can start testing and writing code we need to set up our project, a database, and all the required dependencies...

### Project Setup

First, we need to create a basic boilerplate Express application. To do this, first install the [Express-Generator](http://expressjs.com/en/starter/generator.html) globally:

```sh
$ npm install express-generator@4.13.1 -g
```

We can now generate a basic Express application boilerplate:

```sh
$ express mocha-chai-knex
$ cd mocha-chai-knex
$ npm install
```

Run `npm start` to ensure the application works. Once the server is running, navigate to [http://localhost:3000/](http://localhost:3000/), and you should see 'Welcome to Express' on the main page.

### Database Setup

Start by installing [PostgreSQL](http://www.postgresql.org/) from the official [download page](http://www.postgresql.org/download/).

> If you're on a Mac we recommend using [Postgress.app](http://postgresapp.com/).

As noted, we'll be using [Knex](http://knexjs.org/) to interact with our database. Knex is a SQL query builder that we can use with PostgreSQL to handle migrations, manage the schema, and query the database.

Let's start by installing [Knex](http://knexjs.org/) and [pg](https://github.com/brianc/node-postgres), a module for interacting with Postgres.

```sh
$ npm install pg@4.5.3 knex@0.10.0 --save
$ npm install knex@0.10.0 -g
```

Next, we need to create two new databases, one for developing and the other for testing. Open [psql](http://www.postgresql.org/docs/9.5/static/app-psql.html) in the terminal, and create a new database:

```sh
$ psql
psql (9.4.5)
Type "help" for help.

# CREATE DATABASE mocha_chai_tv_shows;
CREATE DATABASE
# CREATE DATABASE mocha_chai_tv_shows_test;
CREATE DATABASE
# \q
```

With out database created we can initialize Knex.

### Knex Setup

Run the following command to create *knexfile.js*, the [Knex configuration file](http://knexjs.org/#knexfile):

```sh
$ knex init
Created ./knexfile.js
```

Update the default info to:

```javascript
module.exports = {
  test: {
    client: 'pg',
    connection: 'postgres://localhost/mocha_chai_tv_shows_test',
    migrations: {
      directory: __dirname + '/db/migrations'
    },
    seeds: {
      directory: __dirname + '/db/seeds/test'
    }
  },
  development: {
    client: 'pg',
    connection: 'postgres://localhost/mocha_chai_tv_shows',
    migrations: {
      directory: __dirname + '/db/migrations'
    },
    seeds: {
      directory: __dirname + '/db/seeds/development'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: __dirname + '/db/migrations'
    },
    seeds: {
      directory: __dirname + '/db/seeds/production'
    }
  }
};
```

This sets up three different settings for our databases:

1. `test` - for testing on the local environment
1. `development` - for developing, again on the local environment
1. `production` - for the production environment

Now, we can add schema migrations. [Migrations](https://en.wikipedia.org/wiki/Schema_migration) allow us to define and update the database schema. We can create migrations in the terminal like so:

```sh
$ knex migrate:make tv_shows
```

Now, knex has automatically added in a "db/migrations" folder, with a timestamped file inside of it. Here is where we define our schema. It should just contain two empty functions at the moment.

 Let's add in our code to create and drop tables.

```javascript
exports.up = function(knex, Promise) {
  return knex.schema.createTable('shows', function(table){
    table.increments();
    table.string('name').notNullable().unique();
    table.string('channel').notNullable();
    table.string('genre').notNullable();
    table.integer('rating').notNullable();
    table.boolean('explicit').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('shows');
};
```

Here, the `up` function creates the `shows` table while the `down` function drops the table. So we now have a schema defined, and a migration file ready to create that schema.

Create a new file called *knex.js* inside the "db" folder. In this file we specify the environment (`test`, `development`, or `production`), require the *knexfile.js*, and export the configuration (based on the environment) for our database:

```javascript
var environment = process.env.NODE_ENV || 'development';
var config = require('../knexfile.js')[environment];

module.exports = require('knex')(config);
```

Apply the migrations to both databases:

```sh
$ knex migrate:latest --env development
$ knex migrate:latest --env test
```

### Knex Seeds

[Seeding](https://en.wikipedia.org/wiki/Database_seeding) is simply the process of populating the database with initial data. Knex utilizes [seed files](http://knexjs.org/#Seeds-CLI) for this.

Run the following in your terminal to create a seed for development:

```sh
$ knex seed:make shows_seed --env development
```

This will generate a folder called "seeds/development" in the "db" directory of your project, and in that file there will be a boilerplate setup for inserting data into the database:

```javascript
exports.seed = function(knex, Promise) {
  return Promise.join(
    // Deletes ALL existing entries
    knex('table_name').del(),

    // Inserts seed entries
    knex('table_name').insert({id: 1, colName: 'rowValue'}),
    knex('table_name').insert({id: 2, colName: 'rowValue2'}),
    knex('table_name').insert({id: 3, colName: 'rowValue3'})
  );
};
```

Let's change the file so we're inserting relevant data. Notice how there's also built-in promises so that the data will be seeded in the order that we specify:

```javascript
exports.seed = function(knex, Promise) {
  return knex('shows').del() // Deletes ALL existing entries
    .then(function() { // Inserts seed entries one by one in series
      return knex('shows').insert({
        name: 'Suits',
        channel: 'USA Network',
        genre: 'Drama',
        rating: 3,
        explicit: false
      });
    }).then(function () {
      return knex('shows').insert({
        name: 'Game of Thrones',
        channel: 'HBO',
        genre: 'Fantasy',
        rating: 5,
        explicit: true
      });
    }).then(function () {
      return knex('shows').insert({
        name: 'South Park',
        channel: 'Comedy Central',
        genre: 'Comedy',
        rating: 4,
        explicit: true
      });
    }).then(function () {
      return knex('shows').insert({
        name: 'Mad Men',
        channel: 'AMC',
        genre: 'Drama',
        rating: 3,
        explicit: false
      });
    });
};
```

Since JavaScript is asynchronous, the order that data is inserted can sometimes change. We want to make sure that the data is in the same order each time we run our seed file(s).

Run the seed file:

```sh
$ knex seed:run --env development
```

Before moving on, follow the same process for the test seed. Just use the same data as the development seed.

### Mocha/Chai Setup

With the database set up with data in it, we can start setting up our tests. Start by installing [Mocha](http://mochajs.org/) (test runner) and [Chai](http://chaijs.com/) ([assertion](https://en.wikipedia.org/wiki/Assertion_(software_development)) as well as [ChaiHTTP](https://github.com/chaijs/chai-http) (HTTP request module for integration testing). Make sure to also install mocha globally, so that we can run tests from the command line.

```sh
$ npm install mocha@2.4.5 -g
$ npm install mocha@2.4.5 chai@3.5.0 chai-http@2.0.1 --save-dev
```

By default, Mocha searches for tests with a "test" folder.

> This configuration can be changed with a [mocha.opts](https://mochajs.org/#mochaopts) file

Add a "test" folder to the root directory, and in that folder add a file called *routes.spec.js*. Then update *routes/index.js*:

```javascript
var express = require('express');
var router = express.Router();


// *** GET all shows *** //
router.get('/shows', function(req, res, next) {
  res.send('send shows back');
});


module.exports = router;
```

Then within *app.js* update this line-

```javascript
app.use('/', routes);
```

-to-

```javascript
app.use('/api/v1', routes);
```

Now every single route in that file will be prefixed with '/api/v1' Try it out. Fire up the server, and navigate to [http://localhost:3000/api/v1shows](http://localhost:3000/api/v1/shows). You should see the string 'send shows back' in the browser.

Finally, update this line in *app.js*-

```javascript
app.use(logger('dev'));
```

-to-

```javascript
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
```

This [prevents](http://stackoverflow.com/a/22710649/1799408) application log messages from displaying in the stdout when the tests are ran, making it much easier to read the output.

And make sure the error handlers return JSON:

```javascript
// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});
```

## Developing via TDD

The premise behind Test Driven Development (TDD) is that you write tests first that fail which you then make pass. This process is often referred to as [Red/Green/Refactor](https://github.com/mjhea0/flaskr-tdd#test-driven-development).

### Test Setup

In our test file, we'll need to start by including the necessary requirements for testing:

```javascript
process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../app');



chai.use(chaiHttp);

describe('API Routes', function() {

});
```

The first line sets the `NODE_ENV` to `test` so that the correct Knex config is used from *knexfile.js*. The next line requires `chai`, the assertion module, giving us access to all the `chai` methods - like `should()`.

> By utilizing `should()` we are using the [should](http://chaijs.com/guide/styles/#should) assertion style. This is a personal preference. You could also use [expect](http://chaijs.com/guide/styles/#expect) or [assert](http://chaijs.com/guide/styles/#assert).

Then we require `chai-http`. This module allows us make http requests from within our test file. Next, we link to our app so that we can test the request-response cycle. Finally, the `describe` block underneath the requirements is the wrapper for the tests. Keep in mind that you can nest `describe` [blocks](http://samwize.com/2014/02/08/a-guide-to-mochas-describe-it-and-setup-hooks/) to better organize your test structure by grouping similar tests together.

### GET all shows

#### Red

In the first test case, which is nested inside the first `describe` block, we want to get ALL shows in our database:

```javascript
describe('GET /api/v1/shows', function() {
  it('should return all shows', function(done) {
    chai.request(server)
    .get('/api/v1/shows')
    .end(function(err, res) {
    res.should.have.status(200);
    res.should.be.json; // jshint ignore:line
    res.body.should.be.a('array');
    res.body.length.should.equal(4);
    res.body[0].should.have.property('name');
    res.body[0].name.should.equal('Suits');
    res.body[0].should.have.property('channel');
    res.body[0].channel.should.equal('USA Network');
    res.body[0].should.have.property('genre');
    res.body[0].genre.should.equal('Drama');
    res.body[0].should.have.property('rating');
    res.body[0].rating.should.equal(3);
    res.body[0].should.have.property('explicit');
    res.body[0].explicit.should.equal(false);
    done();
    });
  });
});
```

So, we have a `describe` block, and within that block, we have a single `it` statement. An `it` statement defines a specific test case. Here we hit the route '/api/v1/shows' with a GET request and test that the actual response is the same as the expected response.

Let's break this test down...

First, by removing the test conditions, we can look at the basic test structure:

```javascript
it('should return all shows', function(done) {
  chai.request(server)
  .get('/api/v1/shows')
  .end(function(err, res) {
    done();
  });
});
```

Since this is an asynchronous test, we need some way of telling the callback function that the test is complete. This is where the `done()` callback method comes into play. Once called (or if a two second timer is exceeded), Mocha knows that the test is finished running, and it can move on to the next test.

Now let's look at the assertions:

```javascript
res.should.have.status(200);
res.should.be.json; // jshint ignore:line
res.body.should.be.a('array');
res.body.length.should.equal(4);
res.body[0].should.have.property('name');
res.body[0].name.should.equal('Suits');
res.body[0].should.have.property('channel');
res.body[0].channel.should.equal('USA Network');
res.body[0].should.have.property('genre');
res.body[0].genre.should.equal('Drama');
res.body[0].should.have.property('rating');
res.body[0].rating.should.equal(3);
res.body[0].should.have.property('explicit');
res.body[0].explicit.should.equal(false);
```

The first thing we generally want to do, is test that the response has a status of 200. After that, these tests will change depending on what we return in the route handler. In this case, we are expecting that the content type is JSON and that the response body will be an array (of objects) and have a length equal to four (since there are four rows in the database). Finally, we are testing the keys and values within the first object of the array.

Try it out:


```sh
$ mocha
```

If all went well you should see this:

```sh
  API Routes
    GET /api/v1/shows
      1) should return all shows


  0 passing (59ms)
  1 failing

  1) API Routes GET /api/v1/shows should return all shows:
     Uncaught AssertionError: expected 'text/html; charset=utf-8'
     to include 'application/json'
```

Essentially, the second assertion - `res.should.be.json;` - failed since we are sending plain text back. This is good! Remember: Red-Green-Refactor!

We just need to update the route to get the test to pass.

#### Green

Before updating the route, let's create a queries module for handling, well, the database queries. Create a new file called *queries.js* with the "db" folder, and add the following code:

```javascript
var knex = require('./knex.js');

function Shows() {
  return knex('shows');
}

// *** queries *** //

function getAll() {
  return Shows().select();
}


module.exports = {
  getAll: getAll
};
```

Here, we made a reference to our database via the Knex config file, added a helper function for simplifying each individual query, and finally queried the database to get ALL shows.

Update the route:

```javascript
var express = require('express');
var router = express.Router();

var queries = require('../db/queries');


// *** GET all shows *** //
router.get('/shows', function(req, res, next) {
  queries.getAll()
  .then(function(shows) {
    res.status(200).json(shows);
  })
  .catch(function(error) {
    next(error);
  });
});


module.exports = router;
```

Run mocha again and see what happens:

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows (128ms)


1 passing (164ms)
```

Awesome! Just don't forget the last step - refactor.

#### Refactor

What's happening in the test database?

```sh
# psql
psql (9.4.5)
Type "help" for help.

# \c mocha_chai_tv_shows_test
You are now connected to database "mocha_chai_tv_shows".
mocha_chai_tv_shows=# SELECT * FROM shows;
 id |      name       |    channel     |  genre  | rating | explicit
----+-----------------+----------------+---------+--------+----------
  1 | Suits           | USA Network    | Drama   |      3 | f
  2 | Game of Thrones | HBO            | Fantasy |      5 | t
  3 | South Park      | Comedy Central | Comedy  |      4 | t
  4 | Mad Men         | AMC            | Drama   |      3 | f
(4 rows)

#\q
```

Since we seeded the database earlier, there's data already in there, which could affect other tests (especially when rows are added, changed, and/or dropped). In the test, we are asserting that the length of the array is four. Well, if we add an item then that's going to change the length, and that first test will fail.

Tests should be isolated from each other. So, we really should rollback the migrations before and after each test is ran, and then apply the migrations and re-seed the database before the next test is ran.

This is where `beforeEach` and `afterEach` come into play:

```javascript
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app');
var knex = require('../db/knex');

var should = chai.should();

chai.use(chaiHttp);

describe('API Routes', function() {

  beforeEach(function(done) {
    knex.migrate.rollback()
    .then(function() {
      knex.migrate.latest()
      .then(function() {
        return knex.seed.run()
        .then(function() {
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    knex.migrate.rollback()
    .then(function() {
      done();
    });
  });

  describe('Get all shows', function() {
    it('should get all shows', function(done) {
      chai.request(server)
      .get('/api/v1/shows')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json; // jshint ignore:line
        res.body.should.be.a('array');
        res.body.length.should.equal(4);
        res.body[0].should.have.property('name');
        res.body[0].name.should.equal('Suits');
        res.body[0].should.have.property('channel');
        res.body[0].channel.should.equal('USA Network');
        res.body[0].should.have.property('genre');
        res.body[0].genre.should.equal('Drama');
        res.body[0].should.have.property('rating');
        res.body[0].rating.should.equal(3);
        res.body[0].should.have.property('explicit');
        res.body[0].explicit.should.equal(false);
        done();
      });
    });
  });

});
```

Now, the migrations will run and the database will be re-seeded before each nested `describe` block, and the migrations will be rolled back after each block (which will also drop the data).

> Why rollback before each test? If any errors occur during a test, it won't reach the `afterEach` block. So we want to make sure that if an error occurs we still rollback the database.

Run the tests again:

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows (52ms)


1 passing (325ms)
```

1 down, 4 to go!!!

> Did you notice how the overall time is slightly slower? 325ms vs 164ms. This is because of the `beforeEach` and `afterEach`. Think about what's happening, and why this would slow down the tests.

### GET single show

We have our route and test built to get All shows, so the next step is to just get one show back.

#### Red

Based on our test seed, the first show that should (you never know for certain with async code) is `Suits`:

```javascript
{
  name: 'Suits',
  channel: 'USA Network',
  genre: 'Drama',
  rating: 3,
  explicit: false
}
```

We can write out a test for a new route that will return just a single show and the meta information about it. Remember our last test? It returned an array of objects. This time it should be a *single* object since we will be searching for a *single* item in the database.

```javascript
describe('GET /api/v1/shows/:id', function() {
  it('should return a single show', function(done) {
    chai.request(server)
    .get('/api/v1/shows/1')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json; // jshint ignore:line
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Suits');
      res.body.should.have.property('channel');
      res.body.channel.should.equal('USA Network');
      res.body.should.have.property('genre');
      res.body.genre.should.equal('Drama');
      res.body.should.have.property('rating');
      res.body.rating.should.equal(3);
      res.body.should.have.property('explicit');
      res.body.explicit.should.equal(false);
      done();
    });
  });
});
```

This is very similar to the previous test. We're still testing for a status code of 200, and the response should be JSON. This time, we expect that `res.body` is an object. Each of the properties afterwards should be the properties of the item with id '1' in the database. So now if we run the tests, the first assertion should fail because we haven't written our route yet:

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows
  GET /api/v1/shows/:id
    1) should return a single show


1 passing (383ms)
1 failing

1) API Routes GET /api/v1/shows/:id should return a single show:
   Uncaught AssertionError: expected { Object (domain, _events, ...) }
   to have status code 200 but got 404
```

#### Green

Add the query to *queries.js*, making sure to update `module.exports`:

```javascript
function getSingle(showID) {
  return Shows().where('id', parseInt(showID)).first();
}


module.exports = {
  getAll: getAll,
  getSingle: getSingle
};
```

Then build out the route:

```javascript
// *** GET single show *** //
router.get('/shows/:id', function(req, res, next) {
  queries.getSingle(req.params.id)
  .then(function(show) {
    res.status(200).json(show);
  })
  .catch(function(error) {
    next(error);
  });
});
```

Now run mocha, and let's see if that worked:

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows (54ms)
  GET /api/v1/shows/:id
    ✓ should return a single show


2 passing (499ms)
```

Two routes down, two tests passing.

### POST

We now want to add an item to our database.

#### Red

For time's sake, write the test assuming you will get a JSON object back that contains the data added to the database:

```javascript
describe('POST /api/v1/shows', function() {
  it('should add a show', function(done) {
    chai.request(server)
    .post('/api/v1/shows')
    .send({
      name: 'Family Guy',
      channel : 'Fox',
      genre: 'Comedy',
      rating: 4,
      explicit: true
    })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json; // jshint ignore:line
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Family Guy');
      res.body.should.have.property('channel');
      res.body.channel.should.equal('Fox');
      res.body.should.have.property('genre');
      res.body.genre.should.equal('Comedy');
      res.body.should.have.property('rating');
      res.body.rating.should.equal(4);
      res.body.should.have.property('explicit');
      res.body.explicit.should.equal(true);
      done();
    });
  });
  });
```

You can see here that our test block is slightly different than the previous two since we need to send information with the request to replicate how a client might send information to the server.

#### Green

With the test written and failing (did you remember to run the tests?), we can write the query and add the route (notice the pattern yet?).

Query:

```javascript
function add() {
  return Shows().insert(show, 'id');
}
```

Route:

```javascript
// *** add show *** //
router.post('/shows', function(req, res, next) {
  queries.add(req.body)
  .then(function(showID) {
    queries.getSingle(showID)
    .then(function(show) {
      res.status(200).json(show);
    })
    .catch(function(error) {
      next(error);
    });
  })
  .catch(function(error) {
    next(error);
  });
});
```

`.insert()` returns an array containing the unique ID of the newly added item, so in order to return the actual data, we utilized the `getSingle()` query. This also ensures that the data has been inserted into the database correctly.

Do the tests pass?

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows (50ms)
  GET /api/v1/shows/:id
    ✓ should return a single show
  POST /api/v1/shows
    ✓ should add a show (71ms)


3 passing (791ms)
```

Excellent. Just two routes left to go.

### PUT

We need to test the edit route.

#### Red

Similar to our POST route we will need to send data to the server. In this case, we'll utilize the ID of an existing show in the database and send along an object with the updated fields. Then we'll assert that the show has been updated correctly.

```javascript
describe('PUT /api/v1/shows/:id', function() {
  it('should update a show', function(done) {
    chai.request(server)
    .put('/api/v1/shows/1')
    .send({
      rating: 4,
      explicit: true
    })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json; // jshint ignore:line
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Suits');
      res.body.should.have.property('channel');
      res.body.channel.should.equal('USA Network');
      res.body.should.have.property('genre');
      res.body.genre.should.equal('Drama');
      res.body.should.have.property('rating');
      res.body.rating.should.equal(4);
      res.body.should.have.property('explicit');
      res.body.explicit.should.equal(true);
      done();
    });
  });
});
```

So here we are stating that the response body should contain the updated object from the database.

#### Green

You know the drill - Start with the query:

```javascript
function update(showID, updates) {
  return Shows().where('id', parseInt(showID)).update(updates);
}
```

Then update the route:

```javascript
// *** update show *** //
router.put('/shows/:id', function(req, res, next) {
  queries.update(req.params.id, req.body)
  .then(function() {
    queries.getSingle(req.params.id)
    .then(function(show) {
      res.status(200).json(show);
    })
    .catch(function(error) {
      next(error);
    });
  }).catch(function(error) {
    next(error);
  });
});
```

Here, we again make two calls to the database. Once we've updated the item, we then nest another query to get that same item - which we then check to ensure that it has in fact been updated correctly.

The tests should pass.

#### Refactor

What happens if we try to change the ID? Update the test:

```javascript
describe('PUT /api/v1/shows/:id', function() {
  it('should update a show', function(done) {
    chai.request(server)
    .put('/api/v1/shows/1')
    .send({
      id: 20,
      rating: 4,
      explicit: true
    })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json; // jshint ignore:line
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Suits');
      res.body.should.have.property('channel');
      res.body.channel.should.equal('USA Network');
      res.body.should.have.property('genre');
      res.body.genre.should.equal('Drama');
      res.body.should.have.property('rating');
      res.body.rating.should.equal(4);
      res.body.should.have.property('explicit');
      res.body.explicit.should.equal(true);
      done();
    });
  });
});
```

Run the tests now and they should fail:

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows (43ms)
  GET /api/v1/shows/:id
    ✓ should return a single show
  POST /api/v1/shows
    ✓ should add a show (50ms)
  PUT /api/v1/shows/:id
    1) should update a show


3 passing (804ms)
1 failing

1) API Routes PUT /api/v1/shows/:id should update a show:
   Uncaught AssertionError: expected '' to be an object
```

Why? Because the updated ID of the test does not equal the ID passed in as a query parameter. What does this all mean? The unique ID should never change (unless it's removed altogether).

```javascript
// *** update show *** //
router.put('/shows/:id', function(req, res, next) {
  if(req.body.hasOwnProperty('id')) {
    return res.status(422).json({
      error: 'You cannot update the id field'
    });
  }
  queries.update(req.params.id, req.body)
  .then(function() {
    queries.getSingle(req.params.id)
    .then(function(show) {
      res.status(200).json(show);
    })
    .catch(function(error) {
      next(error);
    });
  }).catch(function(error) {
    next(error);
  });
});
```

Now, let's revert the changes in the test, by removing `id: 20,`,  and add a new test:

```javascript
describe('PUT /api/v1/shows/:id', function() {
  it('should update a show', function(done) {
    chai.request(server)
    .put('/api/v1/shows/1')
    .send({
      rating: 4,
      explicit: true
    })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json; // jshint ignore:line
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Suits');
      res.body.should.have.property('channel');
      res.body.channel.should.equal('USA Network');
      res.body.should.have.property('genre');
      res.body.genre.should.equal('Drama');
      res.body.should.have.property('rating');
      res.body.rating.should.equal(4);
      res.body.should.have.property('explicit');
      res.body.explicit.should.equal(true);
      done();
    });
  });
  it('should NOT update a show if the id field is part of the request', function(done) {
    chai.request(server)
    .put('/api/v1/shows/1')
    .send({
      id: 20,
      rating: 4,
      explicit: true
    })
    .end(function(err, res) {
      res.should.have.status(422);
      res.should.be.json; // jshint ignore:line
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal('You cannot update the id field');
      done();
    });
  });
});
```

Run the tests:

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows (49ms)
  GET /api/v1/shows/:id
    ✓ should return a single show
  POST /api/v1/shows
    ✓ should add a show (51ms)
  PUT /api/v1/shows/:id
    ✓ should update a show
    ✓ should NOT update a show if the id field is part of the request
```

Boom!

### DELETE

Now on to the final test - the delete.

#### Red

Again, let's use the ID of the first item in our database as the starting point for the test:

```javascript
describe('DELETE /api/v1/shows/:id', function() {
  it('should delete a show', function(done) {
    chai.request(server)
    .delete('/api/v1/shows/1')
    .end(function(error, response) {
      response.should.have.status(200);
      response.should.be.json; // jshint ignore:line
      response.body.should.be.a('object');
      response.body.should.have.property('name');
      response.body.name.should.equal('Suits');
      response.body.should.have.property('channel');
      response.body.channel.should.equal('USA Network');
      response.body.should.have.property('genre');
      response.body.genre.should.equal('Drama');
      response.body.should.have.property('rating');
      response.body.rating.should.equal(3);
      response.body.should.have.property('explicit');
      response.body.explicit.should.equal(false);
      chai.request(server)
      .get('/api/v1/shows')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json; // jshint ignore:line
        res.body.should.be.a('array');
        res.body.length.should.equal(3);
        res.body[0].should.have.property('name');
        res.body[0].name.should.equal('Game of Thrones');
        res.body[0].should.have.property('channel');
        res.body[0].channel.should.equal('HBO');
        res.body[0].should.have.property('genre');
        res.body[0].genre.should.equal('Fantasy');
        res.body[0].should.have.property('rating');
        res.body[0].rating.should.equal(5);
        res.body[0].should.have.property('explicit');
        res.body[0].explicit.should.equal(true);
        done();
      });
    });
  });
});
```

The test ensure that the deleted show is returned and that the database no longer contains the show.

#### Green

Query:

```javascript
function deleteItem(showID) {
  return Shows().where('id', parseInt(showID)).del();
}
```

Route:

```javascript
// *** delete show *** //
router.delete('/shows/:id', function(req, res, next) {
  queries.getSingle(req.params.id)
  .then(function(show) {
    queries.deleteItem(req.params.id)
    .then(function() {
      res.status(200).json(show);
    })
    .catch(function(error) {
      next(error);
    });
  }).catch(function(error) {
    next(error);
  });
});
```

The Knex `delete()` function returns a number indicating the number of rows in the database that have been affected, so to return the deleted object, we must query for it first.

Let's run those tests!!

```sh
API Routes
  GET /api/v1/shows
    ✓ should return all shows (69ms)
  GET /api/v1/shows/:id
    ✓ should return a single show
  POST /api/v1/shows
    ✓ should add a show (54ms)
  PUT /api/v1/shows/:id
    ✓ should update a show
    ✓ should NOT update a show if the id field is part of the request
  DELETE /api/v1/shows/:id
    ✓ should delete a show


6 passing (1s)
```

6 tests written. 5 routes built. All tests passing!

## Conclusion

So there you have it: A test-first approach to developing a RESTful API. Are we done? Not quite since we are not handling or testing for all possible errors.

For example, what would happen if we tried to POST an item without all the required fields? Or if we tried to delete an item that isn't in the database? Sure the `catch()` methods will handle these, but they are simply passing the request to the built-in error handlers. We should handle these better in the routes and throw back appropriate error messages and status codes.

Try this out on your own. Be sure to grab the code from the [repository](https://github.com/mjhea0/mocha-chai-knex). Cheers!

<br>

<p style="font-size: 14px;">
  <em>Edits made by <a href="https://www.linkedin.com/in/bbouley">Bradley Bouley</a>. Thank you!</em>
</p>