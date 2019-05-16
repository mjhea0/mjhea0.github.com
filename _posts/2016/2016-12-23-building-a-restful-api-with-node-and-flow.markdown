---
layout: post
title: "Building a RESTful API with Node, Flow, and Jest"
date: 2016-12-23
last_modified_at: 2016-12-23
comments: true
toc: true
categories:
categories: [node, testing, static types]
keywords: "node, express, flow, flowtype, RESTful API, tdd, jest, yarn, test-driven development, static types"
description: "This tutorial takes a test-first approach to developing a RESTful API with NodeJS, ExpressJS, and Flow, and Jest."
redirect_from:
  - /blog/2016/12/23/building-a-restful-api-with-node-and-flow/
---

This tutorial details how to develop a RESTful API with [NodeJS](https://nodejs.org/en/), [ExpressJS](http://expressjs.com/), and [Flow](https://flowtype.org/) using test-driven development (TDD).

<div style="text-align:center;">
  <img src="/assets/img/blog/flow-logo.jpeg" style="max-width: 45%; border:0; box-shadow: none;" alt="flow logo">
</div>

<br>

We'll be going full-Facebook with this application (FaceStack), utilizing:

- [Flow](https://flowtype.org/) for type checking
- [Babel](http://babeljs.io/) for transpilation
- [Jest](https://facebook.github.io/jest/) for our testing framework
- (Optionally) [Yarn](https://yarnpkg.com/) to replace [NPM](https://www.npmjs.com/)

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Create a new directory to hold the project:

```sh
$ mkdir flow-node-api
$ cd flow-node-api
```

### Transpilation

To start, let's get Babel transpilation up and running. We'll use [Gulp](http://gulpjs.com/) to automate the build process.

> **NOTE:** We'll use [yarn](https://yarnpkg.com/) here to download and manage dependencies, but you can use `npm` just as easily if you wish. Anytime you see a `yarn add` or `yarn remove` just substitute in a `npm install` or `npm rm`. The only difference is that yarn does the `--save` part for you and with `npm` you must be explicit.

Go ahead and add `gulp`, `gulp-babel`, and `gulp-sourcemaps` to your project, and create a *gulpfile.js* to start writing our Gulp tasks in:

```sh
$ yarn init -y
$ yarn add gulp@3.9.1 gulp-babel@6.1.2 gulp-sourcemaps@1.9.1
$ touch gulpfile.js
```

Also, install Gulp globally (if necessary), so you can run Gulp tasks from the command line:

```sh
$ yarn global add gulp-cli@1.2.2
```

We're going to write all of our source code in the "src" directory, so the first  Gulp task will need to:

1. Grab all of the JavaScript files inside of "src"
1. Pipe the files through Babel
1. Deliver them to the "build" directory

```javascript
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('scripts', () => {
  return gulp.src('src/**/*.js')
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('build'));
});
```

Pretty straightforward. Time to test!

Add a "src" directory, and then create a file inside of it called *index.js*:

```sh
$ mkdir src && touch src/index.js
```

Put some kind of JavaScript statement inside of your newly created file, like:

```javascript
// src/index.js
console.log('Hello World!');
```

Run the Gulp task, and then run the transpiled version of *index.js*:

```sh
$ gulp scripts
$ node build/index.js
Hello World!
```

Nice! However, do you really want to manually type `gulp scripts` in to build the project *every* time changes are made? Of course not. So, let's set up a `watch` and a `default` task with Gulp to make this easier.

Add the following to `gulpfile.js`:

```javascript
gulp.task('watch', ['scripts'], () => {
  gulp.watch('src/**/*.js', ['scripts']);
});

gulp.task('default', ['watch']);
```

Now you can just run `gulp` from the command line, and it will listen for changes to our JavaScript files inside of "src" and re-run the `scripts` task whenever it detects changes.

### Flow

Moving on, to use [Flow](https://flowtype.org/), we'll use the `gulp-flowtype` plugin to interface with Flow. Download the dependency and head back over to `gulpfile.js`.

```sh
$ yarn add --dev gulp-flowtype@1.0.0
```

```javascript
// ...
const flow = require('gulp-flowtype');
// ...

gulp.task('flow', () => {
  return gulp.src('src/**/*.js')
  .pipe(flow({ killFlow: false }));
});
// ...

// update the watch task as well
gulp.task('watch', ['flow', 'scripts'], () => {
  gulp.watch('src/**/*.js', ['flow', 'scripts']);
});
```

This is all well and good, but we're going to configure a few more parts before we move forward. We need to tell Babel to strip out all of our Flow [type annotations](https://flowtype.org/docs/type-annotations.html). While we're doing that, we might as well install the other Babel dependencies:

```sh
$ yarn add babel-plugin-transform-flow-strip-types@6.21.0
$ yarn add babel-polyfill@6.20.0 babel-preset-latest@6.16.0
```

With those installed create a *.babelrc* file in the root of the project, and add these settings:

```json
{
  "presets": ["latest"],
  "plugins": ["transform-flow-strip-types"]
}
```

Finally, we need a *.flowconfig* to tell Flow that this is a project with Flow annotated code. If you have the Flow CLI installed, you can do this with `flow init`. If you don't, just create a file called *.flowconfig*  file and paste this in:

```
[ignore]

[include]

[libs]

[options]
```

Whew. Now that we've done all that configuring, let's make sure it's all working by testing out some Flow type annotations. If you're familiar with [TypeScript](http://mherman.org/blog/2016/11/05/developing-a-restful-api-with-node-and-typescript/), this syntax will look very familiar. There are some notable differences, but in general TypeScript and Flow look pretty similar. Let's start with a simple function that adds two numbers together.

Run the default gulp task:

```sh
$ gulp
```

Replace the contents of *src/index.js* with the following:

```javascript
// @flow

function testFunc(item) {
  return 10 * item;
}

console.log(testFunc(2));
console.log(testFunc('banana'));
```

Since Gulp is watching for changes, you should automatically see the output from Flow as soon as you save the file:

```sh
src/index.js:4
  4:   return 10 * item;
                   ^^^^ string. This type is incompatible with
  4:   return 10 * item;
              ^^^^^^^^^ number
```

Excellent! Flow is doing its job. Here, it's telling us that when we try to call `testFunc('banana')` we're going to run into issues because `testFunc` is clearly expecting its argument to be a number, not a string. Notice the `// @flow` comment that's now at the top of the file. This tells Flow that this file should be [typechecked](https://en.wikipedia.org/wiki/Type_system#Type_checking). If you don't put this comment at the top of the file you're working on, Flow will ignore it. Keep this in mind as you develop your application.

If you read the post on TypeScript ([Developing a RESTful API With Node and TypeScript](http://mherman.org/blog/2016/11/05/developing-a-restful-api-with-node-and-typescript)), you may already be wondering how we can use types with third-party libraries. Well, with Flow there's a command line tool called [flow-typed](https://github.com/flowtype/flow-typed) that is used to manage libdefs (library definitions) for Flow.

First, install `flow-typed` globally:

```sh
$ yarn global add flow-typed@2.0.0
```

The nice thing about `flow-typed` is that we don't really have to manage it too much. It reads `package.json` and automatically downloads the libdefs for our dependencies and stores them in "flow-typed".

To install the libdefs for the packages we're using so far just run:

```sh
$ flow-typed install --flowVersion=0.36.0
```

For packages that have no official libdef in the flow-typed repository, a stub is generated. Unfortunately, if you want to omit the `--flowVersion=0.36.0` flag, you'll need to install `flow-bin` and have it listed as a dependency in *package.json*.

Before moving forward, we need to make one more change to our Gulp task for Flow. Now that we've got `flow-typed`, tell Flow where we're keeping these definitions:

```javascript
gulp.task('flow', () => {
  return gulp.src('src/**/*.js')
  .pipe(flow({
    killFlow: false,
    declarations: './flow-typed'
  }));
});
```

Great! We've got Flow type checking our code, and Babel is stripping out our type annotations and transpiling.

Let's construct the basics of the server.

## Server Setup

We're going to use *src/index.js* as the entry point for our Express API along with the [debug](https://github.com/visionmedia/debug) module to set up simple logging. Install it with `yarn` (`yarn add debug@2.4.5`) or `npm` (`npm install debug@2.4.5 --save`), and then wipe everything out of *index.js* and replace it with the following:

```javascript
// @flow

'use strict'

import * as http from 'http';
import debug from 'debug';
import Api from './Api';

// ErrnoError interface for use in onError
declare interface ErrnoError extends Error {
  errno?: number;
  code?: string;
  path?: string;
  syscall?: string;
}

const logger = debug('flow-api:startup');
const app: Api = new Api();
const DEFAULT_PORT: number = 3000;
const port: string | number = normalizePort(process.env.PORT);
const server: http.Server = http.createServer(app.express);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: any): number | string {
  let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;

  if (port && isNaN(port)) return port;
  else if (port >= 0) return port;
  else return DEFAULT_PORT;
}

function onError(error: ErrnoError): void {
  if (error.syscall !== 'listen') throw error;
  let bind: string = (typeof port === 'string') ? `Pipe ${port}` : `Port ${port.toString()}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  let addr: string = server.address();
  let bind: string = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  logger(`Listening on ${bind}`);
}
```

Alright. This looks like a lot of code, but it's mostly boilerplate with some fancy type annotations added. Let's break it down real quick though anyways:

* At the top we've got our Flow comment, imports, and our first bit of strictly Flow-enabled code - the `ErrnoError` interface declaration. This error type is used by Express. When using the `flow check` command from the official command line tool, Flow will not flag this as an error. For whatever reason, `gulp-flowtype` does. If you get a strange type check error, it may be worth it to install the Flow CLI and double check using `flow check`.
* After the `ErrnoError` definition, we set up some data and instantiate the server by attaching our future Express app with `http.createServer`.
* `normalizePort` looks for the `$PORT` environment variable and sets the app's port to its value. If it doesn't exist, it sets the port to the default value - `3000`.
* `onError` is just our basic error handler for the HTTP server.
* `onListening` simply lets us know that our application has actually started and is listening for requests.

Run `gulp`. Right now, you should see Flow complaining about trying to import the API:

```sh
src/index.js:7
  7: import Api from './Api';
                     ^^^^^^^ ./Api. Required module not found
```

This makes sense because we don't even have a file called *Api.js*, so let's create it and set up the basic structure for the API. In this file, the third-party libraries we'll be using are:

* [Express](http://expressjs.com/) - web framework
* [body-parser](https://github.com/expressjs/body-parser) - JSON body parser for HTTP requests
* [morgan](https://github.com/expressjs/morgan) - request logging

```sh
$ yarn add express@4.14.0 body-parser@1.15.2 morgan@1.7.0
$ flow-typed install --flowVersion=0.36.0
$ touch src/Api.js
```

With the dependencies and libdefs acquired, we're ready to build out the `Api.js` file:

```javascript
// @flow

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';

export default class Api {
  // annotate with the express $Application type
  express: express$Application;

  // create the express instance, attach app-level middleware, attach routers
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
  }

  // register middlewares
  middleware(): void {
    this.express.use(morgan('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({extended: false}));
  }

  // connect resource routers
  routes(): void {
    this.express.use((req: $Request, res: $Response) => {
      res.json({ message: 'Hello Flow!' });
    });
  }
}
```

Most of this file ends up just loading and initializing the libraries that we're using. There are a few things to note though:

* First, we create a field reference for the `Api.express` property, and tell Flow that it will be an object of type `express$Application` from Express.
* The constructor initializes an instance of Express, and attaches it to the instance of `Api`. Then it calls the other two methods, `Api.middleware` and `Api.routes`.
* `Api.middleware` - Initializes and attaches our middleware modules to the app.
* `Api.routes` - Right now, it attaches a single route handler that returns some JSON. However, notice the Flow annotations on the parameters of the anonymous function. These correspond to the base arguments for an Express route handler: `$Request` and `$Response`. These refer to Express' extended versions of Node's `IncomingMessage` and `ServerResponse` objects, respectively.

At this point, you may start to see a Flow error in your terminal that looks something like this:

```sh
src/index.js:12
 12: const server: Server = http.createServer(app.express);
                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ call of method `createServer`
835:     requestListener?: (request: IncomingMessage, response: ServerResponse) => void
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ function type. Callable signature not found in. See lib: /private/tmp/flow/flowlib_120ceaae/node.js:835
 12: const server: Server = http.createServer(app.express);
                                              ^^^^^^^^^^^ express$Application
```

It would appear that Flow doesn't get the memo that when `app.express` is called, it does return a request handler. This seems to be an issue with the libdef for Express, because it declares that the `express$Application` constructor has a return type of `void`.

> **NOTE:** After unsuccessfully messing with the libdef for a while, I decided I knew that it worked better than Flow, and moved on. If the terminal output bugs you, go ahead and add this comment to the line above where `http.createServer` is called:
>
> ```javascript
> // $FlowFixMe: express libdef issue
> ```

Let's go ahead and fire up the app and make sure everything is working as intended thus far. To run the app from the command line, you can run `node build/index.js`. However, we really should have a start script so we can just type `npm start` to run the server. Open up `package.json` and add the following:

```json
"scripts": {
  "start": "DEBUG=\"flow-api:*\" node build/index.js"
}
```

The first part of the command just sets the `DEBUG` environment variable to `flow-api:*`, so that the `debug` module writes our logs to stdout. Now you can run `npm start`, and you should see:

```sh
> DEBUG="flow-api:*" node build/index.js

  flow-api:startup Listening on port 3000 +0ms
```

Awesome! The server is listening. Now, if we hit any endpoint, it should send back our `{ message: "Hello Flow!" }` payload. You can use [httpie](https://httpie.org/) for this kind of thing. If you're on a Mac you can install it with Homebrew: `brew install httpie`. Then within a new terminal window run:

```sh
$ http localhost:3000/
```

And you should see:

```sh
→ HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 25
Content-Type: application/json; charset=utf-8

{
    "message": "Hello Flow!"
}
```

And we're up and running! At this point, we've got the base Express application up and running. Now we just need to build out a router that does something useful!

## Test Setup

Not so fast! Rather than jumping straight into the RESTful router, we're going to set up our testing environment so that as we create endpoints and handlers we can test that they work as we expect. Since we're using the FaceStack, we'll use [Jest](https://facebook.github.io/jest/) as well as [supertest-as-promised](https://github.com/WhoopInc/supertest-as-promised) to interface with our Express API.

Install the packages:

```sh
$ yarn add --dev jest@18.0.0 supertest@2.0.1 supertest-as-promised@4.0.2
```

Open up *package.json* again and add a few lines to configure Jest:

```json
"jest": {
  "transform": {".*": "<rootDir>/node_modules/babel-jest"}
}
```

This just tells Jest to use Babel and our Babel configuration to interpret our test files and the files they test. To run our tests from the command line, we just need to add a test script to `package.json`:

```json
"scripts": {
  "start": "DEBUG=\"flow-api:*\" node build/index.js",
  "test": "jest"
}
```

Right now, if you run it, Jest is just going to tell you it couldn't find any tests So, let's fix that. Create a directory called *\_\_tests\_\_* in the project root, and inside of it add a file to hold our first test:

```sh
$ mkdir __tests__ && touch __tests__/first.test.js
```

```javascript
import request from 'supertest-as-promised';
import Api from '../src/Api';

const app = new Api().express;

describe('Flow API', () => {
  it('hello test', () => {
    return request(app).get('/')
    .expect(200)
    .then((res) => {
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message).toBe('Hello Flow!');
    });
  });
});
```

This is a pretty simple test, but it should at least demonstrate the basic structure of what we're doing here. If you're saying to yourself, "Hey, this looks a lot like Jasmine!",  you're right it does, because Jest is built on top of Jasmine. Here's a quick breakdown of this first test file:

* We import the `Api` class and `supertest-as-promised` to create the interface to the API. This way we don't have to manage starting and stopping the server or actually sending requests over a network connection.
* We assert that we're expecting a 200 status code.
* When the response comes back, we assert that the payload should have a property called `message`, who's value is a string, and that string should equal: "Hello Flow!"

Go ahead and run the tests, `npm test`, and you should see this output:

```sh
> jest

 PASS  __tests__/first.test.js
  Flow API
    ✓ hello test (42ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        2.03s
Ran all test suites.
GET / 200 4.059 ms - 25
```

With the test environment set up, let's build out our first endpoint!

## First Endpoint

Now, we're going to implement CRUD with a single resource - produce. You can use any resource you want or grab the fake data we used [here](https://raw.githubusercontent.com/mjhea0/flow-node-api/master/data/produce.json). In case you're blanking on what CRUD means, we're going to implement 4 actions that the API will support for the produce resource:

1. Create a produce item.
1. Read produce item(s).
1. Update a produce item.
1. Delete a produce item.

We'll start by implementing the `GET` handler that returns all the produce in our inventory, with the following shape:

```javascript
{
  id: integer,
  name: string,
  quantity: integer,
  price: integer
}
```

> **NOTE:** The `id` property will not be supplied by the user, but assigned when an item is created by the API.

Let's start by first writing some tests that we can test our implementation against as we write it. Rename *first.test.js* to *ProduceRouter.test.js*, and replace the current `describe` block with these tests for the `GET` all endpoint:

```javascript
describe('Flow API', () => {

  describe('GET /api/v1/produce - get all produce', () => {
    // properties expected on an obj in the response
    let expectedProps = ['id', 'name', 'quantity', 'price'];
    it('should return JSON array', () => {
      return request(app).get('/api/v1/produce')
      .expect(200)
      .then(res => {
        // check that it sends back an array
        expect(res.body).toBeInstanceOf(Array);
      });
    });
    it('should return objs w/ correct props', () => {
      return request(app).get('/api/v1/produce')
      .expect(200)
      .then(res => {
        // check for the expected properties
        let sampleKeys = Object.keys(res.body[0]);
        expectedProps.forEach((key) => {
          expect(sampleKeys.includes(key)).toBe(true);
        });
      });
    });
    it('shouldn\'t return objs w/ extra props', () => {
      return request(app).get('/api/v1/produce')
      .expect(200)
      .then(res => {
        // check for only expected properties
        let extraProps = Object.keys(res.body[0]).filter((key) => {
          return !expectedProps.includes(key);
        });
        expect(extraProps.length).toBe(0);
      });
    });
  });

});
```

Inside of the outer `describe`, we've added a nested block to indicate that all of the tests inside of it are related and, thus, testing the same feature. These three tests are pretty basic and check that:

* We get an array back.
* The objects in the array have the required properties.
* The objects in the array do not have extra properties.

Run the tests from the terminal with `npm test` and you should see them all fail:

```sh
Flow API
  GET /api/v1/produce - get all produce
    ✕ should return JSON array (42ms)
    ✕ should return objs w/ correct props (9ms)
    ✕ shouldn't return objs w/ extra props (4ms)

Test Suites: 1 failed, 1 total
Tests:       3 failed, 3 total
Snapshots:   0 total
Time:        1.835s, estimated 2s
Ran all test suites.
```

Now, let's get rid of all those errors and failed tests, and implement the endpoint.

Create a new directory inside of "src" called "routers" and add a file called *ProduceRouter.js*. This is where we'll implement the handler functions for all of the endpoints designated for the produce resource.

> **NOTE:** Remember - For Flow to type check the file, you have to add the `@flow` comment at the very top of the file!

```javascript
// @ flow

import inventory from '../../data/produce';
import { Router }  from 'express';

export default class ProduceRouter {
  // these fields must be type annotated, or Flow will complain!
  router: Router;
  path: string;

  // take the mount path as the constructor argument
  constructor(path = '/api/v1/produce') {
    // instantiate the express.Router
    this.router = Router();
    this.path = path;
    // glue it all together
    this.init();
  }

  /**
   * Return all items in the inventory
   */
  getAll(req: $Request, res: $Response): void {
    res.status(200).json(inventory);
  }

  /**
   * Attach route handlers to their endpoints.
   */
  init(): void {
    this.router.get('/', this.getAll);
  }
}
```

The `ProduceRouter` holds fields for an Express `Router` instance, and a `path` property that holds its mount point to the application. The constructor takes this mount point as its only argument and then attaches the endpoint handlers to their endpoints.

> **NOTE:**  The field type annotations for `router` and `path` are not strictly required (as far as I can tell). You can get rid of them, and Flow will not complain. But you can't have field declarations without types. It doesn't like that at all. I tend to use them because they're a useful quick reference to the properties on an object.

The `getAll` function has the basic function signature of an Express route handler, and it simply responds to requests with the full inventory list. Notice that the return type is `void`. This is because of the middleware architecture that Express is built on. Each middleware function is run in sequence, rather than returning a value from the handler.

Finally, in `init` we will take each of our route handlers, and attach it to a mount path on the router. Each endpoint will be prefixed with the overall `Router` mount path that is passed to the `ProduceRouter` constructor. Right now, our `ProduceRouter` is responding to `GET` requests at the `/api/v1/produce` endpoint.

We're done in this file for now, but we'll have to hop back over to `Api.js` in order to finish linking these things up.

Add an import statement for `ProduceRouter` at the top:

```javascript
import ProduceRouter from './routers/ProduceRouter';
```

And then replace the `routes` function with:

```javascript
// connect resource routers
routes(): void {
  // create an instance of ProduceRouter
  const produceRouter = new ProduceRouter();

  // attach it to our express app
  this.express.use(produceRouter.path, produceRouter.router);
}
```

Here, we simply create an instance of the `ProduceRouter` class, and attach it to the Express application path specified by its `path` property. Now cross your fingers and run `npm test`:

```sh
PASS  __tests__/ProduceRouter.test.js
 Flow API
   GET /api/v1/produce - get all produce
     ✓ should return JSON array (43ms)
     ✓ should return objs w/ correct props (10ms)
     ✓ shouldn't return objs w/ extra props (4ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        2.052s
Ran all test suites.
```

Victory! Go ahead and pat yourself on the back, maybe stretch the legs or get a snack. We'll work out the rest of the endpoints in the next section.

## Rounding out CRUD

We've already got one aspect of the "Read" part of CRUD complete. Let's knock the other one out now. Rather than only being able to get the full list of items, we need to enable requesting items by their `id`s. First, we need some tests. Start by making sure that this `getById` handler will:

* Return an object of the correct type.
* Return the record that lines up with the `id` sent with the request.
* Reject out-of-bounds `id`s.


```javascript
describe('GET /api/v1/produce/:id - get produce item by id', () => {
  it('should return an obj of type Produce', () => {
    return request(app).get('/api/v1/produce/1')
    .expect(200)
    .then((res) => {
      const reqKeys = ['id', 'name', 'price', 'quantity'];
      const {item} = res.body;
      // check it has correct keys
      reqKeys.forEach((key) => {
        expect(Object.keys(item)).toContain(key);
      });
      // check type of each field
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(typeof item.quantity).toBe('number');
      expect(typeof item.price).toBe('number');
    });
  });
  it('should return a Produce w/ requested id', () => {
    return request(app).get('/api/v1/produce/1')
    .expect(200)
    .then((res) => {
      expect(res.body.item).toEqual({
        id: 1,
        name: 'banana',
        quantity: 15,
        price: 1
      });
    });
  });
  it('should 400 on a request for a nonexistant id', () => {
    return Promise.all([
      request(app).get('/api/v1/produce/-32')
      .expect(400)
      .then((res) => {
        expect(res.body.message).toBe('No item found with id: -32');
      }),
      request(app).get('/api/v1/produce/99999')
      .expect(400)
      .then((res) => {
        expect(res.body.message).toBe('No item found with id: 99999');
      })
    ]);
  });
});
```

Run those new tests and make sure they fail like they should:

```sh
Flow API
  GET /api/v1/produce - get all produce
    ✓ should return JSON array (38ms)
    ✓ should return objs w/ correct props (8ms)
    ✓ shouldn't return objs w/ extra props (5ms)
  GET /api/v1/produce/:id - get produce item by id
    ✕ should return an obj of type Produce (6ms)
    ✕ should return a Produce w/ requested id (2ms)
    ✕ should 400 on a request for a nonexistant id (9ms)

Test Suites: 1 failed, 1 total
Tests:       3 failed, 3 passed, 6 total
Snapshots:   0 total
Time:        1.857s, estimated 2s
Ran all test suites.
```

Good. Now we can work on making them pass. This one isn't so bad. We just need to parse the ID number from the request params, and find an item in the `inventory` array with the same ID.

```javascript
/**
 * Return an item from the inventory by ID.
 */
getById(req: $Request, res: $Response): void {
  const id = parseInt(req.params.id, 10);
  const record = inventory.find(item => item.id === id);
  if (record) {
    res.status(200).json({
      message: 'Success!',
      item: record
    });
  } else {
    res.status(400).json({
      status: res.status,
      message: `No item found with id: ${id}`
    });
  }
}
```

Not particularly exciting, but it works for now! Just make sure to add the handler as well:

```javascript
this.router.get('/:id', this.getById);
```

That does it for the "R" in CRUD.

### POST - Create a New Item

Let's knock out the "C" now. We're going to allow `POST`s to the endpoint `/api/v1/produce` to be used for creating new items for the inventory. In addition, we'll require that the `quantity`, `price`, and `name` properties are passed.

Tests:

```javascript
describe('POST /api/v1/produce - create new item', () => {
  let peach = {
    name: 'peach',
    quantity: 10,
    price: 6
  };
  it('should accept and add a valid new item', () => {
    return request(app).post('/api/v1/produce')
    .send(peach)
    .then((res) => {
      expect(res.body.status).toBe(200);
      expect(res.body.message).toBe('Success!');
      return request(app).get('/api/v1/produce');
    })
    .then((res) => {
      let returnedPeach = res.body.find(item => item.name === 'peach');
      expect(res.status).toBe(200);
      expect(returnedPeach.quantity).toBe(10);
      expect(returnedPeach.price).toBe(6);
    });
  });
  it('should reject post w/o name, price, or quantity', () => {
    let badItems = [
      {
        name: peach.name,
        quantity: peach.quantity
      },
      {
        quantity: peach.quantity,
        price: peach.price
      },
      {
        name: peach.name,
        price: peach.price
      }
    ];
    return Promise.all(badItems.map(badItem => {
      return request(app).post('/api/v1/produce')
      .send(badItem)
      .then((res) => {
        expect(res.body.status).toBe(400);
        expect(res.body.message.startsWith('Bad Request')).toBe(true);
      });
    }));
  });
});
```

Verify that the tests fail with `npm test`, then add another method to `ProduceRouter` called `postOne`.

> **NOTE:** I ended up also writing functions to parse the payload from the request, as well as one to re-write our JSON "database" file. You can either include those as helper methods somewhere in the same file as `ProduceRouter`, or define them in a different file and import it. If you decide to import it, make sure that you type annotate the function so that Flow can work with its types. I chose to define them in different files and export them from there.

```javascript
/**
 * Add a new item to the inventory.
 */
postOne(req: $Request, res: $Response): void {
  const received: Produce | boolean = parseProduce(req.body);
  const newProduce = (received) ? req.body : null;
  if (received) {
    newProduce.id = genId(received, inventory);
    inventory.push(newProduce);
    res.status(200).json({
      status: 200,
      message: 'Success!',
      item: newProduce
    });
    // write updated inventory to the file
    saveInventory(inventory)
    .then((writePath) => {
      logger(`Inventory updated. Written to:\n\t${path.relative(path.join(__dirname, '..', '..'), writePath)}`);
    })
    .catch((err) => {
      logger('Error writing to inventory file.');
      logger(err.stack);
    });
  } else {
    res.status(400).json({
      status: 400,
      message: 'Bad Request. Make sure that you submit an item with a name, quantity, and price.'
    });
    logger('Malformed POST to /produce.');
  }
}
```

Create a new folder within "src" called "util". Then add a *parsers.js* file:

```javascript
export function parseProduce(input: any): boolean {
  const requirements = [
    { key: 'name', type: 'string' },
    { key: 'quantity', type: 'number' },
    { key: 'price', type: 'number' }
  ];
  return requirements.every((req) => {
    return input.hasOwnProperty(req.key) && typeof input[req.key] === req.type;
  });
}
```

...and *save.js*:

```javascript
// @flow

import path from 'path';
import fs from 'fs';

// use a Flow type import to get our Produce type
import type {Produce} from './types';

export default function saveInventory(inventory: Array<Produce>): Promise<string> {
  let outpath = path.join(__dirname, '..', '..', 'data', 'produce.json');

  return new Promise((resolve, reject) => {
    // lets not write to the file if we're running tests
    if (process.env.NODE_ENV !== 'test') {
      fs.writeFile(outpath, JSON.stringify(inventory, null, '\t'), (err) => {
        (err) ? reject(err) : resolve(outpath);
      });
    }
  });
}

export function genId(prod: Produce, inv: Array<Produce>): number {
  let maxId: number | typeof undefined = inv[0].id;
  inv.slice(1).forEach((item) => {
    if (item.id && item.id > maxId) maxId = item.id;
  });
  return maxId + 1;
}
```

We don't have tests written currently for these, but they're pretty simple functions. Most importantly, now we have a couple utility functions that we can reuse. We'll definitely need to reuse `saveInventory` whenever we need to persist changes to the JSON file holding the inventory.

Add the imports to *ProduceRouter.js*:

```javascript
import saveInventory, {genId} from '../util/save';
import { parseProduce } from '../util/parsers';
```

Then update the `init()`:

```javascript
/**
 * Attach route handlers to their endpoints.
 */
init(): void {
  this.router.get('/', this.getAll);
  this.router.get('/:id', this.getById);
  this.router.post('/', this.postOne);
}
```

With this code filled in, run `npm test` again and when you've got all green check marks, head on to the next section.

### PUT - Update an Item

This route will allow requests to update the properties of a single item. We need to make sure that a user is unable to change the `id` property of the item so that they can't create collisions. To solve this issue, we need to strip out all invalid keys from the submitted payload. But first, a few tests:

```javascript
describe('PUT /api/v1/produce/:id - update an item', () => {
  it('allows updates to props other than id', () => {
    return request(app).put('/api/v1/produce/1')
    .send({ quantity: 20 })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Success!');
      expect(res.body.item.quantity).toBe(20);
    });
  });
  it('rejects updates to id prop', () => {
    return request(app).put('/api/v1/produce/1')
    .send({ id: 10 })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.message.startsWith('Update failed')).toBe(true);
    });
  });
});
```

Add the new handler to `ProduceRouter`:

```javascript
/**
 * Update a Produce item by id.
 */
updateOneById(req: $Request, res: $Response): void {
  const searchId: number | boolean = parseId(req.params);
  const payload: any = parseUpdate(req.body);
  let toUpdate: Produce = inventory.find(item => item.id === searchId);
  if (toUpdate && payload) {
    Object.keys(payload).forEach((key) => {
      if (key === 'quantity' || key === 'price') toUpdate[key] = Number(payload[key]);
      else toUpdate[key] = payload[key];
    });
    res.json({
      status: res.status,
      message: 'Success!',
      item: toUpdate
    });
    saveInventory(inventory)
    .then((writePath) => {
      logger(`Item updated. Inventory written to:\n\t${path.relative(path.join(__dirname, '..', '..'), writePath)}`);
    })
    .catch((err) => {
      logger('Error writing to inventory file.');
      logger(err.stack);
    });
  } else {
    res.status(400).json({
      status: res.status,
      message: 'Update failed. Make sure the item ID and submitted fields are correct.'
    });
  }
}
```

Then, within *parsers.js*, add the `parseId()` and `parseUpdate()` helpers, which are used to clean the payload and requested item ID:

```javascript
export function parseUpdate(input: any): any | null {
  const validKeys = ['name', 'quantity', 'price'];
  const trimmed = Object.keys(input).reduce((obj, curr) => {
    if (obj && validKeys.indexOf(curr) !== -1) {
      obj[curr] = input[curr];
      return obj;
    }
  }, {});
  return (trimmed && Object.keys(trimmed).length > 0) ? trimmed : null;
}

export function parseId(input: any): number | boolean {
  if (input.hasOwnProperty('id'))
    return (typeof input.id === 'string') ? parseInt(input.id, 10) : input.id;
  return false;
}
```

These are fairly straightforward. `parseUpdate` takes in the payload from the request, and strips out any keys that are not `name`, `quantity`, or `price`. Then it just simply returns the trimmed object if there's still keys left, and `null` if not. `parseId` is even simpler: It looks for an `id` property on the payload, converts it to a number (if necessary), and returns.

Update the import in *ProduceRouter.js*:

```javascript
import { parseProduce, parseUpdate, parseId } from '../util/parsers';
```

Then update the `init()`:

```javascript
/**
 * Attach route handlers to their endpoints.
 */
init(): void {
  this.router.get('/', this.getAll);
  this.router.get('/:id', this.getById);
  this.router.post('/', this.postOne);
  this.router.put('/:id', this.updateOneById);
}
```

Run the tests again and ensure they pass. One more route to go!

### DELETE - Remove an Item

This route will allow for deleting an item from the inventory by passing a valid `id` as a URL parameter. This is the same string route that the `getById` and `updateOneById` functions handle, but will use the `DELETE` HTTP method. Here's a few basic tests:

```javascript
describe('DELETE /api/v1/produce/:id - delete an item', () => {
  it('deletes when given a valid ID', () => {
    return request(app).delete('/api/v1/produce/4')
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Success!');
      expect(res.body.deleted.id).toBe(4);
    });
  });
  it('responds w/ error if given invalid ID', () => {
    return Promise.all([-2, 100].map((id) => {
      return request(app).delete(`/api/v1/produce/${id}`)
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('No item found with given ID.');
      });
    }));
  });
});
```

Ensure those fail, and then add the implementation for the handler to `ProduceRouter` as `removeById`:

```javascript
/**
 * Remove an item from the inventory by ID.
 */
removeById(req: $Request, res: $Response): void {
  const searchId: number | boolean = parseId(req.params);
  let toDel: number = inventory.findIndex(item => item.id === searchId);
  if (toDel !== -1) {
    let deleted = inventory.splice(toDel, 1)[0];
    res.json({
      status: 200,
      message: 'Success!',
      deleted
    });
    // update json file
    saveInventory(inventory)
    .then((writePath) => {
      logger(`Item deleted. Inventory written to:\n\t${writePath}`);
    })
    .catch((err) => {
      logger('Error writing to inventory file.');
      logger(err.stack);
    });
  } else {
    res.status(400).json({
      status: 400,
      message: 'No item found with given ID.'
    });
  }
}
```

This obviously looks pretty similar to most of the other handlers. The only difference being that once we get a valid `id`, we search for the object it matches in the inventory, get its index, and then splice it out of the inventory array.

Don't forget the handler:

```javascript
this.router.delete('/:id', this.removeById);
```

Run the tests one last time:

```sh
PASS  __tests__/ProduceRouter.test.js
 Flow API
   ✓ allows updates to props other than id (4ms)
   GET /api/v1/produce - get all produce
     ✓ should return JSON array (50ms)
     ✓ should return objs w/ correct props (11ms)
     ✓ shouldn't return objs w/ extra props (18ms)
   GET /api/v1/produce/:id - get produce item by id
     ✓ should return an obj of type Produce (8ms)
     ✓ should return a Produce w/ requested id (6ms)
     ✓ should 400 on a request for a nonexistant id (9ms)
   POST /api/v1/produce - create new item
     ✓ should accept and add a valid new item (27ms)
     ✓ should reject post w/o name, price, or quantity (9ms)
   PUT /api/v1/produce/:id - update an item
     ✓ allows updates to props other than id (6ms)
     ✓ rejects updates to id prop (7ms)
   DELETE /api/v1/produce/:id - delete an item
     ✓ deletes when given a valid ID (4ms)
     ✓ responds w/ error if given invalid ID (11ms)

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        2.322s
Ran all test suites.
```

Congratulations! You just built an Express API type checked with Flow!

## Conclusion

All in all, working with Flow is interesting, at the very least.

After using both it and TypeScript, Flow's type checking tends to be more strict, but you also spend more time trying to figure out what Flow is getting at and how to fix errors. Part of this is probably that the tooling support for TypeScript is vastly superior. Flow offers a lot of the same functionality that TypeScript does, but there's a TypeScript tool for every single thing you could ever want. It simply isn't the same for Flow. The community doesn't seem to have embraced it with as much enthusiasm. The number of libdefs in the `flow-typed` repository versus `DefinitelyTyped` for TypeScript is tiny. This is probably the biggest problem you'd have to face in choosing to use Flow for static type analysis over TypeScript.

That being said, Flow also offers some distinct advantages.

It's plug-n-play with Babel, so adding Flow to a project using Babel would probably be much less painful than converting it to use TypeScript. Both allow you to do so bit by bit, but Flow handles this more gracefully. TypeScript would usually like to just have you pass everything through the compiler and deal with the type errors as you can. Flow allows you to annotate _only_ the files you want to type check, so adding it to an existing project is much easier. Actually, this is probably the best use case for Flow. It would be cumbersome to start a brand new project with such strict type checking. It definitely slows down the rapid iteration needed at the beginning of a project's life. However, once the project gets to a certain size it's easy to drop in Flow and clean up the errors file by file as you move forward.

You can grab the code from the [flow-node-api](https://github.com/mjhea0/flow-node-api) repo. Best!
