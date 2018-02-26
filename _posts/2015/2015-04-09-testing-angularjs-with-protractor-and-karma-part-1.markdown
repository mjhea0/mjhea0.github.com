---
layout: post
toc: true
title: "Testing AngularJS with Protractor and Karma - part 1"
date: 2015-04-09 09:06
comments: true
toc: true
categories: [angular, testing]
keywords: "angular, angularJS, testing, karma, protractor, e2e tests, unit tests, mocha, chai"
description: "Let's look at how to test an AngularJS application with Protractor and Karma!"
---

This article details how to test a simple AngularJS application using unit tests and end-to-end (E2E) tests.

<div style="text-align:center;">
  <img src="https://raw.githubusercontent.com/mjhea0/angular-testing-tutorial/master/img/angular-karma.png" style="max-width: 100%; border:0;" alt="angular + karma">
</div>

<br>

- Part 1 - In the first part we'll look at unit tests, which ensure that small, isolated pieces of code (e.g., a unit) behave as expected **(current)**.
- [Part 2](http://mherman.org/blog/2015/04/26/testing-angularjs-with-protractor-and-karma-part-2) - In part two we'll address E2E tests, which verify that all the pieces of code (units) fit together by simulating the user experience through browser automation.

*Updates*:

- December 3rd, 2016 - bumped dependencies

To accomplish this we will be using [Karma](http://karma-runner.github.io/) v0.12.31 (test runner) and [Chai](http://chaijs.com/) v2.2.0 (assertions) for the unit tests (along with [Karma-Mocha](https://github.com/karma-runner/karma-mocha)) and [Protractor](http://angular.github.io/protractor/#/) v2.0.0 for the E2E tests. This article also uses [Angular](https://angularjs.org/) v1.3.15. Be sure to take note of all dependencies and their versions in the *package.json* and *bower.json* files in the [repo](https://github.com/mjhea0/angular-testing-tutorial).

The repo includes the following tags:

1. *v1* - [project boilerplate](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v1)
1. *v2* - [adds testing boilerplate/configuration](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v2)
1. *v3* - [adds unit tests](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v3)
1. *v4* - [adds E2E tests](https://github.com/mjhea0/angular-testing-tutorial/releases/tag/v4)

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Start by cloning the repo, checkout out the first tag, and then install the dependencies:

``` sh
$ git clone https://github.com/mjhea0/angular-testing-tutorial.git
$ cd angular-testing-tutorial
$ git checkout tags/v1
$ npm install && bower install
```

Run the app:

``` sh
$ gulp
```

Navigate to [http://localhost:8888](http://localhost:8888) to view the live app.

<div style="text-align:center;">
  <img src="https://raw.githubusercontent.com/mjhea0/angular-testing-tutorial/master/img/live-app.png" style="max-width: 100%; border:0;" alt="angular app">
</div>

<br>

Test it out. Once done, kill the server and checkout the second tag:

``` sh
$ git checkout tags/v2
```

There should now be a "tests" folder and a few more tasks in the Gulpfile.

Run the unit tests:

``` sh
$ gulp unit
```

They should pass:

``` sh
[05:28:02] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[05:28:02] Starting 'unit'...
INFO [karma]: Karma v0.12.31 server started at http://localhost:9876/
INFO [launcher]: Starting browser Chrome
INFO [Chrome 41.0.2272 (Mac OS X 10.10.2)]: Connected on socket JBQp0aEyu8KSqUfGoxsd with id 94772581
Chrome 41.0.2272 (Mac OS X 10.10.2): Executed 2 of 2 SUCCESS (0.061 secs / 0.002 secs)
[05:28:05] Finished 'unit' after 3.23 s
```

Now for the e2e tests:

1. 1st terminal window: `webdriver-manager start`
1. 2nd terminal window (within the project directory): `gulp`
1. 3rd terminal window (within the project directory): `gulp e2e`

They should pass as well:

``` sh
[05:29:45] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[05:29:45] Starting 'e2e'...
Using the selenium server at http://localhost:4444/wd/hub
[launcher] Running 1 instances of WebDriver
.

Finished in 0.921 seconds
1 test, 1 assertion, 0 failures

[launcher] 0 instance(s) of WebDriver still running
[launcher] chrome #1 passed
```

So, what's happening here...

## Configuration Files

There are two configuration files in the "tests" folder - one for Karma and the other for Protractor.

### Karma

[Karma](http://karma-runner.github.io/) is a test runner built by the AngularJS team that executes the unit tests and reports the results.

Let's look the config file, *karma.conf.js*:

``` javascript
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns
    basePath: '.',

    // frameworks to use
    frameworks: ['mocha', 'chai'],

    // list of files / patterns to load in the browser
    files: [
      '../app/bower_components/angular/angular.js',
      '../app/bower_components/jquery/dist/jquery.js',
      '../app/bower_components/angular-strap/dist/angular-strap.js',
      '../app/bower_components/angular-strap/dist/angular-strap.tpl.js',
      '../app/bower_components/angular-mocks/angular-mocks.js',
      '../app/bower_components/angular-route/angular-route.js',
      './unit/*.js',
      '../app/app.js'
    ],

    // test result reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    browsers: ['Chrome'],

    // Continuous Integration mode
    singleRun: false
  });
};
```

> You can also run `karma init` to be guided through the creation of a config file.

Be sure to read over the comments for an overview of each config option. For more information, review the [official documentation](http://karma-runner.github.io/0.12/config/configuration-file.html).

### Protractor

[Protractor](http://angular.github.io/protractor/#/) provides a nice wrapper around [WebDriverJS](https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs), the JavaScript bindings for [Selenium Webdriver](http://seleniumhq.github.io/selenium/docs/api/javascript/), to run tests against an AngularJS application running live in a browser.

Turn your attention to the Protractor config file, *protractor.conf.js*:

``` javascript
exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['tests/e2e/*.js']
};
```

This tells protractor where to find the test files (called specs) and specifies the address that the Selenium server is running on. Simple.

Ready to start testing?

## Unit Tests

We'll start with unit tests since they are much easier to write, debug, and maintain.

Keep in mind that unit tests, by definition, only test isolated units of code so they rely heavily on mocking fake data. This can add much complexity to your tests and can decrease the effectiveness of the actual tests. For example, if you're mocking out an HTTP request to a back-end API, then you're not really testing your application. Instead you're simulating the request and then using fake JSON data to simulate the response back. The tests may run faster, but they are much less effective.

When starting out, mock out only the most expensive requests and make the actual API call in other situations. Over time you will develop a better sense of which requests should be mocked and which should not.

Finally, if you decide not to mock a request in a specific test, then the test is no longer a unit test since it's not testing an isolated unit of code. Instead you are testing multiple units, which is an integration test. For simplicity, we will continue to refer to such tests as unit tests.

With that, let's create some tests, broken up by controller!

### TestOneController

Take a look at the code in the first controller:

``` javascript
myApp.controller('TestOneController', function($scope) {
  $scope.greeting = "Hello, World!";
  $scope.newText = undefined;
  $scope.changeGreeting = function() {
    $scope.greeting = $scope.newText;
  };
});
```

What's happening here? Confirm your answer by running your app and watching what happens. Now, what can/should we test?

1. `greeting` has an initial value of `"Hello, World!"`, and
2. The `changeGreeting` function updates `greeting`.

You probably noticed that we are already testing this in the spec:

``` javascript
describe('TestOneController', function () {

  var controller = null;
  $scope = null;

  beforeEach(function () {
    module('myApp');
  });

  beforeEach(inject(function ($controller, $rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('TestOneController', {
      $scope: $scope
    });
  }));

  it('initially has a greeting', function () {
    assert.equal($scope.greeting, "Hello, World!");
  });

  it('clicking the button changes the greeting', function () {
    $scope.newText = "Hi!";
    $scope.changeGreeting();
    assert.equal($scope.greeting, "Hi!");
  });

});
```

What's happening?

1. The `describe` block is used to group similar tests.
1. The module, `myApp`, is loaded, into each test, in the first `beforeEach` block, which instantiates a clean testing environment.
1. The dependencies are injected, a new scope is created, and the controller is instantiated in the second `beforeEach`.
1. Each `it` function is a separate test, which includes a title, in human readable form, and a function with the actual test code.
1. The first test asserts that the initial state of `greeting` is `"Hello, World!"`.
1. Meanwhile, the second test assets that the `changeGreeting()` function actually changes the value of `greeting`.

Make sense?

*In most cases, unit tests simply change the scope and assert that the results are what we expected.*

> In general, when testing controllers, you inject then register the controller with a `beforeEach` block, along with the `$rootScope` and then test that the functions within the controller act as expected.

Run the tests again to ensure they still pass - `gulp unit`.

What else could we test? How about if `newText` doesn't change - e.g., if the user submits the button without entering any text in the input box - then the value of `greeting` should stay the same. Try writing this on your own, before you look at my answer:

``` javascript
it('clicking the button does not change the greeting if text is not inputed', function () {
  $scope.changeGreeting();
  assert.equal($scope.greeting, "Hello, World!");
});
```

Try running this. It should fail.

``` sh
Chrome 41.0.2272 (Mac OS X 10.10.2) TestOneController clicking the button does not change the greeting FAILED
  AssertionError: expected undefined to equal 'Hello, World!'
```

So, we've revealed a bug. We could fix this by adding validation to the input box to ensure the end user enters a value or we could update `changeGreeting` to only update `greeting` if `newText` is not `undefined`. Let's go with the latter.

``` javascript
$scope.changeGreeting = function() {
  if ($scope.newText !== undefined) {
    $scope.greeting = $scope.newText;
  }
};
```

Save the code, and then run the tests again:

``` sh
$ gulp unit
[08:28:18] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[08:28:18] Starting 'unit'...
INFO [karma]: Karma v0.12.31 server started at http://localhost:9876/
INFO [launcher]: Starting browser Chrome
INFO [Chrome 41.0.2272 (Mac OS X 10.10.2)]: Connected on socket HGnVC5-cAXOZjAsrSCWj with id 83240025
Chrome 41.0.2272 (Mac OS X 10.10.2): Executed 3 of 3 SUCCESS (0.065 secs / 0.001 secs)
[08:28:21] Finished 'unit' after 3.13 s
```

Nice!

> Since controllers are used to bind data to the template (via scope), unit tests are perfect for testing the controller logic - e.g., what happens to the scope as the controller runs - while E2E tests ensure that the template is updated accordingly.

### TestTwoController

Start by analyzing the code:

``` javascript
myApp.controller('TestTwoController', function($scope) {
  $scope.total = 6;
  $scope.newItem = undefined;
  $scope.items = [1, 2, 3];
  $scope.add = function () {
    $scope.items.push($scope.newItem);
    $scope.total = 0;
    for(var i = 0; i < $scope.items.length; i++){
      $scope.total += parseInt($scope.items[i]);
    }
  };
});
```

What should we test? Take out a pen and paper and write down everything that should be tested. Once done, write the code. Check your code against mine.

Be sure to start with the following boilerplate:

``` javascript
describe('TestTwoController', function () {

  var controller = null;
  $scope = null;

  beforeEach(function () {
    module('myApp');
  });

  beforeEach(inject(function ($controller, $rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('TestTwoController', {
      $scope: $scope
    });
  }));

});
```

#### Test 1: The initial value of `total`

``` javascript
it('initially has a total', function () {
  assert.equal($scope.total, 6);
});
```

#### Test 2: The initial value of `items`

``` javascript
it('initially has items', function () {
  assert.isArray($scope.items);
  assert.deepEqual($scope.items, [1, 2, 3]);
});
```

#### Test 3: The `add` function updates the `total` and `items` array when a value is added

``` javascript
it('the `add` function updates the `total` and `items` array when a value is added', function () {
  $scope.newItem = 7;
  $scope.add();
  assert.equal($scope.total, 13);
  assert.deepEqual($scope.items, [1, 2, 3, 7]);
});
```

#### Test 4: The `add` function does not update the `total` and `items` array when an empty value is added

``` javascript
it('does not update the `total` and `items` array when an empty value is added', function () {
  $scope.newItem = undefined;
  $scope.add();
  assert.equal($scope.total, 6);
  assert.deepEqual($scope.items, [1, 2, 3]);
  $scope.newItem = 22;
  $scope.add();
  assert.equal($scope.total, 28);
  assert.deepEqual($scope.items, [1, 2, 3, 22]);
});
```

#### Run

Each test should be straightforward. Run the tests. There should be one failure:

``` javascript
Chrome 41.0.2272 (Mac OS X 10.10.2) TestTwoController does not update the `total` and `items` array when an empty value is added FAILED
  AssertionError: expected NaN to equal 6
```

Update the code, adding a conditional again:

``` javascript
$scope.add = function () {
  if(typeof $scope.newItem == 'number') {
    $scope.items.push($scope.newItem);
    $scope.total = 0;
    for(var i = 0; i < $scope.items.length; i++){
      $scope.total += parseInt($scope.items[i]);
    }
  }
};
```

Also update the partial, */app/partials/two.html*:

``` html
<input type="number" ng-model="newItem">
```

Run it again:

``` sh
$ gulp unit
[09:56:10] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[09:56:10] Starting 'unit'...
INFO [karma]: Karma v0.12.31 server started at http://localhost:9876/
INFO [launcher]: Starting browser Chrome
INFO [Chrome 41.0.2272 (Mac OS X 10.10.2)]: Connected on socket Lbv1sROpYrEHgotlmJZf with id 91008249
Chrome 41.0.2272 (Mac OS X 10.10.2): Executed 7 of 7 SUCCESS (0.082 secs / 0.003 secs)
[09:56:13] Finished 'unit' after 3.05 s
```

Success!

Did I miss anything? Comment below.

### TestThreeController

Again, check out the code in *app.js*:

``` javascript
myApp.controller('TestThreeController', function($scope) {
  $scope.modal = {title: 'Hi!', content: 'This is a message!'};
});
```

What can we test here?

``` javascript
it('initially has a modal', function () {
  assert.isObject($scope.modal);
  assert.deepEqual($scope.modal, {title: 'Hi!', content: 'This is a message!'});
});
```

Perhaps a better question is: What *should* we test here? Is the above test really necessary? Probably not. But we may need to test it out more in the future if we build out the functionality. Let's go for it!

#### Update *app.js*:

``` javascript
myApp.controller('TestThreeController', function($scope, $modal) {
  $scope.modalNumber = 1;
  var myModal = $modal({scope: $scope, template: 'modal.tpl.html', show: false});
  $scope.showModal = function() {
    myModal.$promise.then(myModal.show);
  };
  $scope.changeModalText = function() {
    $scope.modalNumber++;
    };
});
```

Here we are defined a custom template, `modal.tpl.html`, to be used for the modal text and then we assigned `$scope.modalNumber` to `1` as well as function to iterate the number.

#### Add *modal.tpl.html*:

{% raw %}
```html
<div class="modal" tabindex="-1" role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-body">
        <span>
          <button class="btn btn-default" ng-click="changeModalText()">Iterate</button>
          &nbsp;&#8594;&nbsp;
          <span>{{ modalNumber }}</span>
        </span>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" ng-click="$hide()">Close</button>
      </div>
    </div>
  </div>
</div>
```
{% endraw %}

Add this template to the "app" folder.

#### Update *three.html*:

Finally, update the partial:

```html
<h2>Just a modal</h2>
<button type="button" class="btn btn-lg btn-default" data-template="modal.tpl.html" bs-modal="modal">
  Launch modal!
</button>
```

Run the app to make sure everything works, and then update the test...

#### Test redux

``` javascript
describe('TestThreeController', function () {

  var controller = null;
  $scope = null;

  beforeEach(function () {
    module('myApp');
  });

  beforeEach(inject(function ($controller, $rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('TestThreeController', {
      $scope: $scope
    });
  }));

  it('initially has a modalNumber', function () {
    assert.equal($scope.modalNumber, 1);
  });

  it('updates the `modalNumber` when a value is added', function () {
    $scope.changeModalText();
    assert.equal($scope.modalNumber, 2);
    $scope.changeModalText();
    assert.equal($scope.modalNumber, 3);
  });

});
```

Notice how we're no longer testing that a modal is present. We'll test that via the E2E tests.

### TestFourController

Finally, let's test the AJAX request:

``` sh
myApp.controller('TestFourController', function($scope, $http) {
  $scope.repos = [];
  $scope.loadRepos = function () {
    $http.get('https://api.github.com/repositories').then(function (repos) {
      $scope.repos = repos.data;
    });
  };
});
```

Remember the discussion earlier on mocking HTTP requests? Well, here's probably a good place to actually use a mocking library since this request hits an external API. To do this, we can use the `$httpBackend` directive from the [angular-mocks](https://docs.angularjs.org/api/ngMock) library.

First, let's first add the *mock.js* file found in the [repo](https://github.com/mjhea0/angular-testing-tutorial/tree/master/tests/mock) into a new folder called "mock" within the "tests" folder. This module uses `angular.module().value` to set a JSON value to use as the fake data.

Update the list of files in *karma.conf.js* so that the the mock file is loaded and served by Karma:

``` javascript
files: [
  '../app/bower_components/angular/angular.js',
  '../app/bower_components/jquery/dist/jquery.js',
  '../app/bower_components/angular-strap/dist/angular-strap.js',
  '../app/bower_components/angular-strap/dist/angular-strap.tpl.js',
  '../app/bower_components/angular-mocks/angular-mocks.js',
  '../app/bower_components/angular-route/angular-route.js',
  './unit/*.js',
  './mock/*.js',
  '../app/app.js'
],
```

Next, add the test:

``` javascript
describe('TestFourController', function () {

  var controller = null;
  var $scope = null;
  var $httpBackend = null;
  var mockedDashboardJSON = null;

  beforeEach(function () {
    module('myApp', 'mockedDashboardJSON');
  });

    beforeEach(inject(function ($controller, $rootScope, _$httpBackend_, defaultJSON) {
      $httpBackend = _$httpBackend_;
      $scope = $rootScope.$new();
      $httpBackend.when('GET','https://api.github.com/repositories').respond(defaultJSON.fakeData);
      controller = $controller('TestFourController', {
          $scope: $scope
      });
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

  it('initially has repos', function () {
    assert.isArray($scope.repos);
    assert.deepEqual($scope.repos, []);
  });

  it('clicking the button updates the repos', function () {
      $scope.loadRepos();
      $httpBackend.flush();
      assert.equal($scope.repos.length, 100);
  });

});
```

What's happening?

1. Essentially, here we're injecting `defaultJSON` so that when the app tries to make the HTTP request, it triggers `$httpBackend`, which, in turn, uses the `defaultJSON` value.
1. Did you notice the underscores surrounding the `$httpBackend` directive? This is a hack that allows us to use the dependency in multiple tests. You can find more information on this from the [official documentation](https://docs.angularjs.org/api/ngMock/function/angular.mock.inject).
1. Finally, we're using an `afterEach` block to check that we're not missing any HTTP requests in our tests via the `verifyNoOutstandingExpectation()` and `verifyNoOutstandingRequest()` methods. Again, you can read more about these methods from the [Angular docs](https://docs.angularjs.org/api/ngMock/service/$httpBackend).

Test it out!

### Routes

How about the routes, templates, and partials?

``` javascript
describe('routes', function(){

  beforeEach(function () {
    module('myApp');
  });

  beforeEach(inject(function (_$httpBackend_, _$route_, _$location_, $rootScope) {
    $httpBackend = _$httpBackend_;
    $route = _$route_;
    $location = _$location_;
    $scope = $rootScope.$new();
  }));

  it('should load the one.html template', function(){
    $httpBackend.whenGET('partials/one.html').respond('...');
    $scope.$apply(function() {
      $location.path('/one');
    });
    assert.equal($route.current.templateUrl, 'partials/one.html');
    assert.equal($route.current.controller, 'TestOneController');
  });

});
```

1. When the route is loaded, the `current` property is updated. We then test to ensure that the current controller and template are `TestOneController` and `partials/one.html`, respectively.
1. Did you notice that we wrapped the route change inside the `$apply` callback? Since unit tests don't run the full Angular app, we had to simulate it by triggering the [digest cycle](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$digest).
1. Curious about `WhenGET`? Check out the [Angular documentation](https://docs.angularjs.org/api/ngMock/service/$httpBackend). Take note of `ExpectGET` as well. Can you re-write the above test to use `ExpectGET`?

Make sure to run the tests one last time:

``` sh
$ gulp unit
[05:20:07] Using gulpfile ~/angular-testing-tutorial/Gulpfile.js
[05:20:07] Starting 'unit'...
INFO [karma]: Karma v0.12.31 server started at http://localhost:9876/
INFO [launcher]: Starting browser Chrome
INFO [Chrome 41.0.2272 (Mac OS X 10.10.2)]: Connected on socket R5qQUcjswAbpcvMK6JKu with id 67365006
Chrome 41.0.2272 (Mac OS X 10.10.2): Executed 12 of 12 SUCCESS (0.16 secs / 0.027 secs)
[05:20:10] Finished 'unit' after 3.44 s
```

## Conclusion

That's it for unit tests. In the next [part](http://mherman.org/blog/2015/04/26/testing-angularjs-with-protractor-and-karma-part-2), we'll test the entire application, front to back, using end-to-end (E2E) tests via Protractor.

Checkout the third tag, `v3`, to view all the completed unit tests:

``` sh
$ git checkout tags/v3
```

Ready for more?

Try adding some [Factories/Services](http://mherman.org/blog/2014/06/12/primer-on-angularjs-service-types/) and Filters to your app to continue practicing. Since the syntax is relatively the same for testing all parts of an Angular app, you should be able to extend your testing knowledge to both factories and filters. Take a look at this [example](https://github.com/mjhea0/thinkful-mentor/tree/master/angular/projects/angular-unit-test-demo/app/components) for help getting started. Once you feel comfortable with factories, controllers, and filters, move on to testing more difficult components, like directives, resources, and animations. Good luck!

Comment below with questions.
