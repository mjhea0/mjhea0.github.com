---
layout: post
toc: true
title: "Node, Postgres, and Sequelize"
date: 2015-10-22 10:52
comments: true
categories: node
keywords: "node, express, sequelize, postgres, migrations"
description: "This article details how to build a basic CRUD app with Node, Express, Sequelize, and PostgreSQL."
---

**Let's build a CRUD app with Node (v4.1.1), Express (v4.13.1), Sequelize (v3.12.2), and PostgreSQL (9.4.4).**

<div style="text-align:center;">
  <img src="/images/node-sequelize.png" style="max-width: 100%; border:0;" alt="node sequelize">
</div>

**Updates**:
  - *November 1st, 2015* - Added Database Migrations

> This a follow-up to [PostgreSQL and NodeJS](http://mherman.org/blog/2015/02/12/postgresql-and-nodejs/#.ViVUDxNViko).

## Getting Started

Grab the initial boilerplate and install the dependencies:

```sh
$ git clone git@github.com:mjhea0/node-postgres-sequelize.git
$ git checkout tags/v1
$ npm install
```

Now run a quick sanity check:

```sh
$ gulp
```

If all went well, a new browser window should have opened to [http://localhost:5000/](http://localhost:5000/) and you should see the "Welcome to Express." text.

## Sequelize

With Postgres listening on port 5432, we can make a connection to it using the [Sequelize](http://docs.sequelizejs.com/en/latest/) library, *an Object Relational Mapper (ORM), written in JavaScript, which supports MySQL, PostgreSQL, SQLite, and MariaDB*.

> Need to set up Postgres? On a Mac? Check out [Postgres.app](http://postgresapp.com/).

Install Sequelize, [pg](https://www.npmjs.com/package/pg) (for making the database connection), and [pg-hstore](https://www.npmjs.com/package/pg-hstore) (for serializing and deserializing JSON into the [Postgres hstore key/value pair format](http://www.postgresql.org/docs/9.0/static/hstore.html)):

```sh
$ npm install sequelize@3.12.2 pg@4.4.3 pg-hstore@2.3.2 --save
```

## Migrations

The [Sequelize CLI](https://github.com/sequelize/cli) is used to bootstrap a new project and handle [database migrations](https://en.wikipedia.org/wiki/Schema_migration) directly from the terminal.

> Read more about the Sequelize CLI from the official [documentation](http://docs.sequelizejs.com/en/latest/docs/migrations/).

### Init

Start by installing the package:

```sh
$ npm install sequelize-cli@2.1.0 --save
```

Next, create a config file called *.sequelizerc* in your project root to specify the paths to specific files required by Sequelize:

```javascript
var path = require('path');

module.exports = {
  'config': path.resolve('./server', 'config.json'),
  'migrations-path': path.resolve('./server', 'migrations'),
  'models-path': path.resolve('./server', 'models'),
  'seeders-path': path.resolve('./server', 'seeders')
}
```

Now, run the init command to create the files (*config.json*) and folders ("migrations", "models", and "seeders"):

```sh
$ node_modules/.bin/sequelize init
```

Take a look at the *index.js* file within the "models" directory:

```javascript
'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config.json')[env];
var db        = {};

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename);
  })
  .forEach(function(file) {
    if (file.slice(-3) !== '.js') return;
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

Here, we establish a connection to the database, grab all the model files from the current directory, add them to the `db` object, and apply any relations between each model (if any).

### Config

Be sure to also update the *config.js* file for your development, test, and production databases:

```javascript
{
  "development": {
    "username": "update me",
    "password": "update me",
    "database": "todos",
    "host": "127.0.0.1",
    "port": "5432",
    "dialect": "postgres"
  },
  "test": {
    "username": "update me",
    "password": "update me",
    "database": "update_me",
    "host": "update me",
    "dialect": "update me"
  },
  "production": {
    "username": "update me",
    "password": "update me",
    "database": "update me",
    "host": "update me",
    "dialect": "update me"
  }
}
```

> If you are just running this locally, using the basic development server, then just update the `development` config.

Go ahead and create a database named "todos".

### Create Migration

Now let's create a model along with a migration. Since we're working with todos, run the following command:

```sh
$ node_modules/.bin/sequelize model:create --name Todo --attributes "title:string, complete:boolean,UserId:integer"
```

Take a look a the newly created model file, *todo.js* in the models directory:

```javascript
'use strict';
module.exports = function(sequelize, DataTypes) {
  var Todo = sequelize.define('Todo', {
    title: DataTypes.STRING,
    complete: DataTypes.BOOLEAN
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Todo;
};
```

The corresponding migration file can be found in the "migrations" folder. Take a look. Next, let's associate a user to a todo. First, we need to define a new migration:

```sh
$ node_modules/.bin/sequelize model:create --name User --attributes "email:string"
```

Now we need to set up the relationship between the two models...

### Associations

To associate the models (one user can have many todos), make the following updates...

**todo.js**:

```javascript
'use strict';
module.exports = function(sequelize, DataTypes) {
  var Todo = sequelize.define('Todo', {
    title: DataTypes.STRING,
    complete: DataTypes.BOOLEAN
  }, {
    classMethods: {
      associate: function(models) {
        Todo.belongsTo(models.User);
      }
    }
  });
  return Todo;
};
```

**user.js**:

```javascript
'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    email: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Todo);
      }
    }
  });
  return User;
};
```

### Sync

Finally, before we sync, let's add an additional attribute to the `complete` filed in the *todo.js* file:

```javascript
'use strict';
module.exports = function(sequelize, DataTypes) {
  var Todo = sequelize.define('Todo', {
    title: DataTypes.STRING,
    complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    classMethods: {
      associate: function(models) {
        Todo.belongsTo(models.User);
      }
    }
  });
  return Todo;
};
```

Run the migration to create the tables:

```sh
$ node_modules/.bin/sequelize db:migrate

Sequelize [Node: 4.1.1, CLI: 2.1.0, ORM: 3.12.2]

Loaded configuration file "server/config.json".
Using environment "development".
Using gulpfile ~/node_modules/sequelize-cli/lib/gulpfile.js
Starting 'db:migrate'...
== 20151101052127-create-todo: migrating =======
== 20151101052127-create-todo: migrated (0.049s)

== 20151101052148-create-user: migrating =======
== 20151101052148-create-user: migrated (0.042s)

```

## CRUD

With Sequelize set up and the models defined, we can now set up our RESTful routing structure for the todo resource. First, within *index.js* in the "routes" folder add the following requirement:

```javascript
var models = require('../models/index');
```

Then add a route for creating a new user:

```javascript
router.post('/users', function(req, res) {
  models.User.create({
    email: req.body.email
  }).then(function(user) {
    res.json(user);
  });
});
```

To add a new user, run the server - `gulp` - and then run the following in a new terminal window:

```sh
$ curl --data "email=michael@mherman.org" http://127.0.0.1:3000/users
```

You should see:

```json
{
  "id":1,
  "email":"michael@mherman.org",
  "updatedAt":"2015-11-01T12:24:20.375Z",
  "createdAt":"2015-11-01T12:24:20.375Z"
}
```

Now we can add the todo routes...

### GET all todos

```javascript
// get all todos
router.get('/todos', function(req, res) {
  models.Todo.findAll({}).then(function(todos) {
    res.json(todos);
  });
});
```

When you hit that route you should see an empty array since we have not added any todos. Let's do that now.

### POST

```javascript
// add new todo
router.post('/todos', function(req, res) {
  models.Todo.create({
    title: req.body.title,
    UserId: req.body.user_id
  }).then(function(todo) {
    res.json(todo);
  });
});
```

Now let's test:

```sh
$ curl --data "title=test&user_id=1" http://127.0.0.1:3000/todos
$ curl --data "title=test2&user_id=1" http://127.0.0.1:3000/todos
```

Then if you go back and hit [http://127.0.0.1:3000/todos](http://127.0.0.1:3000/todos) in our browser, you should see:

```json
[
  {
    id: 1,
    title: "test",
    complete: false,
    createdAt: "2015-11-01T12:31:56.451Z",
    updatedAt: "2015-11-01T12:31:56.451Z",
    UserId: 1
  },
  {
    id: 2,
    title: "test2",
    complete: false,
    createdAt: "2015-11-01T12:32:09.000Z",
    updatedAt: "2015-11-01T12:32:09.000Z",
    UserId: 1
  }
]
```

### GET single todo

How about getting a single todo?

```javascript
// get single todo
router.get('/todo/:id', function(req, res) {
  models.Todo.find({
    where: {
      id: req.params.id
    }
  }).then(function(todo) {
    res.json(todo);
  });
});
```

Navigate to [http://localhost:3000/todo/1](http://localhost:3000/todo/1) in your browser. You should the single todo.

### PUT

Need to update a todo?

```javascript
// update single todo
router.put('/todo/:id', function(req, res) {
  models.Todo.find({
    where: {
      id: req.params.id
    }
  }).then(function(todo) {
    if(todo){
      todo.updateAttributes({
        title: req.body.title,
        complete: req.body.complete
      }).then(function(todo) {
        res.send(todo);
      });
    }
  });
});
```

And now for a test, of course:

```sh
$ curl -X PUT --data "complete=true" http://127.0.0.1:3000/todo/2
```

### DELETE

Want to delete a todo?

```javascript
// delete a single todo
router.delete('/todo/:id', function(req, res) {
  models.Todo.destroy({
    where: {
      id: req.params.id
    }
  }).then(function(todo) {
    res.json(todo);
  });
});
```

Test:

```sh
$ curl -X DELETE http://127.0.0.1:3000/todo/1
```

Again, navigate to [http://localhost:3000/todos](http://localhost:3000/todos) in your browser. You should now only see one todo.

## Conclusion

That's it for the basic server-side code. You now have a database, models, and migrations set up. Whenever you want to update the state of your database, just add additional migrations and then run them as necessary.

Grab the code from the [Github repo](https://github.com/mjhea0/node-postgres-sequelize). Comment below with questions. Cheers!
