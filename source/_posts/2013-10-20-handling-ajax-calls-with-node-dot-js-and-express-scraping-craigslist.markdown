---
layout: post
toc: true
title: "Handling AJAX calls with Node.js and Express (scraping Craigslist)"
date: 2013-10-20 01:12
comments: true
categories: node
---

This tutorial is meant for someone who's finished a basic Hello World project with Node and Express and ready to take another step. In short, I'll show you how to **search/scrape/crawl Craigslist using AJAX along with Node and Express.** I assume you're working from a Unix-based environment, already have Node and Express installed, and understand how to navigate the terminal.

You can find the finished code on this [repo](https://github.com/mjhea0/node-express-ajax-craigslist) if wish to bypass the tutorial altogether.

Let's get right to it.

Here is an index of all the articles in the series that have been published to date:

- Part 1: [Scraping Craigslist](http://mherman.org/blog/2013/10/20/handling-ajax-calls-with-node-dot-js-and-express-scraping-craigslist/) **<< CURRENT**
- Part 2: [Adding Handlebars](http://mherman.org/blog/2013/11/01/handling-ajax-calls-with-node-dot-js-and-express-part-2/)
- Part 3: [User Authentication with Passport and MongoDB](http://mherman.org/blog/2013/12/21/handling-ajax-calls-with-node-dot-js-and-express-part-3/)
- Part 4: [Refactoring, Adding styles](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-4/)
- Part 5: [Saving Jobs](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-5)


## Project Setup

#### Navigate to where you'd like your project to reside, then run the following command:

``` sh
$ express node-express-ajax-craigslist
```

#### CD into the newly created directory and install the node modules:

``` sh
$ cd node-express-ajax-craigslist
$ npm install
```

Aside for the installed node modules/dependencies, your project structure should look like this:

``` sh
├── app.js
├── package.json
├── public
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       └── style.css
├── routes
│   ├── index.js
│   └── user.js
└── views
	├── index.jade
	└── layout.jade
```

> In short, your server-side Javascript is held in the `app.js` file, while the client-side file(s) will be placed in the "javascripts" directory. Keep this in mind as we go through the remainder of the tutorial as it's important to understand both the relationship between client and server-side Javascript as well as the ability to distinguish between the two.

#### Next, install [Supervisor](https://github.com/isaacs/node-supervisor) if you don't already have it:

``` sh
$ npm install supervisor -g
```

#### Finally, run a sanity check by testing out your app:

``` sh
$ supervisor app
```

Point your browser to [http://localhost:3000/](http://localhost:3000/) and you should see the simple "Welcome to Express" message:

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/welcome.png)

Still with me? Good. Let's set up our first route.

## app.js (server-side)

#### Within `app.js`, comment out the following two dependencies since we'll be defining *all* our views directly in `app.js`:

``` javascript
var routes = require('./routes');
var user = require('./routes/user');
```

Comment out the following routes as well:

``` javascript
app.get('/', routes.index);
app.get('/users', user.list);
```

> You probably noticed the `'express'` dependency. Remember that we also used Express to generate our project structure. To clarify, Express is *both* a framework and a command line tool. Just be aware that you can use the Express framework without generating the project structure, although you would probably want to follow another boilerplate structure to speed up the development process.

#### **Let's set up our routes.** Routes bind a URL to a specific function. In other words, when a request is sent by the end user, it's handled by a specific URL. Different requests are handled by different URLs within our application. Hence the need for different routes.

Our app we'll have two routes. (1) The first renders the search page where the end user directly searches Craigslist. (2) The result of the search is then passed to another route via AJAX, which processes the request on the server side.

Let's look at the former.

## Index Route (client-side)

#### Add the following code to 'app.js':

``` javascript
app.get('/', function(req, res) {res.render('index')});
```

Essentially, when a user sends an HTTP GET request to `/`, the `index.jade` view is rendered. Let's test this out. Update the code in the `index.jade` view:

``` jade
extends layout

block content
 h1 goodbye, cruel world
```

Double check in the terminal that your server is still running (and that there are no errors), and then return to your browser and refresh the page. You should see the updated H1 tag:

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/goodbye.png)

Next, we'll update the view.

## Index View (client-side)

#### First, update `index.jade`:

``` jade
extends layout

   block content
   input#search(type="search", placeholder="Search Craig's Jobs")
   h2#results

   script(src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js")
   script(src="/javascripts/main.js")
```

Then add the following styles to "style.css":

``` css
#search {
  text-align: center;
  width:500px;
  height: 70px;
  font-size:3.5em;
  border-radius:8px;
}
```

Refresh your browser. See the updates?

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/craigs.png)

This should be straightforward.

## Main.js (client-side)

#### While we're still on the client side, let's go ahead and add the event handler within the `main.js` file:

``` javascript
$(function(){
 $('#search').on('keyup', function(e){
   if(e.keyCode === 13) {
     var parameters = { search: $(this).val() };
       $.get( '/searching',parameters, function(data) {
       $('#results').html(data);
     });
    };
 });
});
```

Here we're capturing the search results after the end user presses (and releases) the ENTER button (keycode `13`), and then storing them in the variable `val`. This data is then sent to the server where the response *will* then be handled, passed back to the client, and finally added to the document via another event handler: `$('#results').html(data)`.

That's a lot to take in. Let's stop for a minute and look at the workflow from the user perspective.

## Workflow

1. User navigates to main page. The page loads.
2. On the page load, the user sees the search box.
3. User can then enter some text to search for.
4. After the user presses ENTER results are displayed.

Thus far, we've finished numbers 1, 2, and 3. Most of the action is handled in step 4, though. We already passed the results back to the server to the `/searching/` route. We need to then scrape Craigslist, send the results back, and then display them, of course.

Now might be a good time to take out a piece of paper and a pen and write a diagram of what has happened thus far.

Ready? Let's move back to the server-side.

## app.js (server-side) redux

#### Back on the sever side, we need a route to handle `/searching/`:

``` javascript
app.get('/searching', function(req, res){
 res.send("WHEEE");
});
```

#### Notice the `res.send()`. I just want to test that the route works. Point your browser to [http://localhost:3000/searching](http://localhost:3000/searching). If all is well, you should see "WHEEE" in the top-left of the screen. We now know the route is working.

####With the route working, we need to accomplish a number of things -
- Set the returned value from the search box to a variable;
- Pass the variable into the YQL search URL (YQL handles the actual scraping);
- Use the *request* module to process the YQL URL and return the results; and,
- Pass the results back to the client side.

**We'll handle all this in increments, testing as we go.**

#### Set the returned value from the search box to a variable:

``` javascript
app.get('/searching', function(req, res){

 // input value from search
 var val = req.query.search;
 console.log(val);

// testing the route
// res.send("WHEEE");

});
```

So after you add this code, return to your main route in the browser - [http://localhost:3000/](http://localhost:3000/) - and place your terminal next to the browser. Now enter a search term and press ENTER. You should see the `console.log()` in the terminal:

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/value.png)

In the above example, I first searched for "Ruby" and then "hello, wonderful".

Moving on, let's add another step.

#### Pass the variable into the YQL search URL.

``` javascript
app.get('/searching', function(req, res){

 // input value from search
 var val = req.query.search;
//console.log(val);

// url used to search yql
var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20craigslist.search" +
"%20where%20location%3D%22sfbay%22%20and%20type%3D%22jjj%22%20and%20query%3D%22" + val + "%22&format=" +
"json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
console.log(url);

// testing the route
// res.send("WHEEE");

});
```

Again, open your browser along with your terminal and search for something relevant. (This specific YQL URL searches for all jobs in the San Francisco Bay Area.)

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/yql.png)

I searched for Ruby then Python in the example above. If you want to see the actual JSON results, grab the URL from the terminal and paste it into your browser's address bar.

#### Use the [*request*](https://github.com/mikeal/request) module to process the YQL URL and return the results. To do this we need to first install this module by running this command from your terminal:

``` sh
$ npm install request
```

Now add the following code to the route function:

``` javascript
// request module is used to process the yql url and return the results in JSON format
request(url, function(err, resp, body) {
 body = JSON.parse(body);
 // logic used to compare search results with the input from user
  if (!body.query.results.RDF.item) {
   craig = "No results found. Try again.";
 } else {
  craig = body.query.results.RDF.item[0]['about'];
 }
 // pass back the results to client side
 res.send(craig);
});
```
So that `app.js` looks like this:

``` javascript
app.get('/searching', function(req, res){

 // input value from search
 var val = req.query.search;
//console.log(val);

// url used to search yql
var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20craigslist.search" +
"%20where%20location%3D%22sfbay%22%20and%20type%3D%22jjj%22%20and%20query%3D%22" + val + "%22&format=" +
"json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
console.log(url);

 // request module is used to process the yql url and return the results in JSON format
 request(url, function(err, resp, body) {
   body = JSON.parse(body);
   // logic used to compare search results with the input from user
   if (!body.query.results.RDF.item) {
     craig = "No results found. Try again.";
   } else {
    craig = body.query.results.RDF.item[0]['about'];
   }
 });

  // testing the route
  // res.send("WHEEE");

});
```

In this code, we pass the YQL URL to the *request* module (`request(url`. . .), then we grab the callback (`body`), which is a string, and then parse it as JSON (`body = JSON.parse(body);`). Next, we test to see if any results are returned. If so, we assign the value `body.query.results.RDF.item[0]['about']` to `craig`, and if not, we assign the value `"No results found. Try again."` to `craig`.

> If you run into problems here, stop and test. `console.log()` the `body`. You can also add a `console.log` inside the conditional statement to see if the logic is even working. For example, if you know that no results are being returned, yet when you add `console.log(testing)` inside the first conditional and don't see it in your console when you run the app, you know that your logic is incorrect.

> **When in doubt always, always, ALWAYS test with `console.log()`.**

#### Finally, let's pass the results back to the client side:

``` javascript
app.get('/searching', function(req, res){

 // input value from search
 var val = req.query.search;
//console.log(val);

// url used to search yql
var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20craigslist.search" +
"%20where%20location%3D%22sfbay%22%20and%20type%3D%22jjj%22%20and%20query%3D%22" + val + "%22&format=" +
"json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
console.log(url);

 // request module is used to process the yql url and return the results in JSON format
 request(url, function(err, resp, body) {
   body = JSON.parse(body);
   // logic used to compare search results with the input from user
   if (!body.query.results.RDF.item) {
     craig = "No results found. Try again.";
   } else {
    craig = body.query.results.RDF.item[0]['about'];
   }
 });

  // pass back the results to client side
  res.send(craig);

  // testing the route
  // res.send("WHEEE");

});
```

So, we're simply taking `craig`, which could contain results or a string stating that no results could be found and sending it back to the client using     `res.send(craig)`.

And with that, we're finished with the server side.

## Main.js (client-side) redux

#### Open `main.js` and look at the following code:

``` javascript
$.get( '/searching',parameters, function(data) {
 $('#results').html(data);
```

This is the *actual* AJAX request. As I stated before, we pass the `parameters` (which is an object) to the server side. We also have a handler setup to process the response from the server, which then takes the returned results and adds the data to the `<h2>` tag with the `id` of `results` in the JADE template.

Now the end user should see the results.

## Testing

Test it out using a number of inputs. *Remember: this searches jobs in the SF Bay Area, so use appropriate keywords.*

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/ruby.png)

Wait. Why did this return just the URL? Well, go back to `app.js` and check the conditional logic:

``` javascript
if (!body.query.results.RDF.item) {
  craig = "No results found. Try again.";
} else {
  craig = body.query.results.RDF.item[0]['about'];
}
```

If the query returns results, then we pass `body.query.results.RDF.item[0]['about']` to `craig`. What is that value? Well, we take the JSON file, `body`, and traverse through it. Let's look at the JSON file real quick. You can grab this from the [repo](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/yql.json).

Now just look at the value, `body.query.results.RDF.item[0]['about']`, and compare it to the JSON file. We move from `query` to `RDF` to the first item, `item[0]`. Finally, when we call the `about` key, the URL (the value) is returned. Make sense? See if you can return the `description` from the second `item`.


Now let's turn that text URL into an actual clickable URL. See if you can do it yourself before you look at my [answer](https://gist.github.com/mjhea0/05da6ead756bd6af7d3b).

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/final.png)

## Conclusion

That's all for now. Next time we'll look at how to return multiple results and loop through them with [Handlebars](http://handlebarsjs.com/) and the separation of concerns. Comment if you have questions. Check out the [repo](https://github.com/mjhea0/node-express-ajax-craigslist). Cheers!
