---
layout: post
title: "Flask for Node Developers"
date: 2017-04-26 08:46:05
comments: true
toc: true
categories: [node, python]
keywords: "python, flask, RESTful API, CRUD"
description: "Let's build a RESTful API with Python and Flask."
redirect_from:
  - /blog/2017/04/26/flask-for-node-developers/
---

Today we'll be going through how to build a basic CRUD server-side application using Python and [Flask](http://flask.pocoo.org/), geared toward JavaScript developers versed in Node and Express. Similar to [Express](https://expressjs.com/), [Flask](http://flask.pocoo.org/) is a simple, yet powerful micro-framework for Python, perfect for RESTful APIs.

<div style="text-align:center;">
  <img src="/assets/img/blog/flask-node.png" style="max-width: 100%; border:0; box-shadow: none;" alt="flask and node">
</div>

<br>

> This tutorial uses Flask v[0.12.1](https://pypi.python.org/pypi/Flask/0.12.1) and Python v[3.6.1](https://www.python.org/downloads/release/python-361/).

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Objectives

By the end of this tutorial, you should be able to...

1. Set up a Python development environment
1. Create and activate a virtual environment
1. Using SQLite, apply a schema to the database and interact with the database using the basic CRUD functions
1. Build a CRUD app using Python and Flask

## Project Setup

Before we start, ensure that you have [Python v3.6.1](https://www.python.org/downloads/release/python-361/) installed.

Along with Python, we also need [pip](https://pypi.python.org/pypi/pip) to install third-party packages from the [Python Package Index](https://pypi.org/) (aka PyPI), the Python equivalent of npm. Fortunately, this comes pre-installed with all Python versions >= 3.4.

Let's start by creating a new project directory:

```sh
$ mkdir flask-songs-api && cd flask-songs-api
```

Next up, we'll create an isolated virtual environment for installing Python packages specific to our individual project. It's [standard practice](https://www.python.org/dev/peps/pep-0405/#isolation-from-system-site-packages) to set up a virtual environment for each project, otherwise there can be compatibility issues with different dependencies.

```sh
$ python3.6 -m venv env
```

Next, we need to activate it:

```sh
$ source env/bin/activate
```

You should now see `env` in your prompt, indicating that the virtual environment is activated.

> **NOTE:** Ready to stop developing? Use the `deactivate` command to deactivate the virtual environment. To activate it again, navigate to the directory and re-run the source command - `source env/bin/activate`.

Now we can install Flask:

```sh
$ pip install Flask==0.12.1
$ pip freeze > requirements.txt
```

Now is a great time to add a *.gitignore*:

```
env
*.db
```

Finally, let's add a main app file, which will handle routing and run our application, along with a file to setup our database schema:

```sh
$ touch app.py models.py
```

## Database Setup

For this tutorial, we will be using [SQLite3](https://www.sqlite.org/) since it's part of the [Python standard library](https://docs.python.org/3.5/library/sqlite3.html), requires little (if any) configuration, and is powerful enough for small to mid-size applications (e.g., the majority of web apps).

Start by creating a new database file in your project root:

```sh
$ touch songs.db
```

Now start a new SQLite session:

```sh
$ sqlite3 songs.db
```

Then run:

```sh
sqlite> .databases
```

You should see a file path to your database file, which is empty at the moment and ready for us to create a schema and data to. To create a schema, add the following code to *models.py*:

```python
import sqlite3


def drop_table():
    with sqlite3.connect('songs.db') as connection:
        c = connection.cursor()
        c.execute("""DROP TABLE IF EXISTS songs;""")
    return True


def create_db():
    with sqlite3.connect('songs.db') as connection:
        c = connection.cursor()
        table = """CREATE TABLE songs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artist TEXT NOT NULL,
            title TEXT NOT NULL,
            rating INTEGER NOT NULL
        );
        """
        c.execute(table)
    return True


if __name__ == '__main__':
    drop_table()
    create_db()
```

This will drop the songs table if it exists and put a new one in place with the schema we've defined here. If you have any issues with your database later on, or if you just want to start fresh, you can always run this script to recreate the database. Back in the terminal, exit SQLite and then run the script to create our table:

```sh
sqlite> .exit
$ python models.py
```

Let's check if that actually worked:

```sh
$ sqlite3 songs.db
sqlite> .table
songs
sqlite> .schema
CREATE TABLE songs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artist TEXT NOT NULL,
            title TEXT NOT NULL,
            rating INTEGER NOT NULL
        );
sqlite> .exit
```

Great! So, now that our database is set up correctly, we can move on to setting up our app's route handlers. For this post, we won't be going into database migrations but if you ever want to change the schema, you can use [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/).

## Routes

Let's start with an overview of the routes, following RESTful principles:

| Endpoint              | Result                | CRUD   | HTTP   |
|-----------------------|-----------------------|--------|--------|
| `/api/songs`          | Returns all songs     | Read   | GET    |
| `/api/song/<song_id>` | Returns a single song | Read   | GET    |
| `/api/songs`          | Adds a single song    | Create | POST   |
| `/api/song/<song_id>` | Updates a single song | Update | PUT    |
| `/api/song/<song_id>` | Deletes a single song | Delete | DELETE |

But first, before creating any routes, add the following code to *app.py*:

```python
import sqlite3
from flask import Flask


app = Flask(__name__)


if __name__ == '__main__':
    app.debug = True
    app.run()
```

Here we imported `sqlite3` along with the main [Flask application object](http://flask.pocoo.org/docs/0.12/api/#application-object), `Flask`, which creates an instance of Flask in our application. The Flask application object acts as the central object, which we can use as a way of calling our view functions, adding our URL rules, template configuration and much more. With that instance we can run the application using the `run` [method](http://flask.pocoo.org/docs/0.12/api/#flask.Flask.run). We also set the [debug flag](http://flask.pocoo.org/docs/0.12/api/#flask.Flask.debug) to `True` so that the server live reloads when code changes and provides an interactive debugger when an exception is thrown.

> **NOTE:** `if __name__ == '__main__'` states that this source file is our main program. Any files imported from other modules will have their name set to their module name. This is because you may sometimes have modules that could be executed directly as well as be imported into a main app file. This line means that the code in those modules will only execute when you want to run the module as a program, and not have it execute when someone just wants to import a module and execute it themselves.

Finally, it's important to note that any imports must go at the top of our *app.py* file. These must come before anything else in order to be used later on in our file.

Now, add the routes:

```python
import sqlite3
from flask import Flask, request


app = Flask(__name__)


@app.route('/api/songs', methods=['GET', 'POST'])
def collection():
    if request.method == 'GET':
        pass  # Handle GET all Request
    elif request.method == 'POST':
        pass  # Handle POST request


@app.route('/api/song/<song_id>', methods=['GET', 'PUT', 'DELETE'])
def resource(song_id):
    if request.method == 'GET':
        pass  # Handle GET single request
    elif request.method == 'PUT':
        pass  # Handle UPDATE request
    elif request.method == 'DELETE':
        pass  # Handle DELETE request


if __name__ == '__main__':
    app.debug = True
    app.run()
```

We imported `request`, which handles, well, HTTP requests (no surprises there). Let's look at each method, staring with a POST:

### POST

The first thing we need to do is add data to our database. Once we've done this, we can start building and testing the rest of our database/CRUD functions.

The process is simple:

1. Create a connection to our database
1. Execute our SQL query to add a song
1. Commit the changes to the database
1. Close the database connection
1. Return an object

We can write a single function to handle this. Let's place all helper functions underneath the routes, to keep things nicely separated:

```python
# helper functions

def add_song(artist, title, rating):
    try:
        with sqlite3.connect('songs.db') as connection:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO songs (artist, title, rating) values (?, ?, ?);
                """, (artist, title, rating,))
            result = {'status': 1, 'message': 'Song Added'}
    except:
        result = {'status': 0, 'message': 'error'}
    return result
```

Now we can just use this function in our route handler, passing the correct arguments from an incoming POST request:

```python
@app.route('/api/songs', methods=['GET', 'POST'])
def collection():
    if request.method == 'GET':
        pass  # Handle GET all Request
    elif request.method == 'POST':
        data = request.form
        result = add_song(data['artist'], data['title'], data['rating'])
        return jsonify(result)
```

So, we grabbed the values from the incoming form request, then called the `add_song()` function to add that song to the database, and, finally, returned the appropriate JSON response.

Make sure to add `jsonify` to the imports in order to send a JSON response back:

```python
from flask import Flask, request, jsonify
```

Ready to test? Start the server in one terminal window:

```sh
$ python app.py
```

Now, in another window use CURL to send a POST request:

```sh
$ curl --data "artist='Hudson Mohawke'&title='Cbat'&rating=5" http://localhost:5000/api/songs
```

If all went well, you should see the following response, indicating that the song was added to the database:

```sh
{
  "message": "Song Added",
  "status": 1
}
```

Just to be on the safe side, let's double-check that. Kill the server, then open a SQLite session from within your project directory:

```sh
$ sqlite3 songs.db
```

Now run the following SQL query:

```sh
sqlite> SELECT * FROM songs ORDER BY id desc;
```

You should see:

```
1|'Hudson Mohawke'|'Cbat'|5`
```

Okay. We have officially added our first song! Add a couple more before moving on to reading data (GET). Don't forget to run the Flask server before running the CURL commands!

```sh
$ curl --data "artist='Beastie Boys'&title='Sabotage'&rating=4" http://localhost:5000/api/songs
$ curl --data "artist='Gregori Klosman'&title='Jaws'&rating=3" http://localhost:5000/api/songs
```

### GET

We'll start with our GET all route, e.g. - `api/songs`. We need to connect to the database, execute the appropriate SQL query, and then return all of the songs from that query:

```python
def get_all_songs():
    with sqlite3.connect('songs.db') as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM songs ORDER BY id desc")
        all_songs = cursor.fetchall()
        return all_songs
```

Next up, we have to change our route handler to now call this function and then send back JSON:

```python
@app.route('/api/songs', methods=['GET', 'POST'])
def collection():
    if request.method == 'GET':
        all_songs = get_all_songs()
        return json.dumps(all_songs)
    elif request.method == 'POST':
        data = request.form
        result = add_song(data['artist'], data['title'], data['rating'])
        return jsonify(result)
```

Did you notice that we're using the `json` module? This is also from the Python standard library, which allows us to convert the 'list'-like format of data we get back from SQLite3 into a JSON object. Just don't forget to import it:

```python
import json
```

To test, we can simply navigate to [http://127.0.0.1:5000/api/songs](http://127.0.0.1:5000/api/songs) in the browser to check if all our songs are there.

You should see something like:

```json
[
  [
    3,
    "'Gregori Klosman'",
    "'Jaws'",
    3
  ],
  [
    2,
    "'Beastie Boys'",
    "'Sabotage'",
    4
  ],
  [
    1,
    "'Hudson Mohawke'",
    "'Cbat'",
    5
  ]
]
```

Now that we can GET all songs, let's build a function to GET just a single song. This function will take a parameter of `song_id`, create a connection to our database, find that song with a SQL query, and then return that song with JSON:

```python
def get_single_song(song_id):
    with sqlite3.connect('songs.db') as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM songs WHERE id = ?", (song_id,))
        song = cursor.fetchone()
        return song
```

We can update our route with a `song_id` as a parameter, and send back the single song:

```py
@app.route('/api/song/<song_id>', methods=['GET', 'PUT', 'DELETE'])
def resource(song_id):
    if request.method == 'GET':
        song = get_single_song(song_id)
        return json.dumps(song)
    elif request.method == 'PUT':
        pass  # Handle UPDATE request
    elif request.method == 'DELETE':
        pass  # Handle DELETE request
```

If you now point your browser to [http://127.0.0.1:5000/api/song/2](http://127.0.0.1:5000/api/song/2) you should see the JSON object for our song with an id of `2` in the database:

```json
[
    2,
    "'Beastie Boys'",
    "'Sabotage'",
    4
]
```

If you try to put in an id that we don't have in the database currently, you will just get `null` displayed on the page instead of a JSON object.

We can CREATE a song, READ all songs, and READ a single song. Only two more routes to go...

### PUT

A major function that we're missing is the ability to edit data that's already present in our database. We do this using a PUT request by taking incoming data with an id passed through the URL, finding the object in our database with that particular id, and then updating it.

Let's start with an edit function, which takes in the song id, artist, title, and rating as arguments:

```python
def edit_song(song_id, artist, title, rating):
    try:
        with sqlite3.connect('songs.db') as connection:
            connection.execute("UPDATE songs SET artist = ?, title = ?, rating = ? WHERE ID = ?;", (artist, title, rating, song_id,))
            result = {'status': 1, 'message': 'SONG Edited'}
    except:
        result = {'status': 0, 'message': 'Error'}
    return result
```

Now we can edit our route to pass in the data from the PUT request:

```py
@app.route('/api/song/<song_id>', methods=['GET', 'PUT', 'DELETE'])
def resource(song_id):
    if request.method == 'GET':
        song = get_single_song(song_id)
        return json.dumps(song)
    elif request.method == 'PUT':
        data = request.form
        result = edit_song(
            song_id, data['artist'], data['title'], data['rating'])
        return jsonify(result)
    elif request.method == 'DELETE':
        pass  # Handle DELETE request
```

So if we test this route out with CURL:

```sh
$ curl -X PUT --data "artist='Van Halen'&title='Hot for Teacher'&rating=3" localhost:5000/api/song/2
```

We should see:

```sh
{
  "message": "SONG Edited",
  "status": 1
}
```

We can (err, should) make sure that edit is reflected in the database:

```sh
$ sqlite3 songs.db
sqlite> SELECT * FROM songs ORDER BY id desc;

3|'Gregori Klosman'|'Jaws'|3
2|'Van Halen'|'Hot for Teacher'|3
1|'Hudson Mohawke'|'Cbat'|5
```

We can edit songs at will!

### Delete

The last thing we have left to do is our DELETE route. We need to be able to remove data from our database. Let's first add in a song we can then delete using CURL in the terminal:

```sh
$ curl --data "artist='The Flaming Lips'&title='Buggin'&rating=2" http://localhost:5000/api/songs
```

Make sure it's in our database:

```sh
$ sqlite3 songs.db
sqlite> SELECT * FROM songs ORDER BY id desc;

4|'The Flaming Lips'|'Buggin'|2
3|'Gregori Klosman'|'Jaws'|3
2|'Van Halen'|'Hot for Teacher'|3
1|'Hudson Mohawke'|'Cbat'|5
```

We need to build a delete function:

```python
def delete_song(song_id):
    try:
        with sqlite3.connect('songs.db') as connection:
            connection.execute("DELETE FROM songs WHERE ID = ?;", (song_id,))
            result = {'status': 1, 'message': 'SONG Deleted'}
    except:
        result = {'status': 0, 'message': 'Error'}
    return result
```

And now let's add in our delete route:

```py
@app.route('/api/song/<song_id>', methods=['GET', 'PUT', 'DELETE'])
def resource(song_id):
    if request.method == 'GET':
        song = get_single_song(song_id)
        return json.dumps(song)
    elif request.method == 'PUT':
        data = request.form
        result = edit_song(
            song_id, data['artist'], data['title'], data['rating'])
        return jsonify(result)
    elif request.method == 'DELETE':
        result = delete_song(song_id)
        return jsonify(result)
```

Test it with CURL:

```sh
$ curl -X DELETE localhost:5000/api/song/4

{
  "message": "SONG Deleted",
  "status": 1
}
```

And finally, go back into our database and really make sure it's gone:

```sh
$ sqlite3 songs.db
sqlite> SELECT * FROM songs ORDER BY id desc;

3|'Gregori Klosman'|'Jaws'|3
2|'Van Halen'|'Hot for Teacher'|3
1|'Hudson Mohawke'|'Cbat'|5
```

Boom! So we now have all of our routes doing *exactly* what we want them to do. We can add songs, get the songs back (all, or just a single song), edit a song, and remove a song. That's some quality CRUD right there.

## Next Steps

1. *Error Handling*: The code we have right now is completely reliant on the data coming through correctly, but what if there's something missing when the user sends a POST request? For example, what would happen if the artist name was missing? Right now we aren't handling errors that may come up. Think about how we can send information back to the user if not all fields are present in the POST or PUT request, and how you could be clear in the error messages we send back to the user.
1. *Server-side Templating*: Build out your client-side by adding [static files](http://flask.pocoo.org/docs/0.12/quickstart/#static-files) and [templates](http://flask.pocoo.org/docs/0.12/quickstart/#rendering-templates).
1. *Database Management:* Refactor SQLite and vanilla SQL out of your application and add in Postgres, [Flask-SQLAlchemy](http://flask-sqlalchemy.pocoo.org/2.1/) (for communicating with the database), and [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) (for migrations). Check out [this example](https://github.com/mjhea0/flask-songs-api/tree/master/_live) of how to use Postgres and Flask-SQLAlchemy.

Grab the code from the [flask-songs-api](https://github.com/mjhea0/flask-songs-api) repo. Cheers!
