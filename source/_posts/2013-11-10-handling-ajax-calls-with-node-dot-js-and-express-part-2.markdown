---
layout: post
title: "Handling AJAX Calls With Node.js and Express (part 2)"
date: 2013-11-01 07:01
comments: true
categories: node
---

{% raw %}

Here is an index of all the articles in the series that have been published to date:

- Part 1: [Scraping Craigslist](http://mherman.org/blog/2013/10/20/handling-ajax-calls-with-node-dot-js-and-express-scraping-craigslist/)
- Part 2: [Adding Handlebars](http://mherman.org/blog/2013/11/01/handling-ajax-calls-with-node-dot-js-and-express-part-2/) **<< CURRENT**
- Part 3: [User Authentication with Passport and MongoDB](http://mherman.org/blog/2013/12/21/handling-ajax-calls-with-node-dot-js-and-express-part-3/)
- Part 4: [Refactoring, Adding styles](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-4/)
- Part 5: [Saving Jobs](http://mherman.org/blog/2014/04/15/handling-ajax-calls-with-node-dot-js-and-express-part-5)

Last [time](http://mherman.org/blog/2013/10/20/handling-ajax-calls-with-node-dot-js-and-express-scraping-craigslist/) we looked at how to scrape Craigslist using AJAX, Node, and Express. In this post we'll look at adding [Handlebars](http://handlebarsjs.com/) into the mix.

We'll start with the server-side. Essentially, we need to modify the returned JSON results, creating a data structure appropriate for Handlebars. From there, we'll send the newly created data structure back to the client-side, pass it into a  Handlebars template, and finally loop through the structure to ouput each individual result.

## app.js (server-side)

Our second route, `/searching`, currently looks like this:

```javascript
// second route
app.get('/searching', function(req, res){

	// input value from search
	var val = req.query.search;
	//console.log(val);

	// url used to search yql
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20craigslist.search" +
	"%20where%20location%3D%22sfbay%22%20and%20type%3D%22jjj%22%20and%20query%3D%22" + val + "%22&format=" +
	"json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
	// console.log(url);

	// request module is used to process the yql url and return the results in JSON format
	request(url, function(err, resp, body) {
		body = JSON.parse(body);
		// logic used to compare search results with the input from user
		// console.log(!body.query.results.RDF.item['about'])
		if (!body.query.results.RDF.item['about'] === false) {
		  craig = "No results found. Try again.";
		} else {
		  results = body.query.results.RDF.item[0]['about']
	      craig = '<a href ="'+results+'">'+results+'</a>'
	  }
	  // pass back the results to client side
		res.send(craig);
	});

	// testing the route
	// res.send("WHEEE");

});
```

Right now we're just sending back a single link to a single result from the returned JSON:

```javascript
results = body.query.results.RDF.item[0]['about']
craig = '<a href ="'+results+'">'+results+'</a>'
```

Let's expand this out so that it returns the title, url, and description. It's also much easier to loop through an array than an object in Handlebars, so let's return an array of objects - 

```javascript
[{title: <title>, link:<link>, description:<description>}, . . .]
```
    
**How do we do that?** Based on the returned JSON data we know that the data needed is found in the `items` key. Add the following `console.log` to the `else` block:

```javascript
console.log(body.query.results.RDF.item[0])
```
    
Fire up your server. Navigate to [http://localhost:3000/](http://localhost:3000/). Run a search on "Ruby". Then check the output in the terminal. You should see something similar to this:

```javascript
{ about: 'http://sfbay.craigslist.org/pen/sad/4151410088.html',
  title:
   [ 'Sr. System Administrator (mountain view)',
     'Sr. System Administrator (mountain view)' ],
  link: 'http://sfbay.craigslist.org/pen/sad/4151410088.html',
  description: 'Sr. System Administrator - Couchbase \nWe are looking to add a smart, energetic, and fast learning System Administrator/Operations Engineer who will develop, manage and support Couchbase\'s growing infrastructure including building and maintaining virt [...]',
  date: '2013-10-25T12:15:03-07:00',
  language: 'en-us',
  rights: '&copy; 2013 craigslist',
  source: 'http://sfbay.craigslist.org/pen/sad/4151410088.html',
  type: 'text',
  issued: '2013-10-25T12:15:03-07:00' }
```

Thus, each object will look like this:

```javascript
{title:results.title[0], about:results["link"], desc:results["description"]}
```
    
> `title` is an array with two values, where each value contains the exact same result. You can double check this by looking at other returned items. 

Next, update the loop with the following code:

```javascript
if (!body.query.results.RDF.item) {
  results = "No results found. Try again.";
} else {
	console.log(body.query.results.RDF.item[0])
	results = body.query.results.RDF.item
	for (var i = 0; i < results.length; i++) {
	  resultsArray.push(
	    {title:results[i].title[0], about:results[i]["about"], desc:results[i]["description"]}
	  )
	}
}
```
	
To test out this code, `console.log` the array outside of the loop. Run another search for "ruby". You should see something similar to this:

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/part2-results.png)

Which is the exact data structure that we need. Make sure that your `request` method looks like this:

```javascript
request(url, function(err, resp, body) {
  resultsArray = [];
  body = JSON.parse(body);
  // logic used to compare search results with the input from user
  if (!body.query.results.RDF.item) {
    results = "No results found. Try again.";
    res.send(results)
  } else {
	results = body.query.results.RDF.item;
	for (var i = 0; i < results.length; i++) {
	  resultsArray.push(
	    {title:results[i].title[0], about:results[i]["about"], desc:results[i]["description"]}
	  );
	};
  };
  // pass back the results to client side
  res.send(resultsArray);
});
```
	
So, if no results are found from the search, we're sending `results` back to the client side, otherwise we're sending `resultsArray`.

Finally, let's refactor the code to seperate out concerns:

```javascript
// second route
app.get('/searching', function(req, res){
  // input value from search
  var val = req.query.search;
  // url used to search yql
  var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20craigslist.search" +
"%20where%20location%3D%22sfbay%22%20and%20type%3D%22jjj%22%20and%20query%3D%22" + val + "%22&format=" +
"json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
		
  requests(url,function(data){
    res.send(data);
  });
});

function requests(url, callback) {
  // request module is used to process the yql url and return the results in JSON format
  request(url, function(err, resp, body) {
    var resultsArray = [];
	body = JSON.parse(body);
	// console.log(body.query.results.RDF.item)
	// logic used to compare search results with the input from user
	if (!body.query.results.RDF.item) {
	  results = "No results found. Try again.";
	  callback(results);
	} else {
	  results = body.query.results.RDF.item;
	  for (var i = 0; i < results.length; i++) {
		resultsArray.push(
		  {title:results[i].title[0], about:results[i]["about"], desc:results[i]["description"]}
		);
	  };
	};
    // pass back the results to client side
    callback(resultsArray);
  });
};
```

## main.js (client-side)

Back on the client side, add the following `if` statement:

```javascript
$.get('/searching', parameters, function(data){
  if (data instanceof Array) {
    $results.html(dataTemplate({resultsArray:data}));
  } else {
    $results.html(data);
  };
});
```
  	
This tests whether the returned data is an array. If so, `data` is passed to Handledbars, and, if not, `data` is added to `index.html`, indicating that no results are found. Test this out. Try searching for a something you know won't return any results:

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/no_results.png)

## Handlebars

Finally, when results are returned, we want to pass `data`, which is the `resultsArray` to Handlebars, a client side templating engine. Such engines are extremly powerful as they provide a connection between the UI and underlying business logic. Put simply, this allows us to bind the `resultsArray` to the UI. This is called *data binding*. When the underlying data changes, such changes will reflect on the UI.

First, update the `index.jade` file to include the Handlebars template, `template.html`:

```javascript
extends layout

block content
  h1 search sf jobs
  input#search(type="search", placeholder="Search Craig's Jobs")
  ul#results
  include template.html

  script(src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js")
  script(src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.0.0/handlebars.min.js")
  script(src="/javascripts/main.js")
```

Next, add `template.html` to the "views" folder, and then add the following code:


```javascript
<script id="search-results" type="text/x-handlebars-template">
  {{#each resultsArray}}
    <li><a href={{about}}>{{title}}</a><br>{{desc}}></li>
  {{/each}}
  <br>
  </ul>
</script>
```
    
As you probably guessed, the `each` helper iterates through the list, adding a new list item - which includes the title, link, and description - to the dom.

Test this out one last time. Search for "ruby":

![image](https://raw.github.com/mjhea0/node-express-ajax-craigslist/master/img/ruby-search-results.png)

Looks pretty good.
  
## Conclusion

Alright, so next time we'll add user login and authentication. You can grab the code [here](https://github.com/mjhea0/node-express-ajax-craigslist).

{% endraw %}





