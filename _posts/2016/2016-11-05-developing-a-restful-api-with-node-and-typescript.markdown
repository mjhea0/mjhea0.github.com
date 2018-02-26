---
layout: post
title: "Developing a RESTful API with Node and TypeScript"
date: 2016-11-05 07:38:56
comments: true
toc: true
categories: [node, static types, testing]
keywords: "node, express, typescript, RESTful API, TypeScript, tdd, test-driven development, static types"
description: "This tutorial takes a test-first approach to developing a RESTful API with NodeJS, ExpressJS, and TypeScript."
---

This tutorial details how to develop a RESTful API with [NodeJS](https://nodejs.org/en/), [ExpressJS](http://expressjs.com/), and [TypeScript](https://www.typescriptlang.org/) using test-driven development (TDD).

<div style="text-align:center;">
  <img src="/assets/img/blog/typescript-logo.png" style="max-width: 80%; border:0; box-shadow: none;" alt="typescript logo">
</div>

*We will be using:*

  - NodeJS v[7.0.0](https://nodejs.org/docs/v7.0.0/api/all.html)
  - ExpressJS v[4.14.0](http://expressjs.com/4x/api.html)
  - TypeScript v[2.0.6](https://github.com/Microsoft/TypeScript/releases/tag/v2.0.6)

Additionally, we will use *[tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)* to configure the project, [Gulp](http://gulpjs.com/) to automate [transpilation](https://en.wikipedia.org/wiki/Source-to-source_compiler), and [d.ts](https://github.com/typings/typings) for managing typings with `npm`.

*Updates:*

  - 12/08/2017: Added Windows 10 equivalent commands
  - 11/18/2017: Updated *ts-node* to the latest version
  - 03/12/2017: Updated the *gulpfile.js* and *package.json*

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Contents

1. Project Setup
1. Express Config
1. The API
1. First Endpoint
1. Second Endpoint
1. What's Next?

## Project Setup

To start, we need to set a means to transpile TypeScript into JavaScript that works well with Node. Enter the *tsconfig.json* file. This is similar to a *package.json* or *.babelrc* or really any project-level configuration file you may use. As you can probably guess, it will configure the TypeScript compiler for the project.

Make a new directory to hold the project, and add a *tsconfig.json* file:

```sh
$ mkdir typescript-node-api
$ cd typescript-node-api
$ touch tsconfig.json
```

We'll use a pretty basic configuration for today:

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

Here:

- in `compilerOptions` we tell TypeScript that we'll be targeting ES2015 and that we'd like a [CommonJS](https://en.wikipedia.org/wiki/CommonJS) style module as output (the same module style that Node uses)
- the `include` section tells the compiler to look for *.ts* files in the "src" directory
- the `exclude` section tells the compiler to ignore anything in "node_modules"

> **NOTE:** Review the [TypeScript docs](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) if you want more info on all the options you can define in the *tsconfig.json* file,  They are the same options that you can pass directly to the [TypeScript compiler wrapper](https://www.npmjs.com/package/typescript-compiler).

Add a "src" directory:

```sh
$ mkdir src
```

Before moving any further, let's make sure this configuration works like we expect using the [TypeScript compiler wrapper](https://www.npmjs.com/package/typescript-compiler). Create a *package.json* and install TypeScript:

```sh
$ npm init -y
$ npm install typescript@2.0.6 --save-dev
```

Create a new file called *test.ts* within the "src" directory and add the following:

```javascript
console.log('Hello, TypeScript!');
```

Finally, let's run this one-liner through the compiler. From the project root, run the `tsc` that we installed above in our test file with:

```sh
$ node_modules/.bin/tsc
```

Given no arguments, `tsc` will first look at *tsconfig.json* for instruction. When it finds the config, it uses those settings to build the project. You should see a new file inside of "src" called *test.js* with the same line of code in it. Awesome!

Now that the compiler is installed and working, let's change up the config to make things easier on ourselves. First, we'll add an `outDir` property to the `compilerOptions` of `tsconfig.json` to tell TypeScript to place all of our transpiled JavaScript into a different directory rather than compiling the files right next to their source *.ts* files:

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "dist"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

Remove the *test.js* file from the "src" folder. Now, run the compiler again, and you'll see that `test.js` is delivered to the `dist` directory.

This is much nicer, but let's take it one step further. Instead of returning to the terminal after each change and manually running the compiler each time let's automate the process with Gulp:

```sh
$ npm install gulp@3.9.1 gulp-typescript@3.1.1 --save-dev
```

> **NOTE:** You'll also want to globally install `gulp` to trigger Gulp tasks easily from the command line: `npm install -g gulp@3.9.1`

Add a *gulpfile.js* to the root of the directory. This is where we'll automate the compiling of our source files:

1. Pull in the *tsconfig.json* and pass it to `gulp-typescript` for configuration
1. Tell `gulp-typescript` to transpile our project and deliver it to "dist"
1. Tell Gulp to watch our source *.ts* files, so that our transpiled JavaScript automatically gets rebuilt upon file changes

Add the code:

```javascript
const gulp = require('gulp');
const ts = require('gulp-typescript');
const JSON_FILES = ['src/*.json', 'src/**/*.json'];

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], () => {
  gulp.watch('src/**/*.ts', ['scripts']);
});

gulp.task('assets', function() {
  return gulp.src(JSON_FILES)
  .pipe(gulp.dest('dist'));
});

gulp.task('default', ['watch', 'assets']);
```

To test this out, remove *dist/test.js*, and then add build script to *package.json*:

```json
"scripts": {
  "build": "gulp scripts"
},
```

Then, run `npm run build` from the project root. You'll see Gulp start up and *test.js* should be compiled again and placed into "dist". Awesome! Our project is now configured.

Let's move on to working with Express...

## Express Config

For our Express server, we'll use the [express-generator](https://github.com/expressjs/generator) as our template. We'll start with what would be the "bin/www" file and create an HTTP server, initialize it, and then attach our Express app to it.

Install Express along with [debug](https://github.com/visionmedia/debug) (to provide some nice terminal output while developing):

```sh
$ npm install express@4.14.0 debug@2.2.0 --save
```

In TypeScript, when you install third-party packages, you should also pull down the package's type definitions. This tells the compiler about the structure of the module that you're using, giving it the information needed to properly evaluate the types of structures that you use from the module.

Before TypeScript 2.0, dealing with *.d.ts* (type definition) files could be a real nightmare. The language had a built in tool, `tsd`, but it was a bear to work with and you had to decorate your TypeScript files with triple-slash comments to pull declarations into your file. Then [typings](https://github.com/typings/typings) came along and things were much better, but there were still some issues and now you had another separate package manager to manage in your project.

With TypeScript 2.0, TypeScript definitions are managed by `npm` and installed as [scoped packages](https://docs.npmjs.com/misc/scope). This means two things for you:

1. Dependency management is simplified
1. To install a [type module](https://www.npmjs.com/~types), prefix its name with `@types/`

Install the type definitions for Node, Express, and debug:

```sh
$ npm install @types/node@6.0.46 @types/express@4.0.33 @types/debug@0.0.29 --save-dev
```

With that, we're ready to create the HTTP server. Rename *src/test.ts* to *src/index.ts*, remove the console log, and add the following:

```javascript
import * as http from 'http';
import * as debug from 'debug';

import App from './App';

debug('ts-express:server');

const port = normalizePort(process.env.PORT || 3000);
App.set('port', port);

const server = http.createServer(App);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: number|string): number|string|boolean {
  let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
  switch(error.code) {
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
  let addr = server.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}
```

If you're using an editor with rich TypeScript [support](https://atom.io/packages/atom-typescript), it's not going to appreciate `import App from './App';`, but just ignore it for now. The rest of this file is pretty straightforward:

1. Use `debug` to set up some terminal logging for the app
1. Get a port value from the environment, or set a default port number of 3000
1. Create the HTTP server, and pass `App` to it (this will be our Express app)
1. Set up some basic error handling and a terminal log to show us when the app is ready and listening

Since this file will start the app, let's also add a `"start"` script to `package.json` for convenience:

```json
"scripts": {
  "start": "node dist/index.js",
  "build": "gulp scripts"
},
```

Before we can start the app up, let's make the *App.ts* file that we referenced on in *index.ts*. It's also a good time to go ahead and install the dependencies we'll use in the Express application.

```sh
$ touch src/App.ts
$ npm install express@4.14.0 body-parser@1.15.2 morgan@1.7.0 --save
$ npm install @types/body-parser@0.0.33 @types/morgan@1.7.32 --save-dev
```

Inside of *App.ts* let's create the `App` class to package up and configure our Express server. An instance of `App` will:

- Hold a reference to our instance of Express
- Automatically configure any middleware that we want to use
- Attach any routers/route handlers that we create

Essentially, it's going to bootstrap the app and deliver it to the call to `http.createServer` in *index.ts*.

*App.ts*:

```javascript
import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public express: express.Application;

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(logger('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  // Configure API endpoints.
  private routes(): void {
    /* This is just to get up and running, and to make sure what we've got is
     * working so far. This function will change when we start to add more
     * API endpoints */
    let router = express.Router();
    // placeholder route handler
    router.get('/', (req, res, next) => {
      res.json({
        message: 'Hello World!'
      });
    });
    this.express.use('/', router);
  }

}

export default new App().express;
```

Here's a quick rundown:

- The `App.express` field holds a reference to Express. This makes it easier to access `App` methods for configuration and simplifies exporting the configured instance to *index.ts*.
- `App.middleware` configures our Express middleware. Right now we're using the [`morgan`](https://github.com/expressjs/morgan) logger and [`body-parser`](https://github.com/expressjs/body-parser).
- `App.routes` will be used to link up our API endpoints and route handlers.

> **NOTE**: If you have a text editor with rich TypeScript support, the error in *index.ts* should have disappeared.

Currently, there's a simple placeholder handler for the base URL that should return a JSON payload with `{ "message": "Hello World!" }`. Before writing more code, let's make sure that we're starting with a working, listening, and hopefully responding server. We're going to use [httpie](https://httpie.org/) for this quick sanity check.

Compile, and then run the server:

```sh
$ gulp scripts
$ npm start
```

To test, open a new terminal window and run:

```sh
$ http localhost:3000
```

If everything has gone well, you should get a response similar to this:

```sh
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 26
Content-Type: application/json; charset=utf-8
X-Powered-By: Express

{
    "message": "Hello World!"
}

```

The server is listening! Now we can start building the API.

## The API

Since we're good developers (and citizens), let's utilize TDD (test-driven development) while we build out the API. That means we want to set up a testing environment. We'll be writing our test files in TypeScript, and using [Mocha](http://mochajs.org/) and [Chai](http://chaijs.com/) to create the tests. Let's start by installing these to our `devDependencies`:

```sh
$ npm install mocha@3.1.2 chai@3.5.0 chai-http@3.0.0 --save-dev
$ npm install @types/mocha@2.2.32 @types/chai@3.4.34 @types/chai-http@0.0.29 --save-dev
```

If we write out tests in *.ts* files, we'll need to make sure that Mocha can understand them. By itself, Mocha can only interpret JavaScript files, not TypeScript. There are a number of different ways to accomplish this. To keep it simple, we'll leverage `ts-node`, so that we can provide TypeScript interpretation to the Mocha environment without having to transpile the tests into different files. `ts-node` will interpret and transpile our TypeScript in memory as the tests are run.

Start by installing `ts-node`:

```sh
$ npm install ts-node@3.3.0 --save-dev
```

Now, in `package.json`, add a `test` script to run mocha with the `ts-node` register:

```json
"scripts": {
  "start": "node dist/index.js",
  "test": "mocha --reporter spec --compilers ts:ts-node/register 'test/**/*.test.ts'",
  "build": "gulp scripts"
},
```

With the environment all set up, let's write our first test for the "Hello World" route we created in *App.ts*. Start by adding a "test" folder to the route, and add a file called *helloWorld.test.ts*:

```javascript
import * as mocha from 'mocha';
import * as chai from 'chai';
import chaiHttp = require('chai-http');

import app from '../src/App';

chai.use(chaiHttp);
const expect = chai.expect;

describe('baseRoute', () => {

  it('should be json', () => {
    return chai.request(app).get('/')
    .then(res => {
      expect(res.type).to.eql('application/json');
    });
  });

  it('should have a message prop', () => {
    return chai.request(app).get('/')
    .then(res => {
      expect(res.body.message).to.eql('Hello World!');
    });
  });

});
```

In the terminal, run `npm test` you should see both test pass for the `baseRoute` describe block. Excellent! Now we can test our routes as we build out the API.

## First Endpoint

Our API will be delivering data on superheros, so we'll need to have a datastore for the API to access. Rather than setting up a full database, for this example let's use a JSON file as our "database". Grab the data [here](https://raw.githubusercontent.com/mjhea0/typescript-node-api/master/src/data.json) and save it to a new file called *data.json* in the "src" folder.

With this little store of data, we'll implement a CRUD interface for the superhero resource. To start, let's implement an endpoint that returns all of our superheros. Here's a test for this endpoint:

```javascript
import * as mocha from 'mocha';
import * as chai from 'chai';
import chaiHttp = require('chai-http');

import app from '../src/App';

chai.use(chaiHttp);
const expect = chai.expect;

describe('GET api/v1/heroes', () => {

  it('responds with JSON array', () => {
    return chai.request(app).get('/api/v1/heroes')
      .then(res => {
        expect(res.status).to.equal(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(5);
      });
  });

  it('should include Wolverine', () => {
    return chai.request(app).get('/api/v1/heroes')
      .then(res => {
        let Wolverine = res.body.find(hero => hero.name === 'Wolverine');
        expect(Wolverine).to.exist;
        expect(Wolverine).to.have.all.keys([
          'id',
          'name',
          'aliases',
          'occupation',
          'gender',
          'height',
          'hair',
          'eyes',
          'powers'
        ]);
      });
  });

});
```

Add this to a new file called *test/hero.test.ts*.

To summarize, the test asserts that:

- the endpoint is at `/api/v1/heroes`
- it returns a JSON array of hero objects
- we can find Wolverine, and his object contains all the keys that we expect

When you run `npm test`, you should see this one fail with a `Error: Not Found` in the terminal. Good. This is expected since we haven't set up the route yet.

It's finally that time: Let's implement our CRUD routes!

To start, create a new folder `src/routes` and create a new file inside the directory named *HeroRouter.ts*. Inside of here, we'll implement each CRUD route for the superhero resource. To hold each route, we'll have a `HeroRouter` class that defines the handler for each route, and an `init` function that attaches each handler to an endpoint with the help of an instance of `Express.Router`.

```javascript
import {Router, Request, Response, NextFunction} from 'express';
const Heroes = require('../data');

export class HeroRouter {
  router: Router

  /**
   * Initialize the HeroRouter
   */
  constructor() {
    this.router = Router();
    this.init();
  }

  /**
   * GET all Heroes.
   */
  public getAll(req: Request, res: Response, next: NextFunction) {
    res.send(Heroes);
  }

  /**
   * Take each handler, and attach to one of the Express.Router's
   * endpoints.
   */
  init() {
    this.router.get('/', this.getAll);
  }

}

// Create the HeroRouter, and export its configured Express.Router
const heroRoutes = new HeroRouter();
heroRoutes.init();

export default heroRoutes.router;
```

We also need to modify the `routes` function of `App` to use our new `HeroRouter`. Add the import at the top of *App.ts*:

```javascript
import HeroRouter from './routes/HeroRouter';
```

Then add the API endpoint to `private routes(): void`:

```javascript
// Configure API endpoints.
private routes(): void {
  /* This is just to get up and running, and to make sure what we've got is
   * working so far. This function will change when we start to add more
   * API endpoints */
  let router = express.Router();
  // placeholder route handler
  router.get('/', (req, res, next) => {
    res.json({
      message: 'Hello World!'
    });
  });
  this.express.use('/', router);
  this.express.use('/api/v1/heroes', HeroRouter);
}
```

Now run `npm test` and ensure that our tests pass:

```sh
baseRoute
  ✓ should be json
  ✓ should have a message prop

GET api/v1/heroes
  ✓ responds with JSON array
  ✓ should include Wolverine
```

## Second Endpoint

Now we're really rolling! Before moving on though, let's break the process down since we'll be repeating it to create and attach each of our route handlers:

1. Create a method on `HeroRouter` that takes the arguments of your typical Express request handler: `request`, `response`, and `next`.
1. Implement the server's response for the endpoint.
1. Inside of `init`, use `HeroRouter`'s instance of the Express `Router` to attach the handler to an endpoint of the API.

We'll follow this same workflow for each endpoint, and can leave `App` alone. All of our `HeroRouter` endpoints will be appended to `/api/v1/heroes`. Let's implement a `GET` handler that returns a single hero by the `id` property. We'll test the endpoint by looking for Luke Cage, who has an `id` of 1.

```javascript
describe('GET api/v1/heroes/:id', () => {

  it('responds with single JSON object', () => {
    return chai.request(app).get('/api/v1/heroes/1')
      .then(res => {
        expect(res.status).to.equal(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
      });
  });

  it('should return Luke Cage', () => {
    return chai.request(app).get('/api/v1/heroes/1')
      .then(res => {
        expect(res.body.hero.name).to.equal('Luke Cage');
      });
  });

});
```

And the route handler:

```javascript
/**
 * GET one hero by id
 */
public getOne(req: Request, res: Response, next: NextFunction) {
  let query = parseInt(req.params.id);
  let hero = Heroes.find(hero => hero.id === query);
  if (hero) {
    res.status(200)
      .send({
        message: 'Success',
        status: res.status,
        hero
      });
  }
  else {
    res.status(404)
      .send({
        message: 'No hero found with the given id.',
        status: res.status
      });
  }
}

/**
 * Take each handler, and attach to one of the Express.Router's
 * endpoints.
 */
init() {
  this.router.get('/', this.getAll);
  this.router.get('/:id', this.getOne);
}
```

Run the tests!

```
baseRoute
  ✓ should be json
  ✓ should have a message prop

GET api/v1/heroes
  ✓ responds with JSON array
  ✓ should include Wolverine
    ✓ responds with single JSON object
    ✓ should return Luke Cage
```

## What's Next?

For the hero resource, we should have endpoints for updating a hero and deleting a hero, but we'll leave that for you to implement. The structure that we've set up here should guide you through creating those last endpoints.

Once the hero resource is implemented, we could add more resources to the API easily. To follow the same process we would:

1. Create a new file inside of *src/routes* to be the router for the resource.
1. Attach the resource router to the Express app inside of the `routes` method of `App`.

Now you're up and running with Express and TypeScript 2.0. Go build something! You can grab the code from the [typescript-node-api](https://github.com/mjhea0/typescript-node-api) repo. Cheers!

## Windows 10

On Windows 10? Here are some edits and command line equivalents:

| Unix                                                                       | Windows                                                                                          |
|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| `touch tsconfig.json`                                                        | `copy /b tsconfig.json +,,` |
| `node_modules/.bin/tsc` | `.\node_modules\\.bin\\tsc` |
| `mocha --reporter spec --compilers ts:ts-node/register 'test/**/*.test.ts'` | `mocha --reporter spec --compilers ts:ts-node/register \"test/**/*.test.ts*\""` |

You also may need to install:

```sh
$ npm install @types/express-serve-static-core@4.0.49
```

And:

```sh
$ npm install -g chai@3.0.0 \
              chai-webdriver@1.2.0 \
              webdriver-sizzle@0.2.2 \
              selenium-webdriver@3.6.0
```
