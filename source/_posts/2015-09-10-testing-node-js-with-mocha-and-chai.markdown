---
layout: post
toc: true
title: "Testing Node.js with Mocha and Chai"
date: 2015-09-10 10:52
comments: true
categories: node
keywords: "mocha, chai, node, testing, node.js, integration tests, unit tests"
description: "Let's look at how to test a Node.JS application with Mocha and Chai."
---

**This post serves as an introduction to testing a Node.js RESTful API with [Mocha](http://mochajs.org/) (v2.3.1). a JavaScript testing framework.**

<div style="text-align:center;">
  <img src="/images/mocha-chaijs.png" style="max-width: 100%; border:0;" alt="mocha and chai.js">
</div>

## Why Test?

Before diving in it's important that you understand *why* tests are necessary.

Grab the Node/Express sample CRUD application from the [repository](https://github.com/mjhea0/node-mocha-chai-tutorial):

``` sh
$ git clone https://github.com/mjhea0/node-mocha-chai-tutorial.git
$ git checkout tags/v1
```

Once you have *v1* of the app, manually go through it and test each of the CRUD functions via cURL (or [HTTPie](http://httpie.org/) or [Postman](https://www.getpostman.com/)):

1. Add new blobs
1. View all blobs
1. View a single blob
1. Update a single blob
1. Delete a single blob

This is a tedious process. What if you had to go through this same manual process *every* single time a new feature got added to the application? That would not only be a massive misuse of time - but unreliable as well. Hence the need for setting up a testing framework for automating the testing of the application, so you can run hundreds of tests in a matter of seconds.

With that, install Mocha:

``` sh
$ npm install -g mocha@2.3.1
```

> We installed this globally so we'll be able to run `mocha` from the terminal.

## Structure

To set up the basic tests, create a new folder called "test" in the project root, then within that folder add a file called *test-server.js*. Your file/folder structure should now look like:

``` sh
├── package.json
├── server
│   ├── app.js
│   ├── models
│   │   └── blob.js
│   └── routes
│       └── index.js
└── test
    └── test-server.js
```

Now add the following code to the new file:

``` javascript
describe('Blobs', function() {
  it('should list ALL blobs on /blobs GET');
  it('should list a SINGLE blob on /blob/<id> GET');
  it('should add a SINGLE blob on /blobs POST');
  it('should update a SINGLE blob on /blob/<id> PUT');
  it('should delete a SINGLE blob on /blob/<id> DELETE');
});
```

Although this is just boilerplate, pay attention to the `describe()` block and `it()` statements. `describe()` is used for grouping tests in a logical manner. Meanwhile, the `it()` statements contain each individual test case, which generally (err, *should*) test a single feature or edge case.

## Logic

To add the necessary logic, we'll utilize [Chai](http://chaijs.com/) (v3.2.0), an assertion library, and [chai-http](http://chaijs.com/plugins/chai-http) (v 1.0.0), for making the actual HTTP requests and then testing the responses.

Install them both now:

``` sh
$ npm install chai@3.2.0 chai-http@1.0.0 --save-dev
```

Then update *test-server.js*, like so:

``` javascript
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server/app');
var should = chai.should();

chai.use(chaiHttp);


describe('Blobs', function() {
  it('should list ALL blobs on /blobs GET');
  it('should list a SINGLE blob on /blob/<id> GET');
  it('should add a SINGLE blob on /blobs POST');
  it('should update a SINGLE blob on /blob/<id> PUT');
  it('should delete a SINGLE blob on /blob/<id> DELETE');
});
```

Here, we required the new packages, `chai` and `chai-http`, and our *app.js* file in order to make requests to the app. We also used the `should` assertion library so we can utilize [BDD-style assertions](http://chaijs.com/api/bdd/).

> One of the powerful aspects of Chai is that it allows you to choose the type of assertion style you'd like to use. Check out the [Assertion Style Guide](http://chaijs.com/guide/styles/) for more info. Also, aside for the assertion libraries included with Chai, there are a number of other libraries available via [NPM](https://github.com/mochajs/mocha/wiki#assertion-libraries) and [Github](https://github.com/search?utf8=%E2%9C%93&q=chai+assertion&type=Repositories&ref=searchresults).

Now we can write our tests...

## Test - GET (all)

Update the first `it()` statement:

``` javascript
it('should list ALL blobs on /blobs GET', function(done) {
  chai.request(server)
    .get('/blobs')
    .end(function(err, res){
      res.should.have.status(200);
      done();
    });
});
```

So, we passed an anonymous function with a single argument of `done` (a function) to the `it()` statement. This argument ends the test case when called - e.g., `done()`. The test itself is simple: We made a GET request to the `/blobs` endpoint and then asserted that the response contained a 200 HTTP status code.

Simple, right?

To test, simply run `mocha`; and if all went well, you should see:

``` sh
$ mocha


  Blobs
Connected to Database!
GET /blobs 200 19.621 ms - 2
    ✓ should list ALL blobs on /blobs GET (43ms)
    - should list a SINGLE blob on /blob/<id> GET
    - should add a SINGLE blob on /blobs POST
    - should update a SINGLE blob on /blob/<id> PUT
    - should delete a SINGLE blob on /blob/<id> DELETE


  1 passing (72ms)
  4 pending
```

Since testing the status code alone isn't very significant, let's add some more assertions:

``` javascript
it('should list ALL blobs on /blobs GET', function(done) {
  chai.request(server)
    .get('/blobs')
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
});
```

This should be straightforward, since these assertions read like plain English. Run the test suite again. It passes, right? This test still isn't complete, since we're not testing any of the *actual* data being returned. We'll get to that shortly.

How about testing a POST request...

## Test - POST

Based on the code within *index.js*, when a new "blob" is successfully added, we should see the following response:

``` sh
{
  "SUCCESS": {
    "__v": 0,
    "name": "name",
    "lastName": "lastname",
    "_id": "some-unique-id"
  }
}
```

> Need proof? Test this out by logging `{'SUCCESS': newBlob}` to the console, and then run a manual test to see what gets logged.

With that, think about how you would write/structure your assertions to test this...

``` javascript
it('should add a SINGLE blob on /blobs POST', function(done) {
  chai.request(server)
    .post('/blobs')
    .send({'name': 'Java', 'lastName': 'Script'})
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('SUCCESS');
      res.body.SUCCESS.should.be.a('object');
      res.body.SUCCESS.should.have.property('name');
      res.body.SUCCESS.should.have.property('lastName');
      res.body.SUCCESS.should.have.property('_id');
      res.body.SUCCESS.name.should.equal('Java');
      res.body.SUCCESS.lastName.should.equal('Script');
      done();
    });
});
```

Need help understanding what's happening here? Add `console.log(res.body)` just before the first assert. Run the test to see the data contained within the response body. The test we wrote tests the actual structure and data from the response body, broken down by each individual key/value pair.

## Hooks

Up to this point we have been using the main database for testing purposes, which is not ideal since we're polluting the database with test data. Instead, let's utilize a test database and add a dummy blob to it to assert against. To do this, we can use the `beforeEach()` and `afterEach()` [hooks](http://mochajs.org/#hooks) - which, as the names suggest, add and remove a dummy document to the database before and after each test case is ran.

This sounds a bit difficult, but with Mocha it's super easy!

Start by adding a configuration file called *_config.js* to the "server" folder in order to specify a different database URI for testing purposes:

``` javascript
var config = {};

config.mongoURI = {
  development: 'mongodb://localhost/node-testing',
  test: 'mongodb://localhost/node-test'
};

module.exports = config;
```

Next, update *app.js* to utilize the test database when the environment variable `app.settings.env` evaluates to `test`. (The default is `development`.)

``` javascript
// *** config file *** //
var config = require('./_config');

// *** mongoose *** ///
mongoose.connect(config.mongoURI[app.settings.env], function(err, res) {
  if(err) {
    console.log('Error connecting to the database. ' + err);
  } else {
    console.log('Connected to Database: ' + config.mongoURI[app.settings.env]);
  }
});
```

Finally, update the requirements and add the hooks to the testing script:

``` javascript
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var mongoose = require("mongoose");

var server = require('../server/app');
var Blob = require("../server/models/blob");

var should = chai.should();
chai.use(chaiHttp);


describe('Blobs', function() {

  Blob.collection.drop();

  beforeEach(function(done){
    var newBlob = new Blob({
      name: 'Bat',
      lastName: 'man'
    });
    newBlob.save(function(err) {
      done();
    });
  });
  afterEach(function(done){
    Blob.collection.drop();
    done();
  });

...snip...
```

Now, before each test case, the database is cleared and a new blob is added; then, after each test, the database is cleared before the next test case is ran.

Run the tests again to ensure they still pass.

## Test - GET (all)

With the hooks set up, let's refactor the first test to assert that the blob from the `beforeEach()` is part of the collection:

``` javascript
it('should list ALL blobs on /blobs GET', function(done) {
  chai.request(server)
    .get('/blobs')
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      res.body[0].should.have.property('_id');
      res.body[0].should.have.property('name');
      res.body[0].should.have.property('lastName');
      res.body[0].name.should.equal('Bat');
      res.body[0].lastName.should.equal('man');
      done();
    });
});
```

Let's look at the final three tests...

## Test - GET (single)

``` javascript
it('should list a SINGLE blob on /blob/<id> GET', function(done) {
    var newBlob = new Blob({
      name: 'Super',
      lastName: 'man'
    });
    newBlob.save(function(err, data) {
      chai.request(server)
        .get('/blob/'+data.id)
        .end(function(err, res){
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('_id');
          res.body.should.have.property('name');
          res.body.should.have.property('lastName');
          res.body.name.should.equal('Super');
          res.body.lastName.should.equal('man');
          res.body._id.should.equal(data.id);
          done();
        });
    });
});
```

In this test case, we first added a new blob, and then used the newly created `_id` to make the request and then test the subsequent response.

## Test - PUT

``` javascript
it('should update a SINGLE blob on /blob/<id> PUT', function(done) {
  chai.request(server)
    .get('/blobs')
    .end(function(err, res){
      chai.request(server)
        .put('/blob/'+res.body[0]._id)
        .send({'name': 'Spider'})
        .end(function(error, response){
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('UPDATED');
          response.body.UPDATED.should.be.a('object');
          response.body.UPDATED.should.have.property('name');
          response.body.UPDATED.should.have.property('_id');
          response.body.UPDATED.name.should.equal('Spider');
          done();
      });
    });
});
```

Here, we hit the `/blobs` endpoint with a GET request to grab the blob added from the `beforeEach()` hook, then we simply added the `_id` to the URL for the PUT request and updated the name to `Spider`.

## Test - DELETE

Finally...

``` javascript
it('should delete a SINGLE blob on /blob/<id> DELETE', function(done) {
  chai.request(server)
    .get('/blobs')
    .end(function(err, res){
      chai.request(server)
        .delete('/blob/'+res.body[0]._id)
        .end(function(error, response){
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('REMOVED');
          response.body.REMOVED.should.be.a('object');
          response.body.REMOVED.should.have.property('name');
          response.body.REMOVED.should.have.property('_id');
          response.body.REMOVED.name.should.equal('Bat');
          done();
      });
    });
});
```

## Conclusion

Hopefully you can now see just how easy it is to test your code with Mocha and Chai. Keep practicing on your own, incorporating a true [BDD](https://mochajs.org/#bdd) approach into your workflow. Grab the final code for this tutorial from the [repository](https://github.com/mjhea0/node-mocha-chai-tutorial).
