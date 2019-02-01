---
layout: post
title: "Node, gRPC, and Postgres"
date: 2019-02-01 07:00:00
comments: true
toc: true
categories: [grpc, node]
keywords: "grpc, node"
description: "This tutorial looks at how to implement an API with Node, gRPC, and Postgres."
---

[gRPC](https://grpc.io/) is an open source [remote procedure call](https://en.wikipedia.org/wiki/Remote_procedure_call) (RPC) framework developed by Google. It's built on top of [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2), and it uses [Protocol Buffers](https://developers.google.com/protocol-buffers/) as the underlying data serialization format.

This tutorial looks at how to implement an API with Node, gRPC, and Postgres.

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Learning Objectives

1. Explain what gRPC is and how it compares to REST
1. Define the service definition and payload message structure using a Protocol Buffer
1. Describe the four types of methods--unary, client streaming, server streaming, and bidirectional streaming
1. Create a gRPC server and client in Node
1. Invoke the gRPC server from the client via the gRPC stubs
1. Describe the static and dynamic approaches to Protocol Buffers in Node

## gRPC

As mentioned, gRPC is an RPC framework that leverages HTTP/2 and Protocol Buffers, making it a fast, secure, and reliable communication protocol for microservices.

> New to gRPC? Start with the official [What is gRPC?](https://grpc.io/docs/) guide.

*So, how does gRPC compare to REST?*

We'll use the most common implementation of REST for this comparison: An API that uses the HTTP verbs--GET, POST, PUT, DELETE--to accept and return JSON.

1. *Speed*: HTTP/2 supports bidirectional streams (and flow control), so once a connection is established the client or server can push and pull data. Check out this [demo](http://www.http2demo.io/) of HTTP/1.1 vs. HTTP/2 for a performance comparison. Also, you can read all about the features in HTTP/2 [here](https://http2.github.io/faq/).
1. *Messages* (instead of resources and verbs): With gRPC you are no longer constrained to a limited set of methods. You can create your own methods, like `getCustomerList` or `emailCustomerOrderReceipt`, that can be leveraged by simply calling the method. And, from a developer's perspective, calling a gRPC method looks and feels just like calling any other native local method--it's just making a network call beneath the scenes.
1. *Protocol Buffers*: gRPC uses Protocol Buffers (strongly typed, binary-based) rather than JSON (loosely typed, text-based), which is much more efficient and introduces type safety. The service definitions themselves are defined declaratively and are used to generate client libraries. Further, Protocol Buffers, when compared to JSON, can decrease the size of the payloads being transmitted, which, at scale, can reduce bandwidth cost.

> For more on gRPC vs REST, review the [REST vs. gRPC: Battle of the APIs](https://code.tutsplus.com/tutorials/rest-vs-grpc-battle-of-the-apis--cms-30711) blog post.

## Project Setup

Create a new directory to hold the project:

```sh
$ mkdir node-grpc-crud
$ cd node-grpc-crud
```

> If you don't want to code along, you can find the [final code on GitHub](https://github.com/mjhea0/node-grpc-crud).

Then, add the following files and folders:

```sh
├── client
│   ├── app.js
│   └── package.json
├── protos
└── server
    ├── index.js
    └── package.json
```

Finally, spin up [PostgreSQL](https://www.postgresql.org/) on port 5432 and create a new database called `grpc_products`.

## gRPC Service

Throughout this tutorial, you'll be building a product API backed by gRPC that handles the basic CRUD functionality.

Let's start by [implementing a gRPC Service](https://developers.google.com/protocol-buffers/docs/proto3#services), which is defined by the methods it exposes along with it's associated parameters and return message types.

Add a new file to the "protos" folder called *product.proto* to hold the gRPC service definition and message type definitions:

```protobuf
syntax = "proto3";
package product;

// service definition

service ProductService {
  rpc listProducts(Empty) returns (ProductList) {}
  rpc readProduct(ProductId) returns (Product) {}
  rpc createProduct(newProduct) returns (result) {}
  rpc updateProduct(Product) returns (result) {}
  rpc deleteProduct(ProductId) returns (result) {}
}

// message type definitions

message Empty {}

message ProductList {
  repeated Product products = 1;
}

message ProductId {
  int32 id = 1;
}

message Product {
  int32 id = 1;
  string name = 2;
  string price = 3;
}

message newProduct {
  string name = 1;
  string price = 2;
}

message result {
  string status = 1;
}
```

> Using VSCode? Check out the [proto3 vscode extension](https://marketplace.visualstudio.com/items?itemName=zxh404.vscode-proto3).

First, we used the [proto3](https://developers.google.com/protocol-buffers/docs/proto3) version of the Protocol Buffer language:

```protobuf
syntax = "proto3";
```

Then, we defined a [package specifier](https://developers.google.com/protocol-buffers/docs/proto3#packages):

```protobuf
package product;
```

> The package specifier is optional but it's generally a good idea to use to avoid name clashes. Review the [JavaScript Generated Code](https://developers.google.com/protocol-buffers/docs/reference/javascript-generated#package) reference guide for more info.

Next, we defined five RPC methods that align to the basic CRUD operations:

| CRUD   | gRPC method   |
|--------|---------------|
| Read   | listProducts  |
| Create | createProduct |
| Read   | readProduct   |
| Update | updateProduct |
| Delete | deleteProduct |

There are [four types of methods](https://grpc.io/docs/guides/concepts.html#rpc-life-cycle) in gRPC-land:

| Type                    | Description                                              | Example                                                                  |
|-------------------------|----------------------------------------------------------|--------------------------------------------------------------------------|
| Unary                   | client sends a single request and gets a single response | `rpc getData(req) returns (rsp) {}`               |
| Server streaming        | client sends a single request and gets back a stream     | `rpc getData(req) returns (stream rsp) {}`        |
| Client streaming        | client sends stream and gets back a single response      | `rpc getData(stream req) returns (rsp) {}`        |
| Bidirectional streaming | both the client and server send and receive streams      | `rpc getData(stream req) returns (stream rsp) {}` |

Our example uses the Unary approach.

The first method, `listProducts`, takes an `Empty` message and returns a `ProductList` message, which has a repeated `Product` field called `products`:

```protobuf
message ProductList {
  repeated Product products = 1;
}
```

> The [repeated](https://developers.google.com/protocol-buffers/docs/proto3#specifying-field-rules) keyword is used to define an array of objects.

We also created an `Empty` message as the empty stub for empty requests and responses:

```protobuf
message Empty {}
```

The next method, `readProduct`, takes a `ProductId` and returns a `Product`:

```protobuf
message Product {
  int32 id = 1;
  string name = 2;
  string price = 3;
}
```

This has three [scalar value fields](https://developers.google.com/protocol-buffers/docs/proto3#scalar), each with a [unique numbered tag](https://developers.google.com/protocol-buffers/docs/proto3#assigning-field-numbers):

1. id (int32)
1. name (string)
1. price (string)

We created a `ProductId` as well with a single int32 field:

```protobuf
message ProductId {
  int32 id = 1;
}
```

Next, `createProduct` takes a `newProduct` and returns a `result`, which will be just a status message of "success" or "failure". Take note of the `newProduct` message and the `updateProduct` and `deleteProduct` methods on your own.

With the service defined, you can now generate interfaces in a number of different languages.

## Server

Moving on, let's create the gRPC server that will be used to serve up the remote procedure calls.

### Setup

Start by updating the *package.json* file in the "server" folder:

```json
{
  "name": "node-grpc-server",
  "dependencies": {
    "@grpc/proto-loader": "^0.4.0",
    "google-protobuf": "^3.6.1",
    "grpc": "^1.18.0",
    "knex": "^0.16.3",
    "pg": "^7.8.0"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

Take note of the dependencies:

1. [@grpc/proto-loader](https://www.npmjs.com/package/@grpc/proto-loader): loads *.proto* files
1. [google-protobuf](https://www.npmjs.com/package/google-protobuf): JavaScript version of the Protocol Buffers runtime library
1. [grpc](https://www.npmjs.com/package/grpc): Node gRPC Library
1. [knex](https://www.npmjs.com/package/knex): SQL query builder for Node
1. [pg](https://www.npmjs.com/package/pg): PostgreSQL client for Node

Before installing, you will need to install `protoc`, the Protobuf Compiler. If you're on a Mac, it's easiest to install with [Homebrew](https://brew.sh/):

```sh
$ brew install protobuf
```

Otherwise, you can manually download and install it from [here](https://github.com/protocolbuffers/protobuf/releases/tag/v3.6.1).

Now you can install the NPM dependencies:

```sh
$ cd server
$ npm install
```

Next, add a *knexfile.js* file to the “server” folder:, which is used for configuring knex for different environments--e.g., local, development, production:

```javascript
const path = require('path');

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: '127.0.0.1',
      user: '',
      password: '',
      port: '5432',
      database: 'grpc_products',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.join(__dirname, 'db', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'db', 'seeds'),
    },
  },
};
```

Add the appropriate username and password. Then, create the a "db" directory along with the "migrations" and "seeds" directories. Your project structure should now look like:

```sh
├── client
│   ├── app.js
│   └── package.json
├── protos
│   └── product.proto
└── server
    ├── db
    │   ├── migrations
    │   └── seeds
    ├── index.js
    ├── knexfile.js
    ├── package-lock.json
    └── package.json
```

Create a new migration file:

```sh
$ ./node_modules/.bin/knex migrate:make products
```

Then, add the following code to the migration stub in "server/db/migrations":

```javascript
exports.up = function (knex, Promise) {
  return knex.schema.createTable('products', function (table) {
    table.increments();
    table.string('name').notNullable();
    table.string('price').notNullable();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('products');
};
```

Apply the migration:

```sh
$ ./node_modules/.bin/knex migrate:latest
```

Create a new seed file:

```sh
$ ./node_modules/.bin/knex seed:make products
```

Add the code:

```javascript
exports.seed = function (knex, Promise) {
  // Deletes ALL existing entries
  return knex('products').del()
    .then(function () {
      // Inserts seed entries
      return knex('products').insert([
        { name: 'pencil', price: '1.99' },
        { name: 'pen', price: '2.99' },
      ]);
    });
};
```

Apply the seed:

```sh
$ ./node_modules/.bin/knex seed:run
```

Finally, wire up the basic server in *index.js*:

```javascript
// requirements
const path = require('path');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');

// knex
const environment = process.env.ENVIRONMENT || 'development';
const config = require('./knexfile.js')[environment];
const knex = require('knex')(config);

// grpc service definition
const productProtoPath = path.join(__dirname, '..', 'protos', 'product.proto');
const productProtoDefinition = protoLoader.loadSync(productProtoPath);
const productPackageDefinition = grpc.loadPackageDefinition(productProtoDefinition).product;
/*
Using an older version of gRPC?
(1) You won't need the @grpc/proto-loader package
(2) const productPackageDefinition = grpc.load(productProtoPath).product;
*/

// knex queries
function listProducts(call, callback) {}
function readProduct(call, callback) {}
function createProduct(call, callback) {}
function updateProduct(call, callback) {}
function deleteProduct(call, callback) {}

// main
function main() {
  const server = new grpc.Server();
  // gRPC service
  server.addService(productPackageDefinition.ProductService.service, {
    listProducts: listProducts,
    readProduct: readProduct,
    createProduct: createProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
  });
  // gRPC server
  server.bind('localhost:50051', grpc.ServerCredentials.createInsecure());
  server.start();
  console.log('gRPC server running at http://127.0.0.1:50051');
}

main();
```

Here, we load the gRPC service definition, create a new gRPC server, add the service to the server, and then run the server on [http://localhost:50051](http://localhost:50051).

Take note of the `addService` method:

```javascript
server.addService(productPackageDefinition.ProductService.service, {
  listProducts: listProducts,
  readProduct: readProduct,
  createProduct: createProduct,
  updateProduct: updateProduct,
  deleteProduct: deleteProduct,
});
```

This method adds the gRPC service, defined in the *product.proto*, to the server. It takes the service definition--e.g., `ProductService`--along with an object which maps the method names from the gRPC service to the method implementations defined above.

### Dynamic vs Static Code Generation

There are two ways of working with Protocol Buffers in Node:

1. *Dynamically*: with dynamic code generation, the Protocol Buffer is loaded and parsed at run time with [Protobuf.js](https://github.com/dcodeIO/ProtoBuf.js/)
1. *Statically*: with the static approach, the Protocol Buffer is pre-processed into JavaScript

We used the dynamic approach above. The dynamic approach is quite a bit simpler to implement, but it differs from the workflow of other gRPC-supported languages, since they require static code generation.

Want to use the static approach?

First, install [grpc-tools](https://github.com/grpc/grpc-node#grpc-tools) globally:

```sh
$ npm install -g grpc-tools
```

Then, run the following from the project root:

```sh
$ protoc -I=. ./protos/product.proto \
  --js_out=import_style=commonjs,binary:./server \
  --grpc_out=./server \
  --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`
```

The generated code should now be in the "server/protos" directory:

1. *product_grpc_pb.js*
1. *product_pb.js*

You'll then import the generated code into your *index.js* file and use them directly rather than loading the service definition.

### Sanity Check

Try running the server at this point:

```sh
$ npm start
```

You should see:

```sh
gRPC server running at http://127.0.0.1:50051
```

Let's wire up the gRPC client before adding the knex query functions.

```
├── client
│   ├── app.js
│   └── package.json
├── protos
│   └── product.proto
└── server
    ├── db
    │   ├── migrations
    │   │   └── 20190131084532_products.js
    │   └── seeds
    │       └── products.js
    ├── index.js
    ├── knexfile.js
    ├── package-lock.json
    └── package.json
```

## Client

Like before, update the *package.json* file the "client" directory:

```json
{
  "name": "node-grpc-client",
  "dependencies": {
    "@grpc/proto-loader": "^0.4.0",
    "body-parser": "^1.18.3",
    "express": "^4.16.4",
    "google-protobuf": "^3.6.1",
    "grpc": "^1.18.0"
  },
  "scripts": {
    "start": "node app.js"
  }
}
```

From the "client" directory, install the dependencies:

```sh
$ npm install
```

Update *app.js*:

```javascript
// requirements
const express = require('express');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/productRoutes');

// express
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes
app.use('/api', productRoutes);

// run server
app.listen(3000, () => {
  console.log('Server listing on port 3000');
});
```

Here, we instantiate a new Express server, define our routes, and then run the server. Add a "routes" folder along with the [Express router](https://expressjs.com/en/api.html#router) in a *product.js* file:

```javascript
// requirements
const express = require('express');
const grpcRoutes = require('./grpcRoutes');

// new router
const router = express.Router();

// routes
router.get('/products', grpcRoutes.listProducts);
router.get('/products/:id', grpcRoutes.readProduct);
router.post('/products', grpcRoutes.createProduct);
router.put('/products/:id', grpcRoutes.updateProduct);
router.delete('/products/:id', grpcRoutes.deleteProduct);

module.exports = router;
```

Finally, add the boilerplate for the gRPC client in *client/routes/grpcRoutes.js*:

```javascript
// requirements
const path = require('path');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');

// gRPC client
const productProtoPath = path.join(__dirname, '..', '..', 'protos', 'product.proto');
const productProtoDefinition = protoLoader.loadSync(productProtoPath);
const productPackageDefinition = grpc.loadPackageDefinition(productProtoDefinition).product;
const client = new productPackageDefinition.ProductService(
  'localhost:50051', grpc.credentials.createInsecure());
/*
Using an older version of gRPC?
(1) You won't need the @grpc/proto-loader package
(2) const productPackageDefinition = grpc.load(productProtoPath).product;
(3) const client = new productPackageDefinition.ProductService(
  'localhost:50051', grpc.credentials.createInsecure());
*/

// handlers
const listProducts = (req, res) => {};
const readProduct = (req, res) => {};
const createProduct = (req, res) => {};
const updateProduct = (req, res) => {};
const deleteProduct = (req, res) => {};

module.exports = {
  listProducts,
  readProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
```

Test it out:

```sh
$ npm start
```

You should see:

```sh
Server listing on port 3000
```

Kill the server before moving on.

```sh
├── client
│   ├── app.js
│   ├── package-lock.json
│   ├── package.json
│   └── routes
│       ├── grpcRoutes.js
│       └── productRoutes.js
├── protos
│   └── product.proto
└── server
    ├── db
    │   ├── migrations
    │   │   └── 20190131084532_products.js
    │   └── seeds
    │       └── products.js
    ├── index.js
    ├── knexfile.js
    ├── package-lock.json
    └── package.json
```

With that, we're now ready to tie everything together.

## CRUD

We'll use the following workflow for wiring up the gRPC stubs:

1. Add the appropriate knex query to the server (*server/index.js*)
1. Add the associated handler to the client (*client/routes/grpcRoutes.js*)
1. Test it via cURL

### listProducts

Server:

```javascript
function listProducts(call, callback) {
  /*
  Using 'grpc.load'? Send back an array: 'callback(null, { data });'
  */
  knex('products')
    .then((data) => { callback(null, { products: data }); });
}
```

Client:

```javascript
const listProducts = (req, res) => {
  /*
  gRPC method for reference:
  listProducts(Empty) returns (ProductList)
  */
  client.listProducts({}, (err, result) => {
    res.json(result);
  });
};
```

To test, run the client in one terminal window and the server in another. Then, run the following command:

```sh
$ curl http://127.0.0.1:3000/api/products
```

You should see the products:

```json
{
  "products": [
    {
      "id": 1,
      "name": "pencil",
      "price": "1.99"
    },
    {
      "id": 2,
      "name": "pen",
      "price": "2.99"
    }
  ]
}
```

### readProduct

Server:

```javascript
function readProduct(call, callback) {
  knex('products')
    .where({ id: parseInt(call.request.id) })
    .then((data) => {
      if (data.length) {
        callback(null, data[0]);
      } else {
        callback('That product does not exist');
      }
    });
}
```

Client:

```javascript
const readProduct = (req, res) => {
  const payload = { id: parseInt(req.params.id) };
  /*
  gRPC method for reference:
  readProduct(ProductId) returns (Product)
  */
  client.readProduct(payload, (err, result) => {
    if (err) {
      res.json('That product does not exist.');
    } else {
      res.json(result);
    }
  });
};
```

Test success:

```sh
$ curl http://127.0.0.1:3000/api/products/1

{
  "id": 1,
  "name": "pencil",
  "price": "1.99"
}
```

Test failure:

```sh
$ curl http://127.0.0.1:3000/api/products/99999

"That product does not exist."
```

### createProduct

Server:

```javascript
function createProduct(call, callback) {
  knex('products')
    .insert({
      name: call.request.name,
      price: call.request.price,
    })
    .then(() => { callback(null, { status: 'success' }); });
}
```

Client:

```javascript
const createProduct = (req, res) => {
  const payload = { name: req.body.name, price: req.body.price };
  /*
  gRPC method for reference:
  createProduct(newProduct) returns (result)
  */
  client.createProduct(payload, (err, result) => {
    res.json(result);
  });
};
```

Test:

```sh
$ curl -X POST -d '{"name":"lamp","price":"29.99"}' \
    -H "Content-Type: application/json" http://127.0.0.1:3000/api/products
{
  "status": "success"
}

$ curl http://127.0.0.1:3000/api/products
{
  "products": [
    {
      "id": 1,
      "name": "pencil",
      "price": "1.99"
    },
    {
      "id": 2,
      "name": "pen",
      "price": "2.99"
    },
    {
      "id": 3,
      "name": "lamp",
      "price": "29.99"
    }
  ]
}
```

### updateProduct

Server:

```javascript
function updateProduct(call, callback) {
  knex('products')
    .where({ id: parseInt(call.request.id) })
    .update({
      name: call.request.name,
      price: call.request.price,
    })
    .returning()
    .then((data) => {
      if (data) {
        callback(null, { status: 'success' });
      } else {
        callback('That product does not exist');
      }
    });
}
```

Client:

```javascript
const updateProduct = (req, res) => {
  const payload = { id: parseInt(req.params.id), name: req.body.name, price: req.body.price };
  /*
  gRPC method for reference:
  updateProduct(Product) returns (result)
  */
  client.updateProduct(payload, (err, result) => {
    if (err) {
      res.json('That product does not exist.');
    } else {
      res.json(result);
    }
  });
};
```

Test:

```sh
$ curl -X PUT -d '{"name":"lamp","price":"49.99"}' \
    -H "Content-Type: application/json" http://127.0.0.1:3000/api/products/3

{
  "status": "success"
}


$ curl http://127.0.0.1:3000/api/products/3
{
  "id": 3,
  "name": "lamp",
  "price": "49.99"
}
```

### deleteProduct

Server:

```javascript
function deleteProduct(call, callback) {
  knex('products')
    .where({ id: parseInt(call.request.id) })
    .delete()
    .returning()
    .then((data) => {
      if (data) {
        callback(null, { status: 'success' });
      } else {
        callback('That product does not exist');
      }
    });
}
```

Client:

```javascript
const deleteProduct = (req, res) => {
  const payload = { id: parseInt(req.params.id) };
  /*
  gRPC method for reference:
  deleteProduct(ProductId) returns (result)
  */
  client.deleteProduct(payload, (err, result) => {
    if (err) {
      res.json('That product does not exist.');
    } else {
      res.json(result);
    }
  });
};
```

Test:

```sh
$ curl -X DELETE http://127.0.0.1:3000/api/products/3

{
  "status": "success"
}


$ curl http://127.0.0.1:3000/api/products

{
  "products": [
    {
      "id": 1,
      "name": "pencil",
      "price": "1.99"
    },
    {
      "id": 2,
      "name": "pen",
      "price": "2.99"
    }
  ]
}
```

What if the product doesn't exist?

```sh
$ curl -X DELETE http://127.0.0.1:3000/api/products/9999

"That product does not exist."
```

## Conclusion

gRPC provides a declarative, strongly typed mechanism for defining an API.

Workflow:

1. Define the API (service definition and message structure) using a Protocol Buffer
1. Implement the server using the generated interface
1. Add the message stubs to the client

Resources:

1. [Final code](https://github.com/mjhea0/node-grpc-crud)
1. [What is gRPC?](https://grpc.io/docs/guides/index.html) guide
1. [Building scalable microservices with gRPC](https://blog.bugsnag.com/grpc-and-microservices-architecture/)
1. [gRPC for Web Clients](https://github.com/grpc/grpc-web)
