---
layout: post
toc: true
title: "Primer on Swig Templating"
date: 2015-08-23 14:10
comments: true
toc: true
categories: node
keywords: "swig, template engine web development, node, nodejs"
description: "Here we look at the basics of using Swig, a template engine for Node."
---

Let's look at the basics of [Swig](http://node-swig.github.io/swig-templates/), "a simple, powerful, and extendable JavaScript Template Engine" for NodeJS.

<hr>

First off, a templating engine creates web pages (or views) dynamically by combining variables and programming logic with HTML. Essentially, you can add placeholders (or tags) to your HTML that are replaced by *actual* code defined from your router or controller. In general, tags, for the majority of templating engines, fall within one of two categories-

{% raw %}
1. *Variables/Output Tags* - surrounded by double curly brackets `{{ ... }}`, these output the results of a logic tag or a variable to the end user
1. *Logic Tags* - surrounded by `{% ... %}`, these handle programming logic, like loops and conditionals
{% endraw %}

> Before diving in, grab the basic project structure from [Github](https://github.com/mjhea0/swig-primer/releases/tag/v1), install the dependencies via NPM - `npm install` - and then run the server. Pay attention to where we initialize Swig and set it as the templating language in *app.js*:
    ```
    var swig = new swig.Swig();
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    ```

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Output Tags

Let's start with some basic examples...

### Basics

First, we can pass variables from our route handlers/view functions directly to the templates.

Update the *index.html* file:

{% raw %}
``` html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{title}}</h1>
</body>
</html>
```
{% endraw %}

Now, we can pass in a variable called `title` to the template from *app.js*:

``` javascript
// *** main routes *** //
app.get('/', function(req, res) {
  res.render('index.html', {title: 'Swig Primer!'});
});
```

Fire up the server and test this out. Nice. **Try adding another variable to the template.**

*index.html*:

{% raw %}
``` html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{title}}</h1>
  <p>{{description}}</p>
</body>
</html>
```
{% endraw %}

*app.js*:

``` javascript
app.get('/', function(req, res) {
  var title = 'Swig Primer!'
  var description = 'Swig is "a simple, powerful, and extendable JavaScript Template Engine" for NodeJS.'
  res.render('index.html', {title: title, description: description});
});
```

Keep in mind that all variable outputs are [automatically escaped](http://node-swig.github.io/swig-templates/docs/api/#SwigOpts) except for function outputs:

``` javascript
// *** main routes *** //
app.get('/', function(req, res) {
  var title = 'Swig Primer!'
  var description = 'Swig is "a simple, powerful, and extendable JavaScript Template Engine" for NodeJS.'
  function allthethings() {
    return '<span>All the things!</span>';
  }
  res.render('index.html', {
    title: title,
    description: description,
    allthethings: allthethings
  });
});
```

{% raw %}
Don't forget to call the function in the template - `<p>{{allthethings()}}</p>`
{% endraw %}

> Please see the official [documentation](http://node-swig.github.io/swig-templates/docs/#variables) for more info on output tags.

### Filters

Filters, which are just simple methods, can be used to modify the output value. To illustrate some examples, add another route handler to *app.js*, like so:

``` javascript
app.get('/filter', function(req, res) {
  res.render('filter.html', {
    title: 'Hello, World!',
    date: new Date(),
    nameArray: ['This', 'is', 'just', 'an', 'example']
  });
});
```

Now just add a new template, *filter.html*, adding in a number of filters:

{% raw %}
``` html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{title | upper}}</h1>
  <p>{{date | date("Y-m-d")}}</p>
  <p>{{nameArray | join(' ')}}</p>
</body>
</html>
```
{% endraw %}

> Check out all the available [filters](http://node-swig.github.io/swig-templates/docs/filters/). You can also extend the functionality of Swig by adding your own [custom filters](http://node-swig.github.io/swig-templates/docs/extending/)!

## Logic Tags

As the name suggests, [logic tags](http://node-swig.github.io/swig-templates/docs/tags/) let you use, well, logic in your templates.

### IF statements

Here's a simple example...

*app.js*:

``` javascript
app.get('/logic', function(req, res) {
  var title = 'Swig Logic!'
  res.render('logic.html', {title: title});
});
```

*logic.html*:

``` html
{% raw %}
<!DOCTYPE html>
<html>
<head>
  <title>{% if title %}{{title}}{% endif %}</title>
</head>
<body>
  {% if title %}
    <h1>{{title}}</h1>
  {% endif %}
</body>
</html>
{% endraw %}
```

**Test out some more examples of [if](http://node-swig.github.io/swig-templates/docs/tags/#if), [elif](http://node-swig.github.io/swig-templates/docs/tags/#elif), and [else](http://node-swig.github.io/swig-templates/docs/tags/#else).**

### Loops

**How about a for loop?**

*app.js*:

``` javascript
app.get('/logic', function(req, res) {
  var title = 'Swig Logic!'
  var numberArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  res.render('logic.html', {title: title, numberArray: numberArray});
});
```

*logic.html*:

{% raw %}
``` html
<!DOCTYPE html>
<html>
<head>
  <title>{% if title %}{{title}}{% endif %}</title>
</head>
<body>
  {% if title %}
    <h1>{{title}}</h1>
  {% endif %}
  <ul>
    {% for num in numberArray %}
      <li>{{ num }}</li>
    {% endfor %}
  </ul>
</body>
</html>
```
{% endraw %}

**Need to reverse the loop?**

Simply add a filter:

{% raw %}
``` html
<!DOCTYPE html>
<html>
<head>
  <title>{% if title %}{{title}}{% endif %}</title>
</head>
<body>
  {% if title %}
    <h1>{{title}}</h1>
  {% endif %}
  <ul>
    {% for num in numberArray | reverse %}
      <li>{{ num }}</li>
    {% endfor %}
  </ul>
</body>
</html>
```
{% endraw %}

**What would a basic loop and filter look like?**

{% raw %}
``` html
<!DOCTYPE html>
<html>
<head>
  <title>{% if title %}{{title}}{% endif %}</title>
</head>
<body>
  {% if title %}
    <h1>{{title}}</h1>
  {% endif %}
  <ul>
    {% for num in numberArray %}
      {% if num % 2 === 0 %}
        <li>{{ num }}</li>
      {% endif %}
    {% endfor %}
  </ul>
</body>
</html>
```
{% endraw %}

> You could also write a custom filter for this if you needed to do the *same* filtering logic a number of times throughout your application.

There's also a number of [helper methods](http://node-swig.github.io/swig-templates/docs/tags/#for) available with loops:

  - `loop.index` returns the current iteration of the loop (1-indexed)
  - `loop.index0` returns the current iteration of the loop (0-indexed)
  - `loop.revindex` returns the number of iterations from the end of the loop (1-indexed)
  - `loop.revindex0` returns the number of iterations from the end of the loop (0-indexed)
  - `loop.key` returns the key of the current item, if the iterator is an object; otherwise it will operate the same as `loop.index`
  - `loop.first` returns true if the current object is the first in the object or array.
  - `loop.last` returns true if the current object is the last in the object or array.

Try some of these out:

{% raw %}
``` html
{% for num in numberArray | reverse %}
  {% if num % 2 === 0 %}
    <li>{{ num }} - {{loop.index}}</li>
  {% endif %}
{% endfor %}
```
{% endraw %}

## Template Inheritance

Logic tags can also be used to extend common code from a base template to child templates. You can use the `block` tag to accomplish this.

Create a new HTML file called *layout.html*:

{% raw %}
``` html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  {% block content %}{% endblock %}
</body>
</html>
```
{% endraw %}

Did you notice the {% raw %}`{% block content %}{% endblock %}`{% endraw %} tags? These are like placeholders that child templates fill in.

Add another new file called *test.html*:

{% raw %}
``` html
{% extends "layout.html" %}
{% block content %}
  <h3> This is the start of a child template</h3>
{% endblock %}
```
{% endraw %}

Finally, add a route handler to *app.js*:

{% raw %}
``` html
{% extends "layout.html" %}
{% block content %}
  <h1>This is the start of a child template</h1>
  <h1>{{title}}</h1>
{% endblock %}
```
{% endraw %}

So, the blocks -  {% raw %}`{% block content %}{% endblock %}`{% endraw %} correspond to the block placeholders from the layout file, and since this file extends from the layout, the content defined here is placed in the corresponding placeholders in the layout.

## Conclusion

Check the [documentation](http://node-swig.github.io/swig-templates/) for more info. Add your questions below. Cheers!
