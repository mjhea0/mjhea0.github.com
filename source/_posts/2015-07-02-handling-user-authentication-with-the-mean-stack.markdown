---
layout: post
toc: true
title: "Handling User Authentication with the MEAN Stack"
date: 2015-07-02 07:04
comments: true
categories: [angular, node]

keywords: "mean, web development, mongo, mongodb, express, expressjs, node, nodejs, angular, angularjs, authentication, login, mean stack"
description: "Here we look at how to handle user authentication with the MEAN stack."
---

<div style="text-align:center;">
  <img src="/images/mean-auth.png" style="max-width: 100%; border:0;" alt="mean stack authentication">
</div>

<br>

**This post provides a solution to the question, "How do I handle user authentication with the MEAN Stack - MongoDB, ExpressJS, AngularJS, and NodeJS?".**

> Much of this post is ported from [Handling User Authentication with Angular and Flask](https://realpython.com/blog/python/handling-user-authentication-with-angular-and-flask/) from [Real Python](https://realpython.com).

*Updates:*
- 02/28/2016: Updated to the latest versions of NodeJS, ExpressJS, MongoDB, and AngularJS; added a section on persistant logins.

Keep in mind that this solution posed in this tutorial is not the *only* solution to the question at hand, and it may not even be the *right* solution for your situation. Regardless of the solution you implement, it is important to note that since end users have full control of the browser as well as access to the front-end code, sensitive data living in your server-side API must be secure. *In other words, make certain that you implement an authentication strategy on the server-side to protect sensitive API endpoints.*

That said, we need to enable the following workflow:

1. When the client accesses the main route, an index page is served, at which point Angular takes over.
1. The Angular app immediately "asks" the server if a user is logged in.
1. Assuming the server indicates that a user is not logged in, the client is immediately asked to log in.
1. Once logged in, the Angular app then tracks the user's login status.

> This tutorial uses [NodeJS](https://nodejs.org/) v4.3.1, [ExpressJS](http://expressjs.com/4x/api.html) v4.13.4, [MongoDB](https://docs.mongodb.org/v3.2/) v3.2.3, and [AngularJS](https://code.angularjs.org/1.4.9/docs/guide) v1.4.9. For a full list of dependencies, please view the *[package.json](https://github.com/mjhea0/mean-auth/blob/master/package.json)* file.

## Getting Started

First, grab the boilerplate code from the [project repo](https://github.com/mjhea0/mean-auth/releases/tag/v1), install the requirements, and then test out the app:

```sh
$ npm start
```

Navigate to [http://localhost:3000/](http://localhost:3000/) and you should see a simple welcome message - "Yo!". Once you're finishing admiring the page, kill the server, and glance over the code within the project folder:

```sh
├── client
│   ├── index.html
│   ├── main.js
│   └── partials
│       └── home.html
├── package.json
└── server
    ├── app.js
    ├── models
    │   └── user.js
    ├── routes
    │   └── api.js
    └── server.js
```

Nothing too spectacular. You can see that the back-end code resides in the "server" folder, while the front-end code lives in the "client" folder. Explore the files and folders within each.

## Login API

Let's start with the back-end API. This is already built out, for your convenience. Why? The focus of this tutorial is mainly on the client-side. If you're looking for a back-end tutorial for setting up Passport with NodeJS, ExpressJS, and MongoDB take a look at this [tutorial](http://mherman.org/blog/2015/01/31/local-authentication-with-passport-and-express-4/#.VZCK9xNViko).

### User Registration

Open the "routes" folder and locate the following code:

```javascript
router.post('/register', function(req, res) {
  User.register(new User({ username: req.body.username }),
    req.body.password, function(err, account) {
    if (err) {
      return res.status(500).json({
        err: err
      });
    }
    passport.authenticate('local')(req, res, function () {
      return res.status(200).json({
        status: 'Registration successful!'
      });
    });
  });
});
```

Here, we grab the values from the payload sent with the POST request (from the client-side), create a new `User` instance, and then attempt to add the instance to the database. If this succeeds a user is added, of course, and then we return a JSON response with a `status` of "success". If it fails, an "error" response is sent.

Let's test this via curl. Fire up the server, and then run the following command:

```sh
$ curl -H "Accept: application/json" -H \
"Content-type: application/json" -X POST \
-d '{"username": "test@test.com", "password": "test"}' \
http://localhost:3000/user/register
```

You should see a success message:

```sh
{
  "status": "Registration successful!"
}
```

Try it again, with the exact same username and password, and you should see an error:

```sh
{
  "err": {
    "name": "UserExistsError",
    "message": "A user with the given username is already registered"
  }
}
```

On to the login...

### User Login

```javascript
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
      res.status(200).json({
        status: 'Login successful!'
      });
    });
  })(req, res, next);
});
```

This utilizes Passport's [local strategy](https://github.com/jaredhanson/passport-local) to verify the username/email as well as the password. The appropriate response is then returned.

With the server running, test again with curl-

```sh
curl -H "Accept: application/json" -H \
"Content-type: application/json" -X POST \
-d '{"username": "test@test.com", "password": "test"}' \
http://localhost:3000/user/login
```

-and you should see:

```sh
{
  "message": "Login successful!"
}
```

Test again with curl, sending the wrong password, and you should see:

```sh
{
  "err": {
    "name": "IncorrectPasswordError",
    "message": "Password or username are incorrect"
  }
}
```

Perfect!

### User Logout

Finally, take a look at the logout:

```javascript
router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});
```

This should be straightforward, and you can probably guess what the response will look like - but let's test it again to be sure:

```sh
$ curl -H "Accept: application/json" -H \
"Content-type: application/json" -X GET \
http://localhost:3000/user/logout
```

You should see:

```sh
{
  "status": "Bye!"
}
```

On to the client-side!

## Angular App

Before diving in, remember that since end users have full access to the power of the browser as well as [DevTools](https://developer.chrome.com/devtools) and the client-side code, it's vital that you not only restrict access to sensitive endpoints on the server-side - but that you also do not store sensitive data on the client-side. Keep this in mind as you add auth functionality to your own MEAN application stack.

### Client-side Routing

Let's add the remainder of the client-side routes to the *main.js* file:

```javascript
myApp.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/home.html'
    })
    .when('/login', {
      templateUrl: 'partials/login.html',
      controller: 'loginController'
    })
    .when('/logout', {
      controller: 'logoutController'
    })
    .when('/register', {
      templateUrl: 'partials/register.html',
      controller: 'registerController'
    })
    .when('/one', {
      template: '<h1>This is page one!</h1>'
    })
    .when('/two', {
      template: '<h1>This is page two!</h1>'
    })
    .otherwise({
      redirectTo: '/'
    });
});
```

Here, we created five new routes. Before we add the subsequent templates and controllers, let's create a [service](https://code.angularjs.org/1.4.9/docs/guide/services) to handle authentication.

### Authentication Service

Start by adding the basic structure of the service to a new file called *services.js* in the "client" directory:

```javascript
angular.module('myApp').factory('AuthService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    // create user variable
    var user = null;

    // return available functions for use in the controllers
    return ({
      isLoggedIn: isLoggedIn,
      getUserStatus: getUserStatus,
      login: login,
      logout: logout,
      register: register
    });

}]);
```

Here, we simply defined the service name, `AuthService`, and then injected the dependencies that we will be using - `$q`, `$timeout`, `$http` - and then returned the functions, which we still need to write, for use outside the service.

Make sure to add the script to the *index.html* file:

```html
<script src="./services.js"></script>
```

Let's create each function...

**`isLoggedIn()`**

```javascript
function isLoggedIn() {
  if(user) {
    return true;
  } else {
    return false;
  }
}
```

This function returns `true` if `user` evaluates to `true` - a user is logged in - otherwise it returns false.

**`getUserStatus()`**

```javascript
function getUserStatus() {
  return user;
}
```

**`login()`**

```javascript
function login(username, password) {

  // create a new instance of deferred
  var deferred = $q.defer();

  // send a post request to the server
  $http.post('/user/login',
    {username: username, password: password})
    // handle success
    .success(function (data, status) {
      if(status === 200 && data.status){
        user = true;
        deferred.resolve();
      } else {
        user = false;
        deferred.reject();
      }
    })
    // handle error
    .error(function (data) {
      user = false;
      deferred.reject();
    });

  // return promise object
  return deferred.promise;

}
```

Here, we used the [$q](https://code.angularjs.org/1.4.9/docs/api/ng/service/$q) service to set up a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), which we'll access in a future controller. We also utilized the [$http](https://code.angularjs.org/1.4.9/docs/api/ng/service/$http) service to send an AJAX request to the `/user/login` endpoint that we already set up in our back-end Node/Express app.

Based on the returned response, we either [resolve](https://code.angularjs.org/1.4.9/docs/api/ng/service/$q#usage) or [reject](https://code.angularjs.org/1.4.9/docs/api/ng/service/$q#usage) and set the value of `user` to `true` or `false`, respectively.

**`logout()`**

```javascript
function logout() {

  // create a new instance of deferred
  var deferred = $q.defer();

  // send a get request to the server
  $http.get('/user/logout')
    // handle success
    .success(function (data) {
      user = false;
      deferred.resolve();
    })
    // handle error
    .error(function (data) {
      user = false;
      deferred.reject();
    });

  // return promise object
  return deferred.promise;

}
```

Here, we followed the same formula as the `login()` function, except we sent a GET request rather than a POST and to be safe we just went ahead and handled the error the same as the success.

**`register()`**

```javascript
function register(username, password) {

  // create a new instance of deferred
  var deferred = $q.defer();

  // send a post request to the server
  $http.post('/user/register',
    {username: username, password: password})
    // handle success
    .success(function (data, status) {
      if(status === 200 && data.status){
        deferred.resolve();
      } else {
        deferred.reject();
      }
    })
    // handle error
    .error(function (data) {
      deferred.reject();
    });

  // return promise object
  return deferred.promise;

}
```

Again, we followed a similar formula to the `logout()` function. Can you tell what's happening?

That's it for the service. Keep in mind that we still have not "used" this service. In order to do that we just need to inject it into the necessary components in the Angular app. In our case, that will be the controllers, which we'll build next.

### Templates and Controllers

Looking back at our routes, we need to setup two partials/templates and three controllers:

```javascript
.when('/login', {
  templateUrl: 'partials/login.html',
  controller: 'loginController'
})
.when('/logout', {
  controller: 'logoutController'
})
.when('/register', {
  templateUrl: 'partials/register.html',
  controller: 'registerController'
})
```

**Login**

First, add the following HTML to a new file called *login.html*:

```html
<div class="col-md-4">
  <h1>Login</h1>
  <div ng-show="error" class="alert alert-danger">{% raw %}{{errorMessage}}{% endraw %}</div>
  <form class="form" ng-submit="login()">
    <div class="form-group">
      <label>Username</label>
      <input type="text" class="form-control" name="username" ng-model="loginForm.username" required>
    </div>
    <div class="form-group">
      <label>Password</label>
        <input type="password" class="form-control" name="password" ng-model="loginForm.password" required>
      </div>
      <div>
        <button type="submit" class="btn btn-default" ng-disabled="disabled">Login</button>
      </div>
  </form>
</div>
```

Add this file to the "partials" directory.

Take note of the form. We used the [ng-model](https://code.angularjs.org/1.4.9/docs/api/ng/directive/ngModel) directive on each of the inputs so that we can capture those values in the controller. Also, when the form is submitted, the [ng-submit](https://code.angularjs.org/1.4.9/docs/api/ng/directive/ngSubmit) directive handles the event by firing the `login()` function.

Next, within the "client" folder, add a new file called *controllers.js*. Yes, this will hold all of our Angular app's controllers. Don't forget to add the script to the *index.html* file:

```html
<script src="./controllers.js"></script>
```

Now, let's add the first controller:

```javascript
angular.module('myApp').controller('loginController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.login = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call login from service
      AuthService.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function () {
          $location.path('/');
          $scope.disabled = false;
          $scope.loginForm = {};
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "Invalid username and/or password";
          $scope.disabled = false;
          $scope.loginForm = {};
        });

    };

}]);
```

So, when the `login()` function is fired, we set some initial values and then call `login()` from the `AuthService`, passing the user inputed email and password as arguments. The subsequent success or error is then handled and the DOM/view/template is updated appropriately.

Ready to test the first round-trip - **client => server => client**?

Fire up the server and navigate to [http://localhost:3000/#/login](http://localhost:3000/#/login) in your browser. First, try logging in with the user credentials used to register earlier - e.g, `test@test.com` and `test`, respectively. If all went well, you should be redirected to the main URL. Next, try to log in using invalid credentials. You should see the error message flash, "Invalid username and/or password".

**Logout**

Add the controller:

```javascript
angular.module('myApp').controller('logoutController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.logout = function () {

      // call logout from service
      AuthService.logout()
        .then(function () {
          $location.path('/login');
        });

    };

}]);
```

Here, we called `AuthService.logout()` and then redirected the user to the `/login` route after the promise is resolved.

Add a button to *home.html*:

```html
<div ng-controller="logoutController">
  <a ng-click='logout()' class="btn btn-default">Logout</a>
</div>
```

And then test it out again.

**Register**

Add a new new file called *register.html* to the "partials" folder and add the following HTML:

```html
<div class="col-md-4">
  <h1>Register</h1>
  <div ng-show="error" class="alert alert-danger">{% raw %}{{errorMessage}}{% endraw %}</div>
  <form class="form" ng-submit="register()">
    <div class="form-group">
      <label>Username</label>
      <input type="text" class="form-control" name="username" ng-model="registerForm.username" required>
    </div>
    <div class="form-group">
      <label>Password</label>
        <input type="password" class="form-control" name="password" ng-model="registerForm.password" required>
      </div>
      <div>
        <button type="submit" class="btn btn-default" ng-disabled="disabled">Register</button>
      </div>
  </form>
</div>
```

Next, add the controller:

```javascript
angular.module('myApp').controller('registerController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.register = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call register from service
      AuthService.register($scope.registerForm.username, $scope.registerForm.password)
        // handle success
        .then(function () {
          $location.path('/login');
          $scope.disabled = false;
          $scope.registerForm = {};
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "Something went wrong!";
          $scope.disabled = false;
          $scope.registerForm = {};
        });

    };

}]);
```

You've seen this before, so let's move right on to testing.

Fire up the server and register a new user at [http://localhost:3000/#/register](http://localhost:3000/#/register). Make sure to test logging in with that new user as well.

Well, that's it for the templates and controllers. We now need to add in functionality to check if a user is logged in on each and every change of route.

### Route Changes

Start by adding the following code to *main.js*:

```javascript
myApp.run(function ($rootScope, $location, $route, AuthService) {
  $rootScope.$on('$routeChangeStart',
    function (event, next, current) {
    if (AuthService.isLoggedIn() === false) {
      $location.path('/login');
    }
  });
});
```

The [$routeChangeStart](https://code.angularjs.org/1.4.9/docs/api/ngRoute/service/$route) event fires before the actual route change occurs. So, whenever a route is accessed, before the view is served, we ensure that the user is logged in. Test this out!

## Route Restriction

Right now all client-side routes require a user to be logged in. What if you want certain routes restricted and other routes open?

You can add the following code to each route handler, replacing `true` with `false` for routes that you do not want to restrict:

```javascript
access: {restricted: true}
```

For example:

```javascript
myApp.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/home.html',
      access: {restricted: true}
    })
    .when('/login', {
      templateUrl: 'partials/login.html',
      controller: 'loginController',
      access: {restricted: false}
    })
    .when('/logout', {
      controller: 'logoutController',
      access: {restricted: true}
    })
    .when('/register', {
      templateUrl: 'partials/register.html',
      controller: 'registerController',
      access: {restricted: true}
    })
    .when('/one', {
      template: '<h1>This is page one!</h1>',
      access: {restricted: true}
    })
    .when('/two', {
      template: '<h1>This is page two!</h1>',
      access: {restricted: false}
    })
    .otherwise({
      redirectTo: '/'
    });
});
```

Now just update the `$routeChangeStart` code in *main.js*:

```javascript
myApp.run(function ($rootScope, $location, $route, AuthService) {
  $rootScope.$on('$routeChangeStart',
  function (event, next, current) {
    if (next.access.restricted && AuthService.isLoggedIn() === false) {
      $location.path('/login');
      $route.reload();
    }
  });
});
```

Test it out!

## Persistant Login

Finally, what happens on a page refresh? Try it.

The user is logged out, right? Why? Because the controller and services are called again, setting the `user` variable to `null`. This is a problem since the user is still logged in on the server side.

Fortunately, the fix is simple: Within the `$routeChangeStart` we need to ALWAYS check if a user is logged in. Right now, it's checking whether `isLoggedIn()` is `false`. Let's update `getUserStatus()` so that it checks the user status on the back-end:

```javascript
function getUserStatus() {
  $http.get('/user/status')
  // handle success
  .success(function (data) {
    if(data.status){
      user = true;
    } else {
      user = false;
    }
  })
  // handle error
  .error(function (data) {
    user = false;
  });
}
```

Then add the route handler:

```javascript
router.get('/status', function(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      status: false
    });
  }
  res.status(200).json({
    status: true
  });
});
```

Finally, update the `$routeChangeStart`:

```javascript
myApp.run(function ($rootScope, $location, $route, AuthService) {
  $rootScope.$on('$routeChangeStart',
    function (event, next, current) {
      AuthService.getUserStatus();
      if (next.access.restricted &&
          !AuthService.isLoggedIn()) {
        $location.path('/login');
        $route.reload();
      }
  });
});
```

Try it out!

## Conclusion

That's it. One thing you should note is that the Angular app can be used with various frameworks as long as the endpoints are set up correctly in the AJAX requests. So, you can easily take the Angular portion and add it to your Django or Pyramid or NodeJS app. Try it!

> Check out a Python/Flask app with Angular Auth [here](https://realpython.com/blog/python/handling-user-authentication-with-angular-and-flask/)

Grab the final code from the [repo](https://github.com/mjhea0/mean-auth). Cheers!
