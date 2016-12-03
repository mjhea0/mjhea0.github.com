---
layout: post
toc: true
title: "Testing AngularJS with Protractor and Karma - part 2"
date: 2015-04-26 08:06
comments: true
categories: angular
keywords: "angular, angularJS, testing, karma, protractor, e2e tests, unit tests, mocha, chai"
description: "In Part 2 of Testing AngularJS with Protractor and Karma we'll look at end to end testing with Protractor."
---

**This article details how to test a simple AngularJS application using unit tests and end-to-end (E2E) tests.**

<div style="text-align:center;">
  <img src="https://raw.githubusercontent.com/mjhea0/angular-testing-tutorial/master/img/angular-protractor.png" style="max-width: 100%; border:0;" alt="angular + protractor">
</div>

<br>

- [Part 1](http://mherman.org/blog/2015/04/09/testing-angularjs-with-protractor-and-karma-part-1) - In the first part we'll look at unit tests, which ensure that small, isolated pieces of code (e.g., a unit) behave as expected.
- Part 2 - In part two we'll address E2E tests, which verify that all the pieces of code (units) fit together by simulating the user experience through browser automation. **(current)**

> *Updates*: December 3rd, 2016 - bumped dependencies

Having finished up unit testing, let's now turn our attention to e2e testing using [Protractor](http://angular.github.io/protractor/#/), which is a testing framework built specifically for AngularJS apps. Essentially, it runs tests against an app in the browser via [Selenium Webdriver](http://seleniumhq.github.io/selenium/docs/api/javascript/), interacting with the app from an end user’s perspective.

<div style="text-align:center;">
  <img src="https://raw.githubusercontent.com/mjhea0/angular-testing-tutorial/master/img/components.png" style="max-width: 100%; border:0;" alt="protractor components">
</div>

<br>

Since e2e tests are much more expensive than unit tests - e.g., they generally take more time to run and are harder to write and maintain - you should almost always focus the majority of your testing efforts on unit tests. It's good to follow the 80/20 rule - 80% of your tests are unit tests, while 20% are e2e tests. That said, this tutorial series breaks this rule since the goal is to educate. Keep this in mind as you write your own tests against your own application.

Also, make sure you test the most important aspects/functions of your application with your e2e tests. Don't waste time on the trivial. Again, they are expensive, so make each one count.

The [repo](https://github.com/mjhea0/angular-testing-tutorial) includes the following tags:

1. *v1* - [project boilerplate](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v1)
1. *v2* - [adds testing boilerplate/configuration](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v2)
1. *v3* - [adds unit tests](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v3)
1. *v4* - [adds E2E tests](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v4)

## Project Setup

Assuming you followed the [first part](http://mherman.org/blog/2015/04/09/testing-angularjs-with-protractor-and-karma-part-1) of this tutorial, checkout the third tag, `v3`, and then run the current test suite starting with the unit tests:

``` sh
$ git checkout tags/v3
$ gulp unit

[23:30:01] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[23:30:01] Starting 'unit'...
INFO [karma]: Karma v0.12.31 server started at http://localhost:9876/
INFO [launcher]: Starting browser Chrome
INFO [Chrome 42.0.2311 (Mac OS X 10.10.2)]: Connected on socket i04LmGbgt7P1lNIUTgIJ with id 48442826
Chrome 42.0.2311 (Mac OS X 10.10.2): Executed 12 of 12 SUCCESS (0.236 secs / 0.051 secs)
[23:30:06] Finished 'unit' after 4.43 s
```

For the e2e tests, you'll need to open two new terminal windows. In the first new window, run `webdriver-manager start`. In the second, navigate to your project directory and then run the app - `gulp`.

Finally, back in the original window, run the tests:

``` sh
$ gulp e2e

[23:31:11] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[23:31:11] Starting 'e2e'...
Using the selenium server at http://localhost:4444/wd/hub
[launcher] Running 1 instances of WebDriver
.

Finished in 1.174 seconds
1 test, 1 assertion, 0 failures

[launcher] 0 instance(s) of WebDriver still running
[launcher] chrome #1 passed
```

Everything look good?

## The Tests

Open the test spec, *spec.js*, within the "tests/e2e" directory. Let's look at the first test:

``` javascript
describe('myController', function () {

  it('the dom initially has a greeting', function () {
    browser.get('http://localhost:8888/#/one');
    expect(element(by.id('greeting')).getText()).toEqual('Hello, World!');
  });

});
```

Notice how we're still using [Mocha](http://mochajs.org/) and [Chai](http://chaijs.com/) to [manage/structure](http://angular.github.io/protractor/#/frameworks) the test so that it simply opens `http://localhost:8888/#/one` and then asserts that the text within the HTML element with an ID of `greeting` is  `Hello, World!`. Simple, right?

Let's take a quick look at the Angular services that we're using:

1. [browser](http://angular.github.io/protractor/#/api?view=Protractor) - loads the page in the browser
1. [element](http://angular.github.io/protractor/#/api?view=ElementFinder) - interacts with the page
1. [by](http://angular.github.io/protractor/#/api?view=ProtractorBy) - finds elements within the page

Finally, one important thing to note is how these tests run. Notice that there's no callbacks and/or promises in the test. How does that work with asynchronous code? Simple: Protractor continues to check each assertion until it passes or a certain amount of [time](https://github.com/angular/protractor/blob/master/docs/timeouts.md) passes. There also is a [promise](http://angular.github.io/protractor/#/api?view=then) attached to most methods that can be access using `then`.

With that, let's write some tests on our own.

### TestOneController

Just like in the first part, open the controller code:

``` javascript
myApp.controller('TestOneController', function($scope) {
  $scope.greeting = "Hello, World!";
  $scope.newText = undefined;
  $scope.changeGreeting = function() {
    if ($scope.newText !== undefined) {
      $scope.greeting = $scope.newText;
    }
  };
});
```

How about the HTML?

{% codeblock lang:html %}
<h2>Say something</h2>
<input type="text" ng-model="newText">
<button class="btn btn-default" ng-click="changeGreeting()">Change!</button>
<p id="greeting">{% raw %}{{ greeting }}{% endraw %}</p>
{% endcodeblock  %}

Looking at the Angular code along with the HTML, we know that on the button click, `greeting` is updated with the user supplied text from the input box. Sound right? Test this out: With the app running via Gulp, navigate to [http://localhost:8888/#/one](http://localhost:8888/#/one) and manually test the app to ensure that the controller is working as it should.

Now since we already tested the initial state of `greeting`, let's write the test to ensure that the state updates on the button click:

``` javascript
describe('TestOneController', function () {

  beforeEach(function() {
    browser.get('http://localhost:8888/#/one');
  });

  it('initially has a greeting', function () {
    expect(element(by.id('greeting')).getText()).toEqual('Hello, World!');
  });

  it('clicking the button changes the greeting if text is inputed', function () {
    element(by.css('[ng-model="newText"]')).sendKeys('Hi!');
    element(by.css('.btn-default')).click();
    expect(element(by.id('greeting')).getText()).toEqual('Hi!');
  });

  it('clicking the button does not change the greeting if text is not inputed', function () {
    element(by.css('.btn-default')).click();
    expect(element(by.id('greeting')).getText()).toEqual('Hello, World!');
  });

});
```

So, in both new test cases we're targeting the input form - via the global [element](http://angular.github.io/protractor/#/locators) function - and adding text to it with the `sendKeys()` method - `Hi!` in the first test and no text in the second. Then after clicking the button, we're asserting that the text contained within the HTML element with an id of "greeting" is as expected.

Run the tests. If all went well, you should see:

``` sh
[06:15:45] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[06:15:45] Starting 'e2e'...
Using the selenium server at http://localhost:4444/wd/hub
[launcher] Running 1 instances of WebDriver
...

Finished in 3.606 seconds
3 tests, 3 assertions, 0 failures

[launcher] 0 instance(s) of WebDriver still running
[launcher] chrome #1 passed
Michaels-MacBook-Pro-3:angular-testing-tutorial michael$
```

Did you see Chrome open in a new window and run the tests, then close itself? It's super fast!! Want to run the tests in Firefox (or a different [browser](http://angular.github.io/protractor/#/browser-support)) as well? Simply update the Protractor config file, *protractor.conf.js*, like so:

``` javascript
exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['tests/e2e/*.js'],
  multiCapabilities: [{
    browserName: 'firefox'
  }, {
    browserName: 'chrome'
  }]
};
```

Test it again. You should now see the tests run in both Chrome and Firefox simultaneously. Nice.

Finally, to simplify the code and speed up the tests (so we only search the DOM once per element), we can assign each element to a variable:

``` javascript
describe('TestOneController', function () {

  var greeting = element(by.id('greeting'));
  var textInputBox = element(by.css('[ng-model="newText"]'));
  var changeGreetingButton = element(by.css('.btn-default'));

  beforeEach(function() {
    browser.get('http://localhost:8888/#/one');
  });

  it('initially has a greeting', function () {
    expect(greeting.getText()).toEqual('Hello, World!');
  });

  it('clicking the button changes the greeting if text is inputed', function () {
    textInputBox.sendKeys('Hi!');
    changeGreetingButton.click();
    expect(greeting.getText()).toEqual('Hi!');
  });

  it('clicking the button does not change the greeting if text is not inputed', function () {
    textInputBox.sendKeys('');
    changeGreetingButton.click();
    expect(greeting.getText()).toEqual('Hello, World!');
  });

});
```

Test one last time to ensure that this refactor didn't break anything.

### TestTwoController

Again, start with the code.

Angular:

``` sh
myApp.controller('TestTwoController', function($scope) {
  $scope.total = 6;
  $scope.newItem = undefined;
  $scope.items = [1, 2, 3];
  $scope.add = function () {
    if(typeof $scope.newItem == 'number') {
      $scope.items.push($scope.newItem);
      $scope.total = 0;
      for(var i = 0; i < $scope.items.length; i++){
        $scope.total += parseInt($scope.items[i]);
      }
    }
  };
});
```

HTML:

{% codeblock lang:html %}
<h2>Add values</h2>
<input type="number" ng-model="newItem">
<button class="btn btn-default" ng-click="add()">Add!</button>
<p>{% raw %}{{ total }}{% endraw %}</p>
{% endcodeblock %}

Then test it in the browser.

Like last time, we simply need to ensure that `total` is updated appropriately when the end user submits a number in the input box and then clicks the button.

``` javascript
describe('TestTwoController', function () {

  var total = element(by.tagName('p'));
  var numberInputBox = element(by.css('[ng-model="newItem"]'));
  var changeTotalButton = element(by.css('.btn-default'));

  beforeEach(function() {
    browser.get('http://localhost:8888/#/two');
  });

  it('initially has a total', function () {
    expect(total.getText()).toEqual('6');
  });

  it('updates the `total` when a value is added', function () {
    numberInputBox.sendKeys(7);
    changeTotalButton.click();
    numberInputBox.clear();
    expect(total.getText()).toEqual('13');
    numberInputBox.sendKeys(7);
    changeTotalButton.click();
    expect(total.getText()).toEqual('20');
    numberInputBox.clear();
    numberInputBox.sendKeys(-700);
    changeTotalButton.click();
    expect(total.getText()).toEqual('-680');
  });

  it('does not update the `total` when an empty value is added', function () {
    numberInputBox.sendKeys('');
    changeTotalButton.click();
    expect(total.getText()).toEqual('6');
    numberInputBox.sendKeys('hi!');
    changeTotalButton.click();
    expect(total.getText()).toEqual('6');
  });

});
```

Run the tests and you should see:

``` sh
6 tests, 9 assertions, 0 failures
```

Moving along...

### TestThreeController

You know the drill:

1. Look at the Angular and HTML code
1. Manually test in the browser
1. Write the e2e test to automate the manual test

Try this on your own before looking at the code below.

``` javascript
describe('TestThreeController', function () {

  var modalNumber = element.all(by.tagName('span')).get(1);
  var modalButton = element(by.tagName('button'));
  var iterateButton = element(by.css('[ng-click="changeModalText()"]'));
  var hideButton = element(by.css('[ng-click="$hide()"]'));
  var justSomeText = element(by.tagName('h2'));

  beforeEach(function() {
    browser.get('http://localhost:8888/#/three');
  });

  it('initially has a modalNumber', function () {
    modalButton.click();
    expect(modalNumber.getText()).toEqual('1');
  });

  it('updates the `modalNumber` when a value is added', function () {
    modalButton.click();
    iterateButton.click();
    expect(modalNumber.getText()).toEqual('2');
    iterateButton.click().click().click();
    expect(modalNumber.getText()).toEqual('5');
    hideButton.click();
    expect(justSomeText.getText()).toEqual('Just a modal');
  });
```

### TestFourController

Since this controller makes an external call to [https://api.github.com/repositories](https://api.github.com/repositories) you can either mock out (fake) this request using [ngMockE2E](https://docs.angularjs.org/api/ngMockE2E), like we did for the unit test, or you can actually make the API call. Again, this depends on how expensive the call is and how important the functionality is to your application. In most cases, it's better to actually make the call since e2e tests should mimic the actual end user experience as much as possible. Plus, unlike unit tests which test implementation, these tests test user behavior, across several independent units - thus, these tests should not be isolated and can rely on making actual API calls either to the back-end or externally.

``` javascript
describe('TestFourController', function () {

  var loadButton = element(by.tagName('button'));
  var ul = element.all(by.tagName('ul'));
  var li = element.all(by.tagName('li'));

  beforeEach(function() {
    browser.get('http://localhost:8888/#/four');
  });

  it('updates the DOM when the button is clicked', function () {
    expect(ul.count()).toEqual(1);
    expect(li.count()).toEqual(5);
    loadButton.click();
    expect(ul.count()).toEqual(101);
    expect(li.count()).toEqual(105);
  });

});
```

Here, when the button is clicked, the API call is made and the scope is updated. We then assert that there are 101 UL tags and 105 LI tags, representing a Github username and repo returned from the API call, present on the DOM.

That's it!

## Conclusion

*Want more?*

1. Take a look at the [Page Objects](http://angular.github.io/protractor/#/page-objects) design pattern and refactor the tests so that they are better organized.
1. Break a test, and then [pause](http://angular.github.io/protractor/#/debugging#pausing-to-debug) the test before the break via `browser.pause()` and/or `browser.debugger()` to debug.
1. Test your own Angular app, and then add a link to the comments to get feedback.

Be sure to check the [Protractor](http://angular.github.io/protractor/#/) documentation for more. Thanks again for reading, and happy testing!

<hr><br>

*Interested in learning how to test an Angular + Django app? Check out [Real Python](http://www.realpython.com/) for details.*
