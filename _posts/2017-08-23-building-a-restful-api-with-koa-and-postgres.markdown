---
layout: post
title: "Building a RESTful API with Koa and Postgres"
date: 2017-08-23 08:31:03
comments: true
toc: true
categories: [node, mocha, koa, testing]
keywords: "node, koa, koa 2, async/await, postgres, knex, api, restful api, crud, mocha, chai, integration tests"
description: "This article takes a test-driven approach to developing a RESTful API with Node, Koa, and Postgres."
---

In this tutorial, you'll learn how to develop a RESTful API with [Koa](http://koajs.com/) 2 and Postgres. You'll also be taking advantage of [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) functions, from ES2017, and test driven development (TDD).

> This tutorial requires Node v[7.6.0](https://nodejs.org/en/blog/release/v7.6.0/) or greater.

<div style="text-align:center;">
  <img src="/assets/img/blog/node-koa-api.png" style="max-width: 90%; border:0; box-shadow: none;" alt="node koa">
</div><br>

#### NPM Dependencies

1. Koa v[2.3.0](https://github.com/koajs/koa/releases/tag/2.3.0)
1. Mocha v[3.5.0](https://github.com/mochajs/mocha/releases/tag/v3.5.0)
1. Chai v[4.1.1](https://github.com/chaijs/chai/releases/tag/4.1.1)
1. Chai HTTP v[3.0.0](https://github.com/chaijs/chai-http/releases/tag/3.0.0)
1. Knex v[0.13.0](https://github.com/tgriesser/knex/releases/tag/0.13.0)
1. pg v[7.1.2](https://github.com/brianc/node-postgres/releases/tag/v7.1.2)
1. koa-router v[7.2.1](https://github.com/alexmingoia/koa-router/releases/tag/v7.2.1)
1. koa-bodyparser v[4.2.0](https://github.com/koajs/bodyparser/releases/tag/4.2.0)

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Objectives

By the end of this tutorial, you will be able to...

1. Set up a project with Koa using test driven development
1. Write schema migration files with Knex to create new database tables
1. Generate database seed files with Knex and apply the seeds to the database
1. Set up the testing structure with Mocha and Chai
1. Perform the basic CRUD functions on a RESTful resource with Knex methods
1. Create a CRUD app, following RESTful best practices
1. Write integration tests
1. Write tests, and then write just enough code to pass the tests
1. Create routes with Koa Router
1. Parse the request body with koa-bodyparser

## Getting Started

### What are we building?

Your goal is to design a RESTful API, using test driven development, for a single resource - `movies`. The API itself should follow RESTful design principles, using the [basic HTTP verbs](http://www.restapitutorial.com/lessons/httpmethods.html): GET, POST, PUT, and DELETE.  

### What is Koa?

Koa is a web framework for Node.js.

Although it's designed by the same team that created Express, it's much lighter than Express though - so it comes with very little out of the box. It's really just a tiny wrapper on top of Node's [HTTP](https://nodejs.org/api/http.html#http_http) module. Koa allows you - the developer - to pick and choose the tools you want to use from the [community](https://github.com/koajs/koa/wiki).

It has native support for [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), which makes it easier and faster to develop an API since you don't have to deal with [callbacks](https://en.wikipedia.org/wiki/Callback_(computer_programming%29) and [callback hell](http://callbackhell.com/).

Finally, since Koa has similar patterns to Express, it's relatively easy to pick up if you've worked at all with Express.

> **NOTE**: For more, review [Koa vs Express](https://github.com/koajs/koa/blob/master/docs/koa-vs-express.md).

### TDD

Test Driven Development (TDD) is an iterative development cycle that emphasizes writing automated tests *before* writing the actual code.

#### Why?

1. Helps break down problems into manageable pieces since you should have a better understanding of what you're going to write
1. Forces you to write cleaner code
1. Prevents over coding

#### Red-Green-Refactor

TDD often follows the "Red-Green-Refactor" development cycle:

1. <span style="color:red">RED</span>: Write a test, which should fail when you run it
1. <span style="color:green">GREEN</span>: Write just enough code for the test to pass
1. <span style="color:orange">REFACTOR</span>: Refactor code and retest, again and again (if necessary)

## Project Setup

Start by cloning down the base project:

```sh
$ git clone https://github.com/mjhea0/node-koa-api \
  --branch v1 --single-branch
$ cd node-koa-api
```

Then, check out the [v1](https://github.com/mjhea0/node-koa-api/releases/tag/v1) tag to the master branch and install the dependencies:

```sh
$ git checkout tags/v1 -b master
$ npm install
```

Run two quick sanity checks to make sure all is well:

```sh
$ npm start
It works!

$ npm test
Sample Test
  ✓ should pass

1 passing (8ms)
```

Take a quick look at the project structure before moving on.

### Koa

As always, we'll begin with the obligatory hello world. But first, since we're following TDD, let's write a quick test.

Install [Chai HTTP](https://github.com/chaijs/chai-http) so we can test HTTP calls:

```sh
$ npm install chai-http@3.0.0 --save-dev
```

Create a new file in the "test" directory called *routes.index.test.js*:

```javascript
process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../src/server/index');

describe('routes : index', () => {

  describe('GET /', () => {
    it('should return json', (done) => {
      chai.request(server)
      .get('/')
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.eql(200);
        res.type.should.eql('application/json');
        res.body.status.should.equal('success');
        res.body.message.should.eql('hello, world!');
        done();
      });
    });
  });

});
```

So, within the second `describe` block, we have a single `it` statement, which defines a test case. In this simple case, we're testing the response from a GET request to the main route, `/`.

Run the test via `npm test`. You should see the following error since the server is not setup:

```sh
TypeError: app.address is not a function
```

Next, let's stand up a quick Koa server. Install Koa:

```sh
$ npm install koa@2.3.0 --save
```

Then, update *src/server/index.js* like so:

```javascript
const Koa = require('koa');

const app = new Koa();
const PORT = 1337;

app.use(async (ctx) => {
  ctx.body = {
    status: 'success',
    message: 'hello, world!'
  };
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
```

Here, we created a new instance of Koa and then mounted a basic async function to the app. This function takes the Koa [context](http://koajs.com/#context) as a parameter, `ctx`. It's worth noting that this object encapsulates both the Node request and response objects. We then set the return value to `ctx.body`, which will be sent back as the response body when user hits any route.

Run the Koa server, via `npm start`, and then navigate to [http://localhost:1337/](http://localhost:1337/). You should see:

```json
{
  "status": "success",
  "message": "hello, world!"
}
```

Once done, kill the server and then run the tests. They should now pass.

### Database

Moving right along, [download](https://www.postgresql.org/download/) and install Postgres, if you don't already have it, and then fire up the server on port 5432.

Along with Postgres, we'll use [pg](https://node-postgres.com/) and [Knex](http://knexjs.org/) to interact with the database itself:

```sh
$ npm install pg@7.1.2 knex@0.13.0 --save
```

Install Knex globally as well so you can use the CLI tool:

```sh
$ npm install knex@0.13.0 -g
```

Next, we need to create two new databases, one for our development environment and the other for test environment.

Open psql in the terminal, and create the databases:

```sh
$ psql
psql (9.6.1)

# CREATE DATABASE koa_api;
CREATE DATABASE
# CREATE DATABASE koa_api_test;
CREATE DATABASE
# \q
```

With that, we can now initialize Knex.

### Knex

Run `knex init` in the project root to initialize a new [config file](http://knexjs.org/#knexfile) called *knexfile.js*. Override the default info with:

```javascript
const path = require('path');

const BASE_PATH = path.join(__dirname, 'src', 'server', 'db');

module.exports = {
  test: {
    client: 'pg',
    connection: 'postgres://username:password@localhost:5432/koa_api_test',
    migrations: {
      directory: path.join(BASE_PATH, 'migrations')
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds')
    }
  },
  development: {
    client: 'pg',
    connection: 'postgres://username:password@localhost:5432/koa_api',
    migrations: {
      directory: path.join(BASE_PATH, 'migrations')
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds')
    }
  }
};
```

> **NOTE:** Make sure to replace `username` and `password` with your database username and password, respectively.

Next, let's create a new migration to define the database schema:

```sh
$ knex migrate:make movies
```

This created a "src/server/db/migrations" folder with a timestamped migration file. Update the file like so:

```javascript
exports.up = (knex, Promise) => {
  return knex.schema.createTable('movies', (table) => {
    table.increments();
    table.string('name').notNullable().unique();
    table.string('genre').notNullable();
    table.integer('rating').notNullable();
    table.boolean('explicit').notNullable();
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('movies');
};
```

Add a new file to the "db" folder called *connection.js* to, well, connect to the database using the appropriate Knex configuration based on the environment (development, test, staging, production, etc.):

```javascript
const environment = process.env.NODE_ENV || 'development';
const config = require('../../../knexfile.js')[environment];

module.exports = require('knex')(config);
```

Apply the migration to the development database:

```sh
$ knex migrate:latest --env development
```

Next, let's create a seed file to populate the database with some initial data:

```sh
$ knex seed:make movies_seed
```

This added a seed file to "src/server/db/seeds"; update it to match the database schema:

```javascript
exports.seed = (knex, Promise) => {
  return knex('movies').del()
  .then(() => {
    return knex('movies').insert({
      name: 'The Land Before Time',
      genre: 'Fantasy',
      rating: 7,
      explicit: false
    });
  })
  .then(() => {
    return knex('movies').insert({
      name: 'Jurassic Park',
      genre: 'Science Fiction',
      rating: 9,
      explicit: true
    });
  })
  .then(() => {
    return knex('movies').insert({
      name: 'Ice Age: Dawn of the Dinosaurs',
      genre: 'Action/Romance',
      rating: 5,
      explicit: false
    });
  });
};
```

Apply the seed:

```sh
$ knex seed:run --env development
```

Finally, hop back into psql to ensure the database has been updated:

```sh
$ psql
psql (9.6.1)

# \c koa_api
You are now connected to database "koa_api".
# select * from movies;
 id |              name              |      genre      | rating | explicit
----+--------------------------------+-----------------+--------+----------
  1 | The Land Before Time           | Fantasy         |      7 | f
  2 | Jurassic Park                  | Science Fiction |      9 | t
  3 | Ice Age: Dawn of the Dinosaurs | Action/Romance  |      5 | f
(3 rows)

# \q
```

### Koa Router

Unlike Express, Koa does not provide any routing middleware. There are a number of options available, but we'll use [koa-router](https://github.com/alexmingoia/koa-router) due to its simplicity.

```sh
$ npm install koa-router@7.2.1 --save
```

Create a new folder called "routes" within "server", and then add an *index.js* file to it:

```javascript
const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = {
    status: 'success',
    message: 'hello, world!'
  };
})

module.exports = router;
```

Then, update *src/server/index.js*:

```javascript
const Koa = require('koa');
const indexRoutes = require('./routes/index');

const app = new Koa();
const PORT = process.env.PORT || 1337;

app.use(indexRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
```

Essentially, we moved the `/` route out of the main application file. Ensure the tests still pass before moving on.

## Routes

Again, we'll take a test-first approach to writing our routes:

| URL                 | HTTP Verb | Action                |
|---------------------|-----------|-----------------------|
| /api/v1/movies      | GET       | Return ALL movies     |
| /api/v1/movies/:id  | GET       | Return a SINGLE movie |
| /api/v1/movies      | POST      | Add a movie           |
| /api/v1/movies/:id  | PUT       | Update a movie        |
| /api/v1/movies/:id  | DELETE    | Delete a movie        |

Before diving in, let's add some structure. First, add a new folder called "queries" to the "db" folder, and then add a file called *movies.js* to that newly created folder:

```javascript
const knex = require('../connection');
```

We'll add the database queries associated with the `movies` resource to this file. Next, add a new route file called *movies.js* to "routes":

```javascript
const Router = require('koa-router');
const queries = require('../db/queries/movies');

const router = new Router();
const BASE_URL = `/api/v1/movies`;

module.exports = router;
```

Then, wire this file up to the main application in *src/server/index.js*:

```javascript
const Koa = require('koa');
const indexRoutes = require('./routes/index');
const movieRoutes = require('./routes/movies');

const app = new Koa();
const PORT = process.env.PORT || 1337;

app.use(indexRoutes.routes());
app.use(movieRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
```

Finally, add a new test file to "test" called *routes.movies.test.js*:

```javascript
process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../src/server/index');
const knex = require('../src/server/db/connection');

describe('routes : movies', () => {

  beforeEach(() => {
    return knex.migrate.rollback()
    .then(() => { return knex.migrate.latest(); })
    .then(() => { return knex.seed.run(); });
  });

  afterEach(() => {
    return knex.migrate.rollback();
  });


});
```

So, when the tests are ran, the `beforeEach()` is fired before any of test specs, applying the migrations to the test database. After the specs run, the database is rolled back to a pristine state in the `afterEach()`.

With that, let's add our routes!

### GET All Movies

Start with a test:

```javascript
describe('GET /api/v1/movies', () => {
  it('should return all movies', (done) => {
    chai.request(server)
    .get('/api/v1/movies')
    .end((err, res) => {
      // there should be no errors
      should.not.exist(err);
      // there should be a 200 status code
      res.status.should.equal(200);
      // the response should be JSON
      res.type.should.equal('application/json');
      // the JSON response body should have a
      // key-value pair of {"status": "success"}
      res.body.status.should.eql('success');
      // the JSON response body should have a
      // key-value pair of {"data": [3 movie objects]}
      res.body.data.length.should.eql(3);
      // the first object in the data array should
      // have the right keys
      res.body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      done();
    });
  });
});
```

Take note of the code comments. Review [Testing Node.js With Mocha and Chai](http://mherman.org/blog/2015/09/10/testing-node-js-with-mocha-and-chai/) for more info. Run the test to make sure it fails:

```sh
Uncaught AssertionError: expected [Error: Not Found] to not exist
```

To get the test to pass, add the route handler to *src/server/routes/movies.js*:

```javascript
router.get(BASE_URL, async (ctx) => {
  try {
    const movies = await queries.getAllMovies();
    ctx.body = {
      status: 'success',
      data: movies
    };
  } catch (err) {
    console.log(err)
  }
})
```

Add the DB query to *src/server/db/queries/movies.js*:

```javascript
const knex = require('../connection');

function getAllMovies() {
  return knex('movies')
  .select('*');
}

module.exports = {
  getAllMovies
};
```

So, `getAllMovies()` returns a promise object. Then, within the `async` function, execution stops at the `await`. Execution continues once the promise is resolved.

Run the tests to ensure they pass:

```sh
routes : index
  GET /
    ✓ should return json

routes : movies
  GET /api/v1/movies
    ✓ should return all movies

Sample Test
  ✓ should pass


3 passing (177ms)
```

### GET Single Movie

What if we just want a single movie?

```javascript
describe('GET /api/v1/movies/:id', () => {
  it('should respond with a single movie', (done) => {
    chai.request(server)
    .get('/api/v1/movies/1')
    .end((err, res) => {
      // there should be no errors
      should.not.exist(err);
      // there should be a 200 status code
      res.status.should.equal(200);
      // the response should be JSON
      res.type.should.equal('application/json');
      // the JSON response body should have a
      // key-value pair of {"status": "success"}
      res.body.status.should.eql('success');
      // the JSON response body should have a
      // key-value pair of {"data": 1 movie object}
      res.body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      done();
    });
  });
});
```

Make sure the test fails, and then add the route handler:

```javascript
router.get(`${BASE_URL}/:id`, async (ctx) => {
  try {
    const movie = await queries.getSingleMovie(ctx.params.id);
    ctx.body = {
      status: 'success',
      data: movie
    };
  } catch (err) {
    console.log(err)
  }
})
```

Add the query as well:

```javascript
function getSingleMovie(id) {
  return knex('movies')
  .select('*')
  .where({ id: parseInt(id) });
}
```

Don't forget to export it:

```javascript
module.exports = {
  getAllMovies,
  getSingleMovie,
};
```

The test should now pass. Before moving on though, what happens if the movie ID does not exist? Start with a test to find out.

Add an `it` block to the previous `describe` block:

```javascript
it('should throw an error if the movie does not exist', (done) => {
  chai.request(server)
  .get('/api/v1/movies/9999999')
  .end((err, res) => {
    // there should an error
    should.exist(err);
    // there should be a 404 status code
    res.status.should.equal(404);
    // the response should be JSON
    res.type.should.equal('application/json');
    // the JSON response body should have a
    // key-value pair of {"status": "error"}
    res.body.status.should.eql('error');
    // the JSON response body should have a
    // key-value pair of {"message": "That movie does not exist."}
    res.body.message.should.eql('That movie does not exist.');
    done();
  });
});
```

Make sure the test fails before updating the code:

```javascript
router.get(`${BASE_URL}/:id`, async (ctx) => {
  try {
    const movie = await queries.getSingleMovie(ctx.params.id);
    if (movie.length) {
      ctx.body = {
        status: 'success',
        data: movie
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That movie does not exist.'
      };
    }
  } catch (err) {
    console.log(err)
  }
})
```

The test should now pass.

### POST

How about adding a new movie to the database?

```javascript
describe('POST /api/v1/movies', () => {
  it('should return the movie that was added', (done) => {
    chai.request(server)
    .post('/api/v1/movies')
    .send({
      name: 'Titanic',
      genre: 'Drama',
      rating: 8,
      explicit: true
    })
    .end((err, res) => {
      // there should be no errors
      should.not.exist(err);
      // there should be a 201 status code
      // (indicating that something was "created")
      res.status.should.equal(201);
      // the response should be JSON
      res.type.should.equal('application/json');
      // the JSON response body should have a
      // key-value pair of {"status": "success"}
      res.body.status.should.eql('success');
      // the JSON response body should have a
      // key-value pair of {"data": 1 movie object}
      res.body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      done();
    });
  });
});
```

Koa does not parse the request body by default, so we need to add middleware for body parsing. [koa-bodyparser](https://github.com/koajs/bodyparser) is a popular choice:

```sh
$ npm install koa-bodyparser@4.2.0 --save
```

Add the requirement to *src/server/index.js*, and then make sure to mount the middleware to the app before the routes:

```javascript
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const indexRoutes = require('./routes/index');
const movieRoutes = require('./routes/movies');

const app = new Koa();
const PORT = process.env.PORT || 1337;

app.use(bodyParser());
app.use(indexRoutes.routes());
app.use(movieRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
```

Add the route handler:

```javascript
router.post(`${BASE_URL}`, async (ctx) => {
  try {
    const movie = await queries.addMovie(ctx.request.body);
    if (movie.length) {
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        data: movie
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    console.log(err)
  }
})
```

DB query:

```javascript
function addMovie(movie) {
  return knex('movies')
  .insert(movie)
  .returning('*');
}
```

What if the payload does not include the correct keys? Add a new `it` block:

```javascript
it('should throw an error if the payload is malformed', (done) => {
  chai.request(server)
  .post('/api/v1/movies')
  .send({
    name: 'Titanic'
  })
  .end((err, res) => {
    // there should an error
    should.exist(err);
    // there should be a 400 status code
    res.status.should.equal(400);
    // the response should be JSON
    res.type.should.equal('application/json');
    // the JSON response body should have a
    // key-value pair of {"status": "error"}
    res.body.status.should.eql('error');
    // the JSON response body should have a message key
    should.exist(res.body.message);
    done();
  });
});
```

Then update the route handler:

```javascript
router.post(`${BASE_URL}`, async (ctx) => {
  try {
    const movie = await queries.addMovie(ctx.request.body);
    if (movie.length) {
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        data: movie
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: 'error',
        message: 'Something went wrong.'
      };
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})
```

### PUT

Test:

```javascript
describe('PUT /api/v1/movies', () => {
  it('should return the movie that was updated', (done) => {
    knex('movies')
    .select('*')
    .then((movie) => {
      const movieObject = movie[0];
      chai.request(server)
      .put(`/api/v1/movies/${movieObject.id}`)
      .send({
        rating: 9
      })
      .end((err, res) => {
        // there should be no errors
        should.not.exist(err);
        // there should be a 200 status code
        res.status.should.equal(200);
        // the response should be JSON
        res.type.should.equal('application/json');
        // the JSON response body should have a
        // key-value pair of {"status": "success"}
        res.body.status.should.eql('success');
        // the JSON response body should have a
        // key-value pair of {"data": 1 movie object}
        res.body.data[0].should.include.keys(
          'id', 'name', 'genre', 'rating', 'explicit'
        );
        // ensure the movie was in fact updated
        const newMovieObject = res.body.data[0];
        newMovieObject.rating.should.not.eql(movieObject.rating);
        done();
      });
    });
  });
});
```

Route handler:

```javascript
router.put(`${BASE_URL}/:id`, async (ctx) => {
  try {
    const movie = await queries.updateMovie(ctx.params.id, ctx.request.body);
    if (movie.length) {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: movie
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That movie does not exist.'
      };
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})
```

DB query:

```javascript
function updateMovie(id, movie) {
  return knex('movies')
  .update(movie)
  .where({ id: parseInt(id) })
  .returning('*');
}
```

Did you notice that we are already handling a case where the movie does not exist in the route handler? Let's add a test for that:

```javascript
it('should throw an error if the movie does not exist', (done) => {
  chai.request(server)
  .put('/api/v1/movies/9999999')
  .send({
    rating: 9
  })
  .end((err, res) => {
    // there should an error
    should.exist(err);
    // there should be a 404 status code
    res.status.should.equal(404);
    // the response should be JSON
    res.type.should.equal('application/json');
    // the JSON response body should have a
    // key-value pair of {"status": "error"}
    res.body.status.should.eql('error');
    // the JSON response body should have a
    // key-value pair of {"message": "That movie does not exist."}
    res.body.message.should.eql('That movie does not exist.');
    done();
  });
});
```

### DELETE

Test:

```javascript
describe('DELETE /api/v1/movies/:id', () => {
  it('should return the movie that was deleted', (done) => {
    knex('movies')
    .select('*')
    .then((movies) => {
      const movieObject = movies[0];
      const lengthBeforeDelete = movies.length;
      chai.request(server)
      .delete(`/api/v1/movies/${movieObject.id}`)
      .end((err, res) => {
        // there should be no errors
        should.not.exist(err);
        // there should be a 200 status code
        res.status.should.equal(200);
        // the response should be JSON
        res.type.should.equal('application/json');
        // the JSON response body should have a
        // key-value pair of {"status": "success"}
        res.body.status.should.eql('success');
        // the JSON response body should have a
        // key-value pair of {"data": 1 movie object}
        res.body.data[0].should.include.keys(
          'id', 'name', 'genre', 'rating', 'explicit'
        );
        // ensure the movie was in fact deleted
        knex('movies').select('*')
        .then((updatedMovies) => {
          updatedMovies.length.should.eql(lengthBeforeDelete - 1);
          done();
        });
      });
    });
  });
  it('should throw an error if the movie does not exist', (done) => {
    chai.request(server)
    .delete('/api/v1/movies/9999999')
    .end((err, res) => {
      // there should an error
      should.exist(err);
      // there should be a 404 status code
      res.status.should.equal(404);
      // the response should be JSON
      res.type.should.equal('application/json');
      // the JSON response body should have a
      // key-value pair of {"status": "error"}
      res.body.status.should.eql('error');
      // the JSON response body should have a
      // key-value pair of {"message": "That movie does not exist."}
      res.body.message.should.eql('That movie does not exist.');
      done();
    });
  });
});
```

Route handler:

```javascript
router.delete(`${BASE_URL}/:id`, async (ctx) => {
  try {
    const movie = await queries.deleteMovie(ctx.params.id);
    if (movie.length) {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: movie
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That movie does not exist.'
      };
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
})
```

```javascript
function deleteMovie(id) {
  return knex('movies')
  .del()
  .where({ id: parseInt(id) })
  .returning('*');
}
```

Run the tests to ensure all pass:

```
routes : index
  GET /
    ✓ should return json

routes : movies
  GET /api/v1/movies
    ✓ should return all movies
  GET /api/v1/movies/:id
    ✓ should respond with a single movie
    ✓ should throw an error if the movie does not exist
  POST /api/v1/movies
    ✓ should return the movie that was added
    ✓ should throw an error if the payload is malformed
  PUT /api/v1/movies
    ✓ should return the movie that was updated
    ✓ should throw an error if the movie does not exist
  DELETE /api/v1/movies/:id
    ✓ should return the movie that was deleted
    ✓ should throw an error if the movie does not exist

Sample Test
  ✓ should pass


11 passing (697ms)
```

## Next Steps

With that, you now have a basic Koa RESTful API up and running.

Test your knowledge by adding additional test cases and error handlers to cover anything missed. You may also want to convert an existing Express app over to Koa. Check out the [Koa Examples](https://github.com/koajs/examples) repo for more code examples.

Add end-to-end tests with [TestCafe](http://mherman.org/blog/2017/03/19/functional-testing-with-testcafe/#.WZxCvnd95E4).

Finally, this tutorial took advantage of async/await functions in Koa version 2. If you're interested in comparing this pattern to the generator pattern found in Koa 1, review the code in the [Koa API](https://github.com/mjhea0/koa-api) repo.

Grab the final code from the [node-koa-api](https://github.com/mjhea0/node-koa-api) repo. There's [slides](http://mherman.org/presentations/node-koa-api) as well.

Please add questions and/or comments below. Cheers!
