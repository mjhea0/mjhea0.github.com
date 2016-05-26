---
layout: post
toc: true
title: "Swagger and NodeJS"
date: 2016-05-26 07:22:46 -0600
comments: true
categories: node
keywords: "node, express, swagger, api, restful api, crud"
description: "Let's look at how to describe a RESTful API using Swagger and NodeJS."
---

**This tutorial details how to describe a RESTFul API using [Swagger](http://swagger.io/) along with Node and Express.**

<div style="text-align:center;">
  <img src="/images/node-swagger.png" style="max-width: 100%; border:0; box-shadow: none;" alt="node swagger api">
</div>

<br>

By the end of this tutorial, you will be able to...

1. Describe the purpose of Swagger
2. Generate a [Swagger Spec](http://swagger.io/specification/) based on an existing RESTful API developed with Node, Express, and Postgres
- Set up the [Swagger UI](https://github.com/swagger-api/swagger-ui) for testing and interacting with the API

## Swagger

Swagger is a [specification](http://swagger.io/specification/) for describing, producing, consuming, testing, and visualizing a RESTful API. It provides a number of [tools](http://swagger.io/tools/) for automatically generating documentation based on a given endpoint.

Now when you make changes to your code, your documentation is updated and synchronized with the API so that consumers can quickly learn which resources are available, how to access them, and what to expect (status code, content-type, etc.) when interacting with the various endpoints.

## Getting Started

### Starting a New Project

If you're starting a new project, you can easily generate the [Swagger Specification](http://swagger.io/specification/) and project boilerplate using the [Swagger Editor](http://swagger.io/swagger-editor/). Test it out [here](http://editor.swagger.io/#/).

If you don't like the generated project structure, you can just export the JSON (or YAML) spec file and then use a custom generator, like [Swaggerize Express](https://github.com/krakenjs/swaggerize-express), to generate the boilerplate. Then when you need to make changes to the API, you can just update the spec file. Simple.

### Updating an Existing Project

For this tutorial, we will be generating the Swagger spec based on the code from a previously created project that has the following RESTful endpoints:

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

Clone down the project:

```sh
$ git clone https://github.com/mjhea0/node-postgres-promises.git node-swagger-api
$ cd node-swagger-api
$ git checkout tags/v1 -b swagger
$ npm install
```

> Want to learn how this project was created? Check out the [Designing a RESTful API With Node and Postgres](http://mherman.org/blog/2016/03/13/designing-a-restful-api-with-node-and-postgres/#.V0N4PZMrJE4) post.

This project uses Postgres, so run create the database and apply the schema:

```sh
$ psql -f puppies.sql
```

Run the server, and then navigate to [http://localhost:3000/api/puppies](http://localhost:3000/api/puppies) in your browser of choice. You should see:

```json
{
  status: "success",
  data: [
    {
      id: 1,
      name: "Tyler",
      breed: "Shih-tzu",
      age: 3,
      sex: "M"
    }
  ],
  message: "Retrieved ALL puppies"
}
```

Test out each endpoint to make sure everything works before moving on.

## Generating the Swagger Spec

To generate the [Swagger specification](http://swagger.io/specification/), we will be using [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc).

Install swagger-jsdoc:

```sh
$ npm install swagger-jsdoc@1.3.0 --save
```

Add the requirement to *app.js*:

```javascript
var swaggerJSDoc = require('swagger-jsdoc');
```

Then add the following code to *app.js* just below `var app = express();`:

```javascript
// swagger definition
var swaggerDefinition = {
  info: {
    title: 'Node Swagger API',
    version: '1.0.0',
    description: 'Demonstrating how to describe a RESTful API with Swagger',
  },
  host: 'localhost:3000',
  basePath: '/',
};

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ['./routes/*.js'],
};

// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);
```

Take note of the comments above. This code essentially initializes swagger-jsdoc and adds the appropriate metadata to the Swagger specification.

Add the route to serve up the Swagger spec:

```javascript
// serve swagger
app.get('/swagger.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
```

Fire up the server and navigate to [http://localhost:3000/swagger.json](http://localhost:3000/swagger.json) to see the basic spec:

```json
{
  info: {
    title: "Node Swagger API",
    version: "1.0.0",
    description: "Demonstrating how to describe a RESTful API with Swagger"
  },
  host: "localhost:3000",
  basePath: "/",
  swagger: "2.0",
  paths: { },
  definitions: { },
  responses: { },
  parameters: { },
  securityDefinitions: { }
}
```

Now we need to update the routes...

## Updating the Route Handlers

swagger-jsdoc uses [JSDoc](http://usejsdoc.org/)-style comments to generate the Swagger spec. So, add such comments, in YAML, to the route handlers that describe their functionality.

### GET ALL

Add the comments in */routes/index.js* just above the handler, like so:

```javascript
/**
 * @swagger
 * /api/puppies:
 *   get:
 *     tags:
 *       - Puppies
 *     description: Returns all puppies
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of puppies
 *         schema:
 *           $ref: '#/definitions/Puppy'
 */
router.get('/api/puppies', db.getAllPuppies);
```

This should be fairly self-explanatory. We have an `/api/puppies` endpoint that returns a 200 response to a GET request. The `$ref` is used to re-use definitions to keep the code DRY.

Add the following code above the previous code:

```javascript
/**
 * @swagger
 * definition:
 *   Puppy:
 *     properties:
 *       name:
 *         type: string
 *       breed:
 *         type: string
 *       age:
 *         type: integer
 *       sex:
 *         type: string
 */
```

Now we can use that definition for each of the HTTP methods.

For more information and examples, please see the [Swagger Specification](http://swagger.io/specification/).

### GET Single

```javascript
/**
 * @swagger
 * /api/puppies/{id}:
 *   get:
 *     tags:
 *       - Puppies
 *     description: Returns a single puppy
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Puppy's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single puppy
 *         schema:
 *           $ref: '#/definitions/Puppy'
 */
```

### POST

```javascript
/**
 * @swagger
 * /api/puppies:
 *   post:
 *     tags:
 *       - Puppies
 *     description: Creates a new puppy
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: puppy
 *         description: Puppy object
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Puppy'
 *     responses:
 *       200:
 *         description: Successfully created
 */
```

### PUT

```javascript
/**
 * @swagger
 * /api/puppies/{id}:
 *   put:
 *     tags: Puppies
 *     description: Updates a single puppy
 *     produces: application/json
 *     parameters:
 *       name: puppy
 *       in: body
 *       description: Fields for the Puppy resource
 *       schema:
 *         type: array
 *         $ref: '#/definitions/Puppy'
 *     responses:
 *       200:
 *         description: Successfully updated
 */
```

### DELETE

```javascript
/**
 * @swagger
 * /api/puppies/{id}:
 *   delete:
 *     tags:
 *       - Puppies
 *     description: Deletes a single puppy
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Puppy's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully deleted
 */
```

Check out the updated spec at [http://localhost:3000/swagger.json](http://localhost:3000/swagger.json).

## Adding Swagger UI

Finally, download the [Swagger UI repo](https://github.com/swagger-api/swagger-ui), add the "dist" folder from the downloaded repo to the "public" folder in the project directory, and then rename the directory to "api-docs".

Now within *index.html* inside the "api-docs" directory just update this line-

```html
url = "http://petstore.swagger.io/v2/swagger.json";
```

To-

```html
url = "http://localhost:3000/swagger.json";
```

Finally, navigate to [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/) in your browser to test out the API endpoints:

<div style="text-align:center;">
  <img src="/images/swagger-ui.png" style="max-width: 100%; border:0; box-shadow: none;" alt="Swagger UI">
</div>

<br><hr><br>

Download the [code](https://github.com/mjhea0/node-swagger-api) from the repo. Cheers!