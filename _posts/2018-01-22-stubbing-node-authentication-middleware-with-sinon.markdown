---
layout: post
title: "Stubbing Node Authentication Middleware with Sinon"
date: 2018-01-22 08:10:05
comments: true
toc: true
categories: [node, koa, auth, mocha, testing]
keywords: "node, node.js, koa, testing, sinon, sinon.js, stub, mock, passport, authentication, koa 2 javascript, unit tests, unit testing, mocha, chai"
description: "This post looks at how to stub Passport authentication middleware with Sinon.js during test runs."
---

[Last time](http://mherman.org/blog/2018/01/02/user-authentication-with-passport-and-koa/) we looked at how to set up [Passport](http://www.passportjs.org/) local authentication with Node and Koa. We took a test-first approach and wrote the majority of tests first. That said, there were a two routes that we could not test (`/auth/status` and `/auth/logout`) since they required us to to bypass the `isAuthenticated()` method and manually set a cookie.

In this post, we'll look at how to stub Passport authentication middleware and calls to both Postgres and Redis with [Sinon.js](http://sinonjs.org/).

<div style="text-align:center;">
  <img src="/assets/img/blog/koa/sinon-passport.png" style="max-width: 90%; border:0; box-shadow: none;" alt="sinon.js and passport.js">
</div>

### Parts

This article is part of a 4-part Koa and Sinon series...

1. [Building a RESTful API with Koa and Postgres](http://mherman.org/blog/2017/08/23/building-a-restful-api-with-koa-and-postgres)
1. [Stubbing HTTP Requests with Sinon](http://mherman.org/blog/2017/11/06/stubbing-http-requests-with-sinon)
1. [User Authentication with Passport and Koa](http://mherman.org/blog/2018/01/02/user-authentication-with-passport-and-koa)
1. [Stubbing Node Authentication Middleware with Sinon](http://mherman.org/blog/2018/01/22/stubbing-node-authentication-middleware-with-sinon) (this article)

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Objectives

By the end of this tutorial, you will be able to...

1. Discuss the overall client/server authentication workflow
1. Describe what a stub is and why you would want to use them in your test suites
1. Add Sinon to an existing Mocha test structure
1. Refactor each of the auth integration tests, stubbing Passport-related authentication middleware and calls to Postgres and Redis

## Project Setup

Clone the [node-koa-api](https://github.com/mjhea0/node-koa-api) repo (if you haven't already), and then check out the [v3](https://github.com/mjhea0/node-koa-api/releases/tag/v3) tag to the master branch and install the dependencies:

```sh
$ git clone https://github.com/mjhea0/node-koa-api \
  --branch v3 --single-branch
$ cd node-koa-api
$ git checkout tags/v3 -b master
$ npm install
```

Review the project structure:

```sh
├── knexfile.js
├── package.json
├── src
│   └── server
│       ├── auth.js
│       ├── db
│       │   ├── connection.js
│       │   ├── migrations
│       │   │   ├── 20170817152841_movies.js
│       │   │   └── 20171231115201_users.js
│       │   ├── queries
│       │   │   ├── movies.js
│       │   │   └── users.js
│       │   └── seeds
│       │       ├── movies_seed.js
│       │       └── users.js
│       ├── index.js
│       ├── routes
│       │   ├── auth.js
│       │   ├── index.js
│       │   └── movies.js
│       └── views
│           ├── login.html
│           ├── register.html
│           └── status.html
└── test
    ├── routes.auth.test.js
    ├── routes.index.test.js
    ├── routes.movies.test.js
    └── sample.test.js
```

Take note of the routes as well:

| URL                 | HTTP Verb | Action                    |
|---------------------|-----------|---------------------------|
| /                   | GET       | Sanity Check              |
| /api/v1/movies      | GET       | Return ALL movies         |
| /api/v1/movies/:id  | GET       | Return a SINGLE movie     |
| /api/v1/movies      | POST      | Add a movie               |
| /api/v1/movies/:id  | PUT       | Update a movie            |
| /api/v1/movies/:id  | DELETE    | Delete a movie            |
| /auth/register      | GET       | Render the register view  |
| /auth/register      | POST      | Register a new user       |
| /auth/login         | GET       | Render the login view     |
| /auth/login         | POST      | Log a user in             |
| /auth/status        | GET       | Render the status page    |
| /auth/logout        | GET       | Log a user out            |

In short, this is a basic RESTful API with local authentication, powered by Koa and Passport.

> Want to learn how to build this project? Review the [Building a RESTful API With Koa and Postgres](http://mherman.org/blog/2017/08/23/building-a-restful-api-with-koa-and-postgres) and [User Authentication with Passport and Koa](http://mherman.org/blog/2018/01/02/user-authentication-with-passport-and-koa) blog posts.

Moving on, [download](https://www.postgresql.org/download/) and install Postgres (if necessary). Then, spin up the server on port 5432. Open psql, in your terminal and create two new databases:

```sh
$ psql

# CREATE DATABASE koa_api;
CREATE DATABASE
# CREATE DATABASE koa_api_test;
CREATE DATABASE
# \q
```

Spin up Redis in a new terminal tab:

```sh
$ redis-server
```

Ensure the tests pass:

```
$ npm test

Server listening on port: 1337
  routes : auth
    GET /auth/register
      ✓ should render the register view
    POST /auth/register
      ✓ should register a new user (241ms)
    GET /auth/login
      ✓ should render the login view
    POST /auth/login
      ✓ should login a user (100ms)

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


  15 passing (3s)
```

Apply the migrations, and seed the database:

```sh
$ knex migrate:latest --env development
$ knex seed:run --env development
```

Run the Koa server, via `npm start`, and test out the following routes to get a feel for the app's current functionality:

1. http://localhost:1337/
1. http://localhost:1337/api/v1/movies
1. http://localhost:1337/auth/register
1. http://localhost:1337/auth/login
1. http://localhost:1337/auth/status
1. http://localhost:1337/auth/logout

Install Sinon:

```sh
$ npm install sinon@4.1.5 --save-dev
```

## Test Structure

Let's quickly update the test structure to differentiate between unit and integration tests and add a new file for the stubbed tests.

Add two new folders to the "test" directory:

1. "unit"
1. "integration"

Then, move the *sample.test.js* to the "unit" folder and the remaining test files to the "integration" folder.

```sh
└── test
    ├── integration
    │   ├── routes.auth.test.js
    │   ├── routes.index.test.js
    │   └── routes.movies.test.js
    └── unit
        └── sample.test.js
```

Update the `test` command in *package.json* so that the tests are discovered in the newly created folders:

```
"test": "./node_modules/mocha/bin/_mocha ./test/**/*.test.js"
```

You'll need to update the paths in each of the test files as well:

```javascript
const server = require('../../src/server/index');
const knex = require('../../src/server/db/connection');
```

Ensure the tests still pass before moving on.

Next, create a duplicate of *test/integration/routes.auth.test.js* called *test/integration/routes.auth.stub.test.js*.

Then, update the first `describe` block along with the `beforeEach` and `afterEach`:

```javascript
describe.only('routes : auth - stubbed', () => {

  beforeEach(() => {});

  afterEach(() => {});

...

});
```

So, we're no longer applying the migrations and only (via `.only`) running the tests in this `describe` block during test runs.

Run the tests:


```sh
$ npm test
```

As expected, you should see an error since the database tables do not exist:

```sh
error: relation "users" does not exist
```

## Why Stub?

Before beginning, review the following two sections from the [Stubbing HTTP Requests with Sinon](http://mherman.org/blog/2017/11/06/stubbing-http-requests-with-sinon) blog post to get an overview of stubbing:

1. [What is a Stub?](http://mherman.org/blog/2017/11/06/stubbing-http-requests-with-sinon/#what-is-a-stub)
1. [Why Stub?](http://mherman.org/blog/2017/11/06/stubbing-http-requests-with-sinon/#why-stub)

The end goal of this post is to be able to test routes that require authentication *without* actually going through either of the following authentication flows...

> Be sure to review the actual code as you're reading through each flow.

*First flow:*

1. User submits auth credentials (username and password), which are then sent to the server via a POST request to `/auth/login`.
1. `passport.authenticate()` is called and the credentials are checked against the user info stored in the database.
1. If the credentials are correct, `passport.serializeUser()` is fired and the user `id` is serialized to the Redis session store via the `ctx.login()` method.
1. Finally, a cookie is generated, which is sent back with the response to the client and that cookie is then set.

*Second flow:*

1. An authenticated user hits a route requiring a user to be authenticated (like `/auth/status`).
1. `isAuthenticated()` is called, which then verifies that (a) a user is in session and (b) that user is found within the database (via `passport.deserializeUser()`).
1. If correct, the end user is allowed to view the route and the appropriate response is sent.

<div style="text-align:left;padding-top:10px;padding-left:10px;">
  <img src="/assets/img/blog/koa/client-server-auth-flow.png" style="max-width: 90%;border:0;box-shadow:none;" alt="client/server auth flow">
</div>

<br>

Let's get to it!

## Postgres Stub

We'll start by stubbing the Postgres `addUser` query (which is a promise) called in the POST `/auth/register` route handler in *src/server/routes/auth.js*:

```javascript
const user = await queries.addUser(ctx.request.body);
```

Think about how this should normally resolve. Something like this, right?

```
[
  {
    id: 1,
    username: 'michael',
    password: 'something'
  }
];
```

Update the test like so:

```javascript
describe.only('POST /auth/register', () => {
  beforeEach(() => {
    const user = [
      {
        id: 1,
        username: 'michael',
        password: 'something'
      }
    ];
    this.query = sinon.stub(queries, 'addUser').resolves(user);
  });
  afterEach(() => {
    this.query.restore();
  });
  it('should register a new user', (done) => {
    chai.request(server)
    .post('/auth/register')
    .send({
      username: 'michael',
      password: 'herman'
    })
    .end((err, res) => {
      res.redirects[0].should.contain('/auth/status');
      done();
    });
  });
});
```

Here, we stubbed the `addUser` query in the `beforeEach()`, passing in the expected `user` info for when the query is resolved, and then restored the functionality in the `afterEach()`.

Add the imports to the top:

```javascript
const sinon = require('sinon');
const queries = require('../../src/server/db/queries/users');
```

The test should fail since we're still accessing the database in the Passport `authenticate` method.

## Passport Stub

We can use a similar pattern for stubbing the `authenticate` method:

```javascript
beforeEach(() => {
  this.authenticate = sinon.stub(passport, 'authenticate').returns(() => {});
});

afterEach(() => {
  this.authenticate.restore();
});
```

Add this to the outer `describe` block so it's applied to all tests. Then, to simulate the calling of the callback, update the `beforeEach` in the nested `describe`:

```javascript
beforeEach(() => {
  const user = [
    {
      id: 1,
      username: 'michael',
      password: 'something'
    }
  ];
  this.query = sinon.stub(queries, 'addUser').resolves(user);
  this.authenticate.yields(null, { id: 1 });
});
```

You should have something similar to:

```javascript
describe.only('routes : auth - stubbed', () => {

  beforeEach(() => {
    this.authenticate = sinon.stub(passport, 'authenticate').returns(() => {});
  });

  afterEach(() => {
    this.authenticate.restore();
  });

  ...

  describe('POST /auth/register', () => {
    beforeEach(() => {
      const user = [
        {
          id: 1,
          username: 'michael',
          password: 'something'
        }
      ];
      this.query = sinon.stub(queries, 'addUser').resolves(user);
      this.authenticate.yields(null, { id: 1 });
    });
    afterEach(() => {
      this.query.restore();
    });
    it('should register a new user', (done) => {
      chai.request(server)
      .post('/auth/register')
      .send({
        username: 'michael',
        password: 'herman'
      })
      .end((err, res) => {
        res.redirects[0].should.contain('/auth/status');
        done();
      });
    });
  });

...

});
```

Add the `beforeEach` to the POST `/auth/login` test as well:

```javascript
describe('POST /auth/login', () => {
  beforeEach(() => {
    this.authenticate.yields(null, { id: 1 });
  });
  it('should login a user', (done) => {
    chai.request(server)
    .post('/auth/login')
    .send({
      username: 'jeremy',
      password: 'johnson'
    })
    .end((err, res) => {
      res.redirects[0].should.contain('/auth/status');
      done();
    });
  });
});
```


Run the tests:

```
$ npm test

Server listening on port: 1337
  routes : auth - stubbed
    GET /auth/register
      ✓ should render the register view
    POST /auth/register
      ✓ should register a new user
    GET /auth/login
      ✓ should render the login view
    POST /auth/login
      ✓ should login a user
```

They should all pass!

Notice how we passed in some dummy data to the callback, `null, { id: 1 }`. What if we passed `false` in for the second parameter instead of `{ id: 1 }`? Review the following code in *src/server/routes/auth.js* for more info:

```javascript
passport.use(new LocalStrategy(options, (username, password, done) => {
  knex('users').where({ username }).first()
  .then((user) => {
    if (!user) return done(null, false);
    if (!comparePass(password, user.password)) {
      return done(null, false);
    } else {
      return done(null, user);
    }
  })
  .catch((err) => { return done(err); });
}));
```

How would you write a test, and stub it properly, for a situation where the user is found but the password is incorrect?

Add a new test:

```javascript
describe('POST /auth/login', () => {
  beforeEach(() => {
    this.authenticate.yields(null, false);
  });
  it('should not login a user if the password is incorrect', (done) => {
    chai.request(server)
    .post('/auth/login')
    .send({
      username: 'jeremy',
      password: 'notcorrect'
    })
    .end((err, res) => {
      should.exist(err);
      res.redirects.length.should.eql(0);
      res.status.should.eql(400);
      res.type.should.eql('application/json');
      res.body.status.should.eql('error');
      done();
    });
  });
});
```

Update the `serializeUser` and `deserializeUser` methods too:

```javascript
beforeEach(() => {
  this.authenticate = sinon.stub(passport, 'authenticate').returns(() => {});
  this.serialize = sinon.stub(passport, 'serializeUser').returns(() => {});
  this.deserialize = sinon.stub(passport, 'deserializeUser').returns(
    () => {});
});

afterEach(() => {
  this.authenticate.restore();
  this.serialize.restore();
  this.deserialize.restore();
});
```

Add the appropriate yields:

```javascript
this.serialize.yields(null, { id: 1 });
this.deserialize.yields(null, { id: 1 });
```

Ensure the tests still pass. Then, bring down the Postgres server and run them again. Again, they should pass.

It's worth noting that these tests will run faster than the full integration flavor in *test/integration/routes.auth.test.js* since we're no longer hitting Postgres - 82ms vs 1s. This may not be significant now, but think if the test suite had hundreds of tests all hitting the database - stubbing becomes super important for developer productivity.

## Redis Stub

Kill the Redis server. Try running the tests. You should see a few failures since `ctx.login();` adds the session to Redis:

```
1) routes : auth - stubbed POST /auth/register should register a new user:
   Error: Timeout of 2000ms exceeded.
   For async tests and hooks, ensure "done()" is called;
   if returning a Promise, ensure it resolves.


2) routes : auth - stubbed POST /auth/login should login a user:
   Error: Timeout of 2000ms exceeded.
   For async tests and hooks, ensure "done()" is called;
   if returning a Promise, ensure it resolves.
```

To stub, let's refactor out the initialization of the session store in *src/server/index.js*.

Add a new file to "src/server" called *session.js*:

```javascript
const RedisStore = require('koa-redis');

module.exports = new RedisStore();
```

Then, within *src/server/index.js*, replace:

```javascript
const RedisStore = require('koa-redis');
```

With:

```javascript
const store = require('./session');
```

Update the mounting of the session to the middleware:

```javascript
// sessions
app.keys = ['super-secret-key'];
app.use(session({ store }, app));
```

Fire the Redis server back up and run the tests to ensure that we didn't break the existing functionality. Once done, kill the Redis server again and update the `beforeEach` and `afterEach` blocks:

```javascript
beforeEach(() => {
  this.store = sinon.stub(store, 'set');
  this.authenticate = sinon.stub(passport, 'authenticate').returns(() => {});
  this.serialize = sinon.stub(passport, 'serializeUser').returns(() => {});
  this.deserialize = sinon.stub(passport, 'deserializeUser').returns(
    () => {});
});

afterEach(() => {
  this.authenticate.restore();
  this.serialize.restore();
  this.deserialize.restore();
  this.store.restore();
});
```

Import:

```javascript
const store = require('../../src/server/session');
```

The tests should now pass:

```
$ npm test

Server listening on port: 1337
  routes : auth - stubbed
    GET /auth/register
      ✓ should render the register view
    POST /auth/register
      ✓ should register a new user
    GET /auth/login
      ✓ should render the login view
    POST /auth/login
      ✓ should login a user
    POST /auth/login
      ✓ should not login a user if the password is incorrect
```

We can also stub the `get` and `destroy` [methods](https://github.com/koajs/session#external-session-stores) from [koa-session](https://github.com/koajs/session).

## Ensure Authenticated Stub

Moving right along, let's stub out the `ctx.isAuthenticated()` method. Again, we'll need to do a quick refactor first.

First, add a new file to "src/server/routes/" called *_helpers.js*:

```javascript
function ensureAuthenticated(context) {
  return context.isAuthenticated();
}

module.exports = {
  ensureAuthenticated,
};
```

Import the function into *src/server/routes/auth.js*:

```javascript
const helpers = require('./_helpers');
```

Refactor the GET `/auth/status`, GET `/auth/logout`, and GET `/auth/login` routes to use the new helper:

```javascript
router.get('/auth/login', async (ctx) => {
  if (!helpers.ensureAuthenticated()) {
    ctx.type = 'html';
    ctx.body = fs.createReadStream('./src/server/views/login.html');
  } else {
    ctx.redirect('/auth/status');
  }
});

router.get('/auth/logout', async (ctx) => {
  if (helpers.ensureAuthenticated(ctx)) {
    ctx.logout();
    ctx.redirect('/auth/login');
  } else {
    ctx.body = { success: false };
    ctx.throw(401);
  }
});

router.get('/auth/status', async (ctx) => {
  if (helpers.ensureAuthenticated(ctx)) {
    ctx.type = 'html';
    ctx.body = fs.createReadStream('./src/server/views/status.html');
  } else {
    ctx.redirect('/auth/login');
  }
});
```

Import the function again into the tests:

```javascript
const helpers = require('../../src/server/routes/_helpers');
```

Create the stub:

```javascript
beforeEach(() => {
  this.ensureAuthenticated = sinon.stub(
    helpers, 'ensureAuthenticated'
  ).returns(() => {});
  this.store = sinon.stub(store, 'set');
  this.authenticate = sinon.stub(passport, 'authenticate').returns(() => {});
  this.serialize = sinon.stub(passport, 'serializeUser').returns(() => {});
  this.deserialize = sinon.stub(passport, 'deserializeUser').returns(
    () => {});
});

afterEach(() => {
  this.authenticate.restore();
  this.serialize.restore();
  this.deserialize.restore();
  this.store.restore();
  this.ensureAuthenticated.restore();
});
```

Add the tests:

```javascript
describe('GET /auth/status', () => {
  beforeEach(() => {
    this.ensureAuthenticated.returns(true);
  });
  it('should render the status view', (done) => {
    chai.request(server)
    .get('/auth/status')
    .end((err, res) => {
      should.not.exist(err);
      res.redirects.length.should.eql(0);
      res.status.should.eql(200);
      res.type.should.eql('text/html');
      res.text.should.contain('<p>You are authenticated.</p>');
      done();
    });
  });
});

describe('GET /auth/login', () => {
  beforeEach(() => {
    this.ensureAuthenticated.returns(true);
  });
  it('should render the status view if the user is logged in', (done) => {
    chai.request(server)
    .get('/auth/login')
    .end((err, res) => {
      should.not.exist(err);
      res.redirects.length.should.eql(1);
      res.redirects[0].should.contain('/auth/status');
      res.status.should.eql(200);
      res.type.should.eql('text/html');
      res.text.should.contain('<p>You are authenticated.</p>');
      done();
    });
  });
});
```

Update the other GET `/auth/login` test:

```javascript
describe('GET /auth/login', () => {
  beforeEach(() => {
    this.ensureAuthenticated.returns(false);
  });
  it('should render the login view if a user is not logged in', (done) => {
    chai.request(server)
    .get('/auth/login')
    .end((err, res) => {
      should.not.exist(err);
      res.redirects.length.should.eql(0);
      res.status.should.eql(200);
      res.type.should.eql('text/html');
      res.text.should.contain('<h1>Login</h1>');
      res.text.should.contain(
        '<p><button type="submit">Log In</button></p>');
      done();
    });
  });
});
```

All tests should pass!

```
$ npm test

Server listening on port: 1337
  routes : auth - stubbed
    GET /auth/register
      ✓ should render the register view
    POST /auth/register
      ✓ should register a new user
    GET /auth/login
      ✓ should render the login view if a user is not logged in
    POST /auth/login
      ✓ should login a user
    POST /auth/login
      ✓ should not login a user if the password is incorrect
    GET /auth/status
      ✓ should render the status view
    GET /auth/login
      ✓ should render the status view if the user is logged in
```

Spin the Postgres and Redis servers back up, remove the `.only` from the describe, and run *all* the tests:

```
$ npm test

Server listening on port: 1337
  routes : auth - stubbed
    GET /auth/register
      ✓ should render the register view
    POST /auth/register
      ✓ should register a new user
    GET /auth/login
      ✓ should render the login view if a user is not logged in
    POST /auth/login
      ✓ should login a user
    POST /auth/login
      ✓ should not login a user if the password is incorrect
    GET /auth/status
      ✓ should render the status view
    GET /auth/login
      ✓ should render the status view if the user is logged in

  routes : auth
    GET /auth/register
      ✓ should render the register view
    POST /auth/register
      ✓ should register a new user (200ms)
    GET /auth/login
      ✓ should render the login view
    POST /auth/login
      ✓ should login a user (99ms)

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


  22 passing (3s)
```

## Ensure Admin Stub

Check your understanding by adding an `ensureAdmin` method to prevent access to a route if a user is not an admin. Add a route handler as well.

**Steps:**

1. Write a test
1. Ensure the test fails
1. Update the `users` model in the migration file, *src/server/db/migrations/20170817152841_movies.js*
1. Update the users seed
1. Apply the migration and seed
1. Add a route handler
1. Add the HTML view
1. Add the `ensureAdmin` helper
1. Manually test the route in the browser
1. Ensure the test still fails
1. Add the stub to the test
1. Ensure the test passes

Compare your solution with the code in the [repo](https://github.com/mjhea0/node-koa-api).

## Conclusion

This article took a look at how to stub authentication middleware and database calls with Sinon.

The full code can be found in the [v4](https://github.com/mjhea0/node-koa-api/releases/tag/v4) tag of the [node-koa-api](https://github.com/mjhea0/node-koa-api) repository. Please share your comments, questions, and/or tips below.
