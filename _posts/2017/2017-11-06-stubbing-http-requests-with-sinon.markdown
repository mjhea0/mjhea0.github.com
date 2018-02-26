---
layout: post
title: "Stubbing HTTP Requests with Sinon"
date: 2017-11-06 08:27:01
comments: true
toc: true
categories: [node, mocha, testing]
keywords: "node, node.js, testing, sinon, sinon.js, stub, mock, javascript, unit tests, unit testing, mocha, chai, api, RESTful api"
description: "Let's look at how to stub HTTP requests with Sinon.js during test runs."
---

This tutorial details how to stub HTTP requests with [Sinon.js](http://sinonjs.org/) during test runs.

<div style="text-align:center;">
  <img src="/assets/img/blog/sinonjs.png" style="max-width: 90%; border:0; box-shadow: none;" alt="sinon.js">
</div>

If you're developing for the web, you are most likely connecting to some other external service to extend the functionality of your application. You could be connecting to a third-party API - like Twilio, GitHub, Twitter, or Mailgun, to name a few - or just communicating with another service in your microservice stack. Regardless, when unit testing, you do not want HTTP requests to go out to these services. Instead, you can "fake" the request and response with a stub, tricking the system into thinking the request was made.

#### Parts

This article is part of a 4-part Koa and Sinon series...

1. [Building a RESTful API with Koa and Postgres](http://mherman.org/blog/2017/08/23/building-a-restful-api-with-koa-and-postgres)
1. [Stubbing HTTP Requests with Sinon](http://mherman.org/blog/2017/11/06/stubbing-http-requests-with-sinon) (this article)
1. [User Authentication with Passport and Koa](http://mherman.org/blog/2018/01/02/user-authentication-with-passport-and-koa)
1. [Stubbing Node Authentication Middleware with Sinon](http://mherman.org/blog/2018/01/22/stubbing-node-authentication-middleware-with-sinon)

#### NPM Dependencies

1. Node v[8.7.0](https://nodejs.org/en/blog/release/v8.7.0/)
1. Mocha v[4.0.1](https://github.com/mochajs/mocha/releases/tag/v4.0.1)
1. Chai v[4.1.2](https://github.com/chaijs/chai/releases/tag/4.1.2)
1. Sinon v[4.1.1](http://sinonjs.org/releases/v4.1.1/)
1. Request v[2.83.0](https://github.com/request/request/releases/tag/v2.83.0)

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Objectives

By the end of this tutorial, you will be able to...

1. Describe what a stub is and why you would want to use them in your test suites
1. Discuss the benefits of using Sinon to stub calls to external services
1. Set up a testing structure with Mocha, Chai, and Sinon
1. Write full integration tests to call an external service during the test run
1. Refactor integration tests to unit tests, stubbing out the external HTTP requests
1. Stub each of the CRUD functions from an external service

## What is a Stub?

In testing land, a stub replaces real behavior with a fixed version. In the case of HTTP requests, instead of making the actual call, a stub fakes the call and provides a canned response that can be used to test against.

It's important to note that you should not rely solely on fake data in place of real data when testing. At some point in the testing process, possibly in a staging/pre-prod environment, you should test out all external communication so that you can be confident that the system works as expected. This is often achieved with some form of end-to-end tests.

Also, keep in mind, that it can be quite difficult to keep the testing behavior aligned with the actual behavior of the service. It's common for this to happen when a service is updated and the stub stays the same. Because of this, you should limit your use of stubs to [I/O](https://en.wikipedia.org/wiki/Input/output) operations and processes that are CPU intensive.

> For more on stubs and fakes, check out the excellent [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) article.

## Why Stub?

Calling external services during test runs can cause a number of problems:

1. First off, this will slow down your test suite. Calling external services, especially in a microservice stack, can result in a ping-pong affect with HTTP requests and responses.
1. Tests will often fail due to network outages and other connectivity issues, like the service being down.
1. Often, third-party services have rate limits in place. Getting around this can be tricky (creating new test accounts on the fly) or costly (upgrading to the next service tier).
1. The service itself may not have a staging or sandbox mode for testing. In this case, you would actually be testing a service in production, so extra care needs to be taken to prevent test data from polluting production data.
1. Finally, the service itself may not be fully implemented or it may not even exist yet, which is common in a microservice stack.

*Isolating tests by stubbing external service calls makes testing faster, simpler, and more predictable.* Then, once you have some data to play with, you can use it in other parts of your test suite - to test a front-end UI, for example.

## Project Setup

Let's start by spinning up the external service that we'll consume from for testing purposes in the integration tests.

### Movie Service

Clone down the [project](https://github.com/mjhea0/node-koa-api), check out the [v2](https://github.com/mjhea0/node-koa-api/releases/tag/v2) tag to the master branch, and install the dependencies:

```sh
$ git clone https://github.com/mjhea0/node-koa-api \
  --branch v2 --single-branch
$ cd node-koa-api
$ git checkout tags/v2 -b master
$ npm install
```

Take a quick look at the code. This is just a simple Node RESTful API, with the following routes:

| URL                 | HTTP Verb | Action                |
|---------------------|-----------|-----------------------|
| /api/v1/movies      | GET       | Return ALL movies     |
| /api/v1/movies/:id  | GET       | Return a SINGLE movie |
| /api/v1/movies      | POST      | Add a movie           |
| /api/v1/movies/:id  | PUT       | Update a movie        |
| /api/v1/movies/:id  | DELETE    | Delete a movie        |

> Want to learn how to build this project? Check out the [Building a RESTful API With Koa and Postgres](http://mherman.org/blog/2017/08/23/building-a-restful-api-with-koa-and-postgres) blog post.

With Postgres up and running on port 5432, open psql in the terminal, and create the databases:

```sh
$ psql
psql (9.6.1)

# CREATE DATABASE koa_api;
CREATE DATABASE
# CREATE DATABASE koa_api_test;
CREATE DATABASE
# \q
```

Apply the migrations and seed the database:

```sh
$ knex migrate:latest --env development
$ knex seed:run --env development
```

Fire up the service:

```sh
$ npm start
```

Then, navigate to [http://localhost:1337/api/v1/movies](http://localhost:1337/api/v1/movies) in your favorite browser, and you should see all the movies:

```json
{
  "status": "success",
  "data": [
    {
      "id": 4,
      "name": "The Land Before Time",
      "genre": "Fantasy",
      "rating": 7,
      "explicit": false
    },
    {
      "id": 5,
      "name": "Jurassic Park",
      "genre": "Science Fiction",
      "rating": 9,
      "explicit": true
    },
    {
      "id": 6,
      "name": "Ice Age: Dawn of the Dinosaurs",
      "genre": "Action/Romance",
      "rating": 5,
      "explicit": false
    }
  ]
}
```

With that, let's set up the testing framework boilerplate.

### Mocha and Chai

Clone down the base project:

```sh
$ git clone https://github.com/mjhea0/mocha-chai-sinon \
  --branch v1 --single-branch
$ cd mocha-chai-sinon
```

Then, check out the v1 tag to the master branch and install the dependencies:

```sh
$ git checkout tags/v1 -b master
$ npm install
```

Make sure the tests pass:

```sh
$ npm test

Sample Test
  ✓ should pass

1 passing (8ms)
```

Take a quick look at the project structure before moving on.

## Sinon Setup

Install:

```sh
$ npm install sinon@4.1.1 --save-dev
```

> While that's installing, do some basic research on the libraries available to stub (or mock) HTTP requests in Node. How does Sinon compare to these other libraries?

Let's start with a basic example. Add the following code to *test/sample.test.js*:

```javascript
function greaterThanTwenty(num) {
  if (num > 20) return true;
  return false;
}

describe('Sample Sinon Stub', () => {
  it('should pass', (done) => {
    const greaterThanTwenty = sinon.stub().returns('something');
    greaterThanTwenty(0).should.eql('something');
    greaterThanTwenty(0).should.not.eql(false);
    done();
  });
});
```

Here, we stubbed out the `greaterThanTwenty` function, overriding the function's default behavior, so that it returns `'something'` instead of either `true` or `false`.

Run the tests to ensure they pass:

```sh
Sample Test
  ✓ should pass

Sample Sinon Stub
  ✓ should pass
```

You can also stub a prototype method:

```javascript
function Person(givenName, familyName) {
  this.givenName = givenName;
  this.familyName = familyName;
}

Person.prototype.getFullName = function() {
  return `${this.givenName} ${this.familyName}`;
};

describe('Sample Sinon Stub Take 2', () => {
  it('should pass', (done) => {
    const name = new Person('Michael', 'Herman');
    name.getFullName().should.eql('Michael Herman');
    sinon.stub(Person.prototype, 'getFullName').returns('John Doe');
    name.getFullName().should.eql('John Doe');
    done();
  });
});
```

Again, make sure the tests pass:

```sh
Sample Test
  ✓ should pass

Sample Sinon Stub
  ✓ should pass

Sample Sinon Stub Take 2
  ✓ should pass
```

> For more examples, review the official [docs](http://sinonjs.org/releases/v4.0.1/stubs/).

With that, let's now look at stubbing HTTP requests.

## Testing the Movie Service

Create a new file in "test" called *movie.service.test.js*:

```javascript
process.env.NODE_ENV = 'test';

const sinon = require('sinon');
const request = require('request');
const chai = require('chai');
const should = chai.should();

const base = 'http://localhost:1337';

describe('movie service', () => {

  describe('when not stubbed', () => {
    // test cases
  });

  describe('when stubbed', () => {
    beforeEach(() => {
      this.get = sinon.stub(request, 'get');
    });
    afterEach(() => {
      request.restore();
    });
    // test cases
  });

});
```

So, we'll test out the movie service using both unit and integrations tests so you can see the difference. Take note of the `beforeEach` and `afterEach` functions. Here, we stubbed the `get` method, from the `request` package (assigning it to `this.get` so we can reference it later in the test cases), in the `beforeEach()`, and then we restored the original behavior in the `afterEach()`.

Install the [Request](https://github.com/request/request) library:

```sh
$ npm install request@2.83.0 --save-dev
```

### GET All Movies

Start with the integration test:

```javascript
describe('GET /api/v1/movies', () => {
  it('should return all movies', (done) => {
    request.get(`${base}/api/v1/movies`, (err, res, body) => {
      // there should be a 200 status code
      res.statusCode.should.eql(200);
      // the response should be JSON
      res.headers['content-type'].should.contain('application/json');
      // parse response body
      body = JSON.parse(body);
      // the JSON response body should have a
      // key-value pair of {"status": "success"}
      body.status.should.eql('success');
      // the JSON response body should have a
      // key-value pair of {"data": [3 movie objects]}
      body.data.length.should.eql(3);
      // the first object in the data array should
      // have the right keys
      body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      // the first object should have the right value for name
      body.data[0].name.should.eql('The Land Before Time');
      done();
    });
  });
});
```

Take note of the code comments. This should be fairly straightforward. With the movie service up and running, ensure the test passes:

```sh
movie service
  when not stubbed
    GET /api/v1/movies
      ✓ should return all movies
```

Now, let's look at how to stub the HTTP request call. Update the "when stubbed" `describe` block, like so:

```javascript
describe('when stubbed', () => {
  beforeEach(() => {
    const responseObject = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      }
    };
    const responseBody = {
      status: 'success',
      data: [
        {
          id: 4,
          name: 'The Land Before Time',
          genre: 'Fantasy',
          rating: 7,
          explicit: false
        },
        {
          id: 5,
          name: 'Jurassic Park',
          genre: 'Science Fiction',
          rating: 9,
          explicit: true
        },
        {
          id: 6,
          name: 'Ice Age: Dawn of the Dinosaurs',
          genre: 'Action/Romance',
          rating: 5,
          explicit: false
        }
      ]
    };
    this.get = sinon.stub(request, 'get');
  });

  afterEach(() => {
    request.get.restore();
  });
  describe('GET /api/v1/movies', () => {
    it('should return all movies', (done) => {
      this.get.yields(null, responseObject, JSON.stringify(responseBody));
      request.get(`${base}/api/v1/movies`, (err, res, body) => {
        // there should be a 200 status code
        res.statusCode.should.eql(200);
        // the response should be JSON
        res.headers['content-type'].should.contain('application/json');
        // parse response body
        body = JSON.parse(body);
        // the JSON response body should have a
        // key-value pair of {"status": "success"}
        body.status.should.eql('success');
        // the JSON response body should have a
        // key-value pair of {"data": [3 movie objects]}
        body.data.length.should.eql(3);
        // the first object in the data array should
        // have the right keys
        body.data[0].should.include.keys(
          'id', 'name', 'genre', 'rating', 'explicit'
        );
        // the first object should have the right value for name
        body.data[0].name.should.eql('The Land Before Time');
        done();
      });
    });
  });
});
```

Here, we use the [yields](http://sinonjs.org/releases/v1.17.7/stubs/) method to automatically call the callback passed to `get()`. Remember how `request` works? After the request is sent, the function waits until the callback is called before proceeding. So, by stubbing this out, we simply pass in a dummy object and immediately call the callback.  

Make sure the tests pass:

```sh
movie service
  when not stubbed
    GET /api/v1/movies
      ✓ should return all movies (47ms)
  when stubbed
    GET /api/v1/movies
      ✓ should return all movies
```

Now, how do we know the call wasn't actually made?

1. Kill the movie service server
1. Add a `.only` to the `describe` block - `describe.only('when stubbed', () => {`

Test again. It should still pass. Once done, remove the `.only` and fire the movie service back up.

### Fixture

To keep things clean in the test cases and to make it easy to find and update the fake objects, let's create a test fixtures file.

Add a new folder to "test" called "fixtures", and then add a new file to that folder called *movies.json*:

```json
{
  "all": {
    "success": {
      "res": {
        "statusCode": 200,
        "headers": {
          "content-type": "application/json"
        }
      },
      "body": {
        "status": "success",
        "data": [
          {
            "id": 4,
            "name": "The Land Before Time",
            "genre": "Fantasy",
            "rating": 7,
            "explicit": false
          },
          {
            "id": 5,
            "name": "Jurassic Park",
            "genre": "Science Fiction",
            "rating": 9,
            "explicit": true
          },
          {
            "id": 6,
            "name": "Ice Age: Dawn of the Dinosaurs",
            "genre": "Action/Romance",
            "rating": 5,
            "explicit": false
          }
        ]
      }
    }
  }
}
```

Import the file into *movies.service.test.js*:

```javascript
const movies = require('./fixtures/movies.json');
```

Update `this.get.yields`:

```javascript
this.get.yields(
  null, movies.all.success.res, JSON.stringify(movies.all.success.body)
);
```

Make sure the tests still pass!

> You may also want to add the expected data for the assertions to the fixtures as well. Or: You could take it a few steps further and generate the actual test cases from the fixture file. Try this on your own.

### GET Single Movie

#### Integration test

```javascript
describe('GET /api/v1/movies/:id', () => {
  it('should respond with a single movie', (done) => {
    request.get(`${base}/api/v1/movies/4`, (err, res, body) => {
      res.statusCode.should.equal(200);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('success');
      body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      body.data[0].name.should.eql('The Land Before Time');
      done();
    });
  });
  it('should throw an error if the movie does not exist', (done) => {
    request.get(`${base}/api/v1/movies/999`, (err, res, body) => {
      res.statusCode.should.equal(404);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('error');
      body.message.should.eql('That movie does not exist.');
      done();
    });
  });
});
```

Notice how we used the movie id of `4` in the first test. This makes for a brittle test, since it will fail if that movie is removed or the name is updated in the movie service. Sure, we do have control over the data in this service, but in most cases you will not have this luxury.

#### Unit test

Add the fixture to the *movies.json* file:

```json
"single": {
  "success": {
    "res": {
      "statusCode": 200,
      "headers": {
        "content-type": "application/json"
      }
    },
    "body": {
      "status": "success",
      "data": [
        {
          "id": 4,
          "name": "The Land Before Time",
          "genre": "Fantasy",
          "rating": 7,
          "explicit": false
        }
      ]
    }
  },
  "failure": {
    "res": {
      "statusCode": 404,
      "headers": {
        "content-type": "application/json"
      }
    },
    "body": {
      "status": "error",
      "message": "That movie does not exist."
    }
  }
}
```

Then, add the test cases:

```javascript
describe('GET /api/v1/movies/:id', () => {
  it('should respond with a single movie', (done) => {
    const obj = movies.single.success;
    this.get.yields(null, obj.res, JSON.stringify(obj.body));
    request.get(`${base}/api/v1/movies/4`, (err, res, body) => {
      res.statusCode.should.equal(200);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('success');
      body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      body.data[0].name.should.eql('The Land Before Time');
      done();
    });
  });
  it('should throw an error if the movie does not exist', (done) => {
    const obj = movies.single.failure;
    this.get.yields(null, obj.res, JSON.stringify(obj.body));
    request.get(`${base}/api/v1/movies/999`, (err, res, body) => {
      res.statusCode.should.equal(404);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('error');
      body.message.should.eql('That movie does not exist.');
      done();
    });
  });
});
```

Run the tests:

```
movie service
  when not stubbed
    GET /api/v1/movies
      ✓ should return all movies (40ms)
    GET /api/v1/movies/:id
      ✓ should respond with a single movie
      ✓ should throw an error if the movie does not exist
  when stubbed
    GET /api/v1/movies
      ✓ should return all movies
    GET /api/v1/movies/:id
      ✓ should respond with a single movie
      ✓ should throw an error if the movie does not exist
```

### POST

#### Integration test

```javascript
describe('POST /api/v1/movies', () => {
  it('should return the movie that was added', (done) => {
    const options = {
      method: 'post',
      body: {
        name: 'Titanic',
        genre: 'Drama',
        rating: 8,
        explicit: true
      },
      json: true,
      url: `${base}/api/v1/movies`
    };
    request(options, (err, res, body) => {
      res.statusCode.should.equal(201);
      res.headers['content-type'].should.contain('application/json');
      body.status.should.eql('success');
      body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      done();
    });
  });
});
```

Run the tests. They should pass the first time, but if you run them again, you should see the first test, `should return all movies`, fail:

```sh
Uncaught AssertionError: expected 4 to deeply equal 3
```

How can we fix this?

1. Remove the assertion altogether from the first test case
1. Add a `beforeEach` that removes any test data that was added from a previously ran test case (this will add additional requests, slowing down the test suite even more)

Either way, this is not an easy issue to fix, especially if it's a third-party service that you have no control over. This is one of the reasons why we're stubbing in the first place - to limit the complexity. So, instead of trying to fix the integration test, let's just remove it and focus solely on the unit tests:

```javascript
describe.skip('when not stubbed', () => {
  ...
})
```

#### Unit Test

Start with the fixture:

```json
"add": {
  "success": {
    "res": {
      "statusCode": 201,
      "headers": {
        "content-type": "application/json"
      }
    },
    "body": {
      "status": "success",
      "data": [
        {
          "id": 5,
          "name": "Titanic",
          "genre": "Drama",
          "rating": 8,
          "explicit": true
        }
      ]
    }
  }
}
```

Next, stub the `post` method:

```javascript
beforeEach(() => {
  this.get = sinon.stub(request, 'get');
  this.post = sinon.stub(request, 'post');
});

afterEach(() => {
  request.get.restore();
  request.post.restore();
});
```

Add the test:

```javascript
describe('POST /api/v1/movies', () => {
  it('should return the movie that was added', (done) => {
    const options = {
      body: {
        name: 'Titanic',
        genre: 'Drama',
        rating: 8,
        explicit: true
      },
      json: true,
      url: `${base}/api/v1/movies`
    };
    const obj = movies.add.success;
    this.post.yields(null, obj.res, JSON.stringify(obj.body));
    request.post(options, (err, res, body) => {
      res.statusCode.should.equal(201);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('success');
      body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      body.data[0].name.should.eql('Titanic');
      done();
    });
  });
});
```

Make sure the tests pass:

```
movie service
  when stubbed
    GET /api/v1/movies
      ✓ should return all movies
    GET /api/v1/movies/:id
      ✓ should respond with a single movie
      ✓ should throw an error if the movie does not exist
    POST /api/v1/movies
      ✓ should return the movie that was added
```

What if the payload does not include the correct keys? Update the fixture:

```json
"failure": {
  "res": {
    "statusCode": 400,
    "headers": {
      "content-type": "application/json"
    }
  },
  "body": {
    "status": "error",
    "message": "Something went wrong."
  }
}
```

Add a new `it` block:

```javascript
it('should throw an error if the payload is malformed', (done) => {
  const options = {
    body: { name: 'Titanic' },
    json: true,
    url: `${base}/api/v1/movies`
  };
  const obj = movies.add.failure;
  this.post.yields(null, obj.res, JSON.stringify(obj.body));
  request.post(options, (err, res, body) => {
    res.statusCode.should.equal(400);
    res.headers['content-type'].should.contain('application/json');
    body = JSON.parse(body);
    body.status.should.eql('error');
    should.exist(body.message);
    done();
  });
});
```

### PUT

Fixture:

```json
"update": {
  "success": {
    "res": {
      "statusCode": 200,
      "headers": {
        "content-type": "application/json"
      }
    },
    "body": {
      "status": "success",
      "data": [
        {
          "id": 5,
          "name": "Titanic",
          "genre": "Drama",
          "rating": 9,
          "explicit": true
        }
      ]
    }
  },
  "failure": {
    "res": {
      "statusCode": 404,
      "headers": {
        "content-type": "application/json"
      }
    },
    "body": {
      "status": "error",
      "message": "That movie does not exist."
    }
  }
}
```

Stub:

```javascript
beforeEach(() => {
  this.get = sinon.stub(request, 'get');
  this.post = sinon.stub(request, 'post');
  this.put = sinon.stub(request, 'put');
});

afterEach(() => {
  request.get.restore();
  request.post.restore();
  request.put.restore();
});
```

Tests:

```javascript
describe('PUT /api/v1/movies', () => {
  it('should return the movie that was updated', (done) => {
    const options = {
      body: { rating: 9 },
      json: true,
      url: `${base}/api/v1/movies/5`
    };
    const obj = movies.update.success;
    this.put.yields(null, obj.res, JSON.stringify(obj.body));
    request.put(options, (err, res, body) => {
      res.statusCode.should.equal(200);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('success');
      body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      body.data[0].name.should.eql('Titanic');
      body.data[0].rating.should.eql(9);
      done();
    });
  });
  it('should throw an error if the movie does not exist', (done) => {
    const options = {
      body: { rating: 9 },
      json: true,
      url: `${base}/api/v1/movies/5`
    };
    const obj = movies.update.failure;
    this.put.yields(null, obj.res, JSON.stringify(obj.body));
    request.put(options, (err, res, body) => {
      res.statusCode.should.equal(404);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('error');
      body.message.should.eql('That movie does not exist.');
      done();
    });
  });
});
```

### DELETE

Fixture:

```json
"delete": {
  "success": {
    "res": {
      "statusCode": 200,
      "headers": {
        "content-type": "application/json"
      }
    },
    "body": {
      "status": "success",
      "data": [
        {
          "id": 5,
          "name": "Titanic",
          "genre": "Drama",
          "rating": 9,
          "explicit": true
        }
      ]
    }
  },
  "failure": {
    "res": {
      "statusCode": 404,
      "headers": {
        "content-type": "application/json"
      }
    },
    "body": {
      "status": "error",
      "message": "That movie does not exist."
    }
  }
}
```

Stub:

```javascript
beforeEach(() => {
  this.get = sinon.stub(request, 'get');
  this.post = sinon.stub(request, 'post');
  this.put = sinon.stub(request, 'put');
  this.delete = sinon.stub(request, 'delete');
});

afterEach(() => {
  request.get.restore();
  request.post.restore();
  request.put.restore();
  request.delete.restore();
});
```

Test:

```javascript
describe('DELETE /api/v1/movies/:id', () => {
  it('should return the movie that was deleted', (done) => {
    const obj = movies.delete.success;
    this.delete.yields(null, obj.res, JSON.stringify(obj.body));
    request.delete(`${base}/api/v1/movies/5`, (err, res, body) => {
      res.statusCode.should.equal(200);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('success');
      body.data[0].should.include.keys(
        'id', 'name', 'genre', 'rating', 'explicit'
      );
      body.data[0].name.should.eql('Titanic');
      done();
    });
  });
  it('should throw an error if the movie does not exist', (done) => {
    const obj = movies.delete.failure;
    this.delete.yields(null, obj.res, JSON.stringify(obj.body));
    request.delete(`${base}/api/v1/movies/5`, (err, res, body) => {
      res.statusCode.should.equal(404);
      res.headers['content-type'].should.contain('application/json');
      body = JSON.parse(body);
      body.status.should.eql('error');
      body.message.should.eql('That movie does not exist.');
      done();
    });
  });
});
```

Run the tests one final time to ensure they all pass:

```
movie service
  when stubbed
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
```

## Conclusion

You should now have a better understanding of both the *why* and *how* in terms of stubbing with Sinon. Even though this post focused on HTTP requests, you can apply the same logic to other areas of your application like client-side AJAX requests, database queries, and Redis lookups, to name a few.

Turn back to the objectives. Read each aloud to yourself. Can you put each one into action?

Finally, it's important to stub HTTP calls to external services to avoid flaky tests, speed up the overall test suite, and make testing more predictable. Be sure to balance your stubbed tests with end-to-end tests in a staging environment to ensure the system works as expected.

Grab the final code from the [mocha-chai-sinon](https://github.com/mjhea0/mocha-chai-sinon) repo. Cheers!
