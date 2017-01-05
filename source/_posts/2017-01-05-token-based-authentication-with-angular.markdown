---
layout: post
title: "Token-Based Authentication with Angular"
date: 2017-01-05 07:30:21 -0700
comments: true
categories: [angular]
keywords: "angular, angularjs, authentication, jwts, tokens"
description: "Here we look at how to add user authentication to Angular using JSON Web Tokens (JWTs)."
---

In the [Token-Based Authentication With Node](http://mherman.org/blog/2016/10/28/token-based-authentication-with-node) tutorial, we looked at how to add token-based authentication to a Node app using JSON Web Tokens (JWTs). *This time, we'll build out the client-side by showing how to add auth to Angular using JWTs.*

## Contents

1. Objectives
1. Review
1. Project Setup
1. Auth Component
1. Service
1. Server-side Setup
1. Sanity Check
1. Auth Login
1. Auth Register
1. LocalStorage
1. Route Restriction
1. What's Next?

## Objectives

By the end of this tutorial, you will be able to...

1. Discuss the benefits of using JWTs versus sessions and cookies
1. Discuss the overall client/server authentication workflow
1. Implement user authentication using JWTs with Angular

## Review

Before beginning, review the *Introduction* from [Token-Based Authentication With Node](http://mherman.org/blog/2016/10/28/token-based-authentication-with-node) so you have a solid understanding of what JWTs are and why you would want to use tokens over sessions for auth.

Make sure you can describe what's happening on the server-side as well. Review the code from the [node-token-auth](https://github.com/mjhea0/node-token-auth) repo, if necessary.

With that, here's the full user auth process:

1. Client logs in and the credentials are sent to the server
1. Server generates a token (if the credentials are correct)
1. Client receives and stores the token in local storage
1. Client then sends token to server on subsequent requests within the request header

## Project Setup

Start by cloning the project structure:

```sh
$ git clone https://github.com/mjhea0/angular-token-auth --branch v1 --single-branch -b master
```

Install the dependencies, and then fire up the app by running `gulp` to make sure all is well. Navigate to http://localhost:8888 in your browser and you should see:

```
Hello World
sanity check
```

Kill the server when done, and then glance over the code within the project folder:

```sh
├── README.md
├── gulpfile.js
├── package.json
└── src
    ├── css
    │   └── main.css
    ├── index.html
    └── js
        ├── app.js
        ├── components
        │   └── main
        │       ├── main.controller.js
        │       └── main.view.html
        └── config.js
```

All of the client-side code lives in the "src" folder and the Angular app can be found in the "js" folder. Make sure you understand the app structure before moving on.

> **NOTE:** This app uses Angular version [1.6.1](https://code.angularjs.org/1.6.1/docs/api).

This is optional, but it's a good idea to create a new Github repository and update the remote:

```sh
$ git remote set-url origin <newurl>
```

Now, let's wire up a new component...

## Auth Component

First, add the dependency to the setter array within *app.js*:

```javascript
angular
  .module('tokenAuthApp', [
    'ngRoute',
    'tokenAuthApp.config',
    'tokenAuthApp.components.main',
    'tokenAuthApp.components.auth'
  ]);
```

Create a new folder within "components" called "auth", and then add the following two files to that folder...

*auth.controller.js*:

```javascript
(function() {

  'use strict';

  angular
    .module('tokenAuthApp.components.auth', [])
    .controller('authLoginController', authLoginController);

  authLoginController.$inject = [];

  function authLoginController() {
    /*jshint validthis: true */
    const vm = this;
    vm.test = 'just a test';
  }

})();
```

*auth.login.view.html*:

```html
<h1>Login</h1>

<p>{% raw %}{{authLoginCtrl.test}}{% endraw %}</p>
```

Next, add the script tag to *index.html*, just before the closing body tag:

```html
<!-- auth component -->
<script type="text/javascript" src="js/components/auth/auth.controller.js"></script>
```

Add a new route handler to the *config.js* file:

{% raw %}
```javascript
function appConfig($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'js/components/main/main.view.html',
      controller: 'mainController'
    })
    .when('/login', {
      templateUrl: 'js/components/auth/auth.login.view.html',
      controller: 'authLoginController',
      controllerAs: 'authLoginCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
}
```
{% endraw %}

Run gulp, and then navigate to http://localhost:8888/#!/login. If all went well you should see the `just a test` text.

## Service

Next, let's create a global service to handle a user logging in, logging out, and signing up. Add a new file called *services.js* to the "js" directory:

```javascript
(function() {

  'use strict';

  angular
    .module('tokenAuthApp.services', [])
    .service('authService', authService);

  authService.$inject = [];

  function authService() {
    /*jshint validthis: true */
    this.test = function() {
      return 'working';
    };
  }

})();
```

Make sure to add it to the dependencies in *app.js*:

```javascript
angular
  .module('tokenAuthApp', [
    'ngRoute',
    'tokenAuthApp.config',
    'tokenAuthApp.components.main',
    'tokenAuthApp.components.auth',
    'tokenAuthApp.services'
  ]);
```

Add the script to the *index.html* file, below the config script:

```html
<script type="text/javascript" src="./js/services.js"></script>
```

### Sanity Check

Before adding code to `authService()`, let's make sure the service itself is wired up correctly. To do that, within *auth.controller.js* inject the service and call the `test()` method:

```javascript
authLoginController.$inject = ['authService'];

function authLoginController(authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.test = 'just a test';
  console.log(authService.test());
}
```

Run the server and then navigate to http://localhost:8888/#!/login. You should see `working` logged to the JS console.

### User Login

To handle logging a user in, update the `authService()` like so:

```javascript
authService.$inject = ['$http'];

function authService($http) {
  /*jshint validthis: true */
  const baseURL = 'http://localhost:3000/auth/';
  this.login = function(user) {
    return $http({
      method: 'POST',
      url: baseURL + 'login',
      data: user,
      headers: {'Content-Type': 'application/json'}
    });
  };
}
```

Here, we are using the `$http` service to send an AJAX request to the `/user/login` endpoint. This returns a promise object.

Make sure to remove `console.log(authService.test());` from the controller.

### User Registration

Registering a user is similar to logging a user in:

```javascript
this.register = function(user) {
  return $http({
    method: 'POST',
    url: baseURL + 'register',
    data: user,
    headers: {'Content-Type': 'application/json'}
  });
};
```

To test this we need to set up a back end...

## Server-side Setup

For the server-side, we'll use the finished project from the previous blog post, [Token-Based Authentication With Node](http://mherman.org/blog/2016/10/28/token-based-authentication-with-node/). You can view the code from the [node-token-auth](https://github.com/mjhea0/node-token-auth) repository.

> **NOTE:** Feel free to use your own server, just make sure to update the `baseURL` in the service.

Clone the project structure in a new terimal window:

```sh
$ git clone https://github.com/mjhea0/node-token-auth --branch v2 --single-branch -b master
```

Follow the directions in the [README](https://github.com/mjhea0/node-token-auth/blob/v2/README.md) to set up the project. Once done, run the server with `npm start`, which will listen on port 3000.

## Sanity Check

To test, update `authLoginController()` like so:

```javascript
function authLoginController(authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.test = 'just a test';
  const sampleUser = {
    username: 'michael',
    password: 'herman'
  };
  authService.register(sampleUser)
  .then((user) => {
    console.log(user.data);
  })
  .catch((err) => {
    console.log(err);
  });
  authService.login(sampleUser)
  .then((user) => {
    console.log(user.data);
  })
  .catch((err) => {
    console.log(err);
  });
}
```

In the browser, you should see the following errors in the console at http://localhost:8888/#!/login:

```
XMLHttpRequest cannot load http://localhost:3000/auth/register. Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://localhost:8888' is therefore not allowed access.
```

This is a [CORS issue](http://enable-cors.org/). To fix, we need to [update](http://enable-cors.org/server_expressjs.html) the server. Add the following code to *src/server/config/main-config.js*, just above `app.use(cookieParser());`:

```javascript
// *** cross domain requests *** //
const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
};

app.use(allowCrossDomain);
```

Refresh http://localhost:8888/#!/login in the browser and you should see a success in the console with the token:

```json
{
    "status": "success",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0ODQ2NzY4MjEsImlhdCI6MTQ4MzQ2NzIyMSwic3ViIjoyfQ.hMcrXz-63iD4jX-ves3cZMznSS3UhZD4NCPry2zLkHo"
}
```

## Auth Login

Update *auth.login.view.html*:

```html
<div class="row">
  <div class="col-md-4">
    <h1>Login</h1>
    <hr><br>
    <form ng-submit="authLoginCtrl.onLogin()" novalidate>
     <div class="form-group">
       <label for="username">Username</label>
       <input type="text" class="form-control" id="username" placeholder="enter username" ng-model="authLoginCtrl.user.username" required>
     </div>
     <div class="form-group">
       <label for="passwowrd">Password</label>
       <input type="password" class="form-control" id="passwowrd" placeholder="enter password" ng-model="authLoginCtrl.user.password" required>
     </div>
     <button type="submit" class="btn btn-default">Submit</button>
    </form>
  </div>
</div>
```

Take note of the form. We used the `ng-model` directive on each of the form inputs to capture those values in the controller. Also, when the form is submitted, the `ng-submit` directive handles the event by firing the `onLogin()` function.

Now, let's update the controller:

{% raw %}
```javascript
function authLoginController(authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.user = {};
  vm.onLogin = function() {
    authService.login(vm.user)
    .then((user) => {
      console.log(user.data);
    })
    .catch((err) => {
      console.log(err);
    });
  };
}
```
{% endraw %}

So, when the form is submitted, we capture the username and password and pass them to the `login()` method on the service.

Test this out.

## Auth Register

Just like the login, we need to add a view and controller for registering a user. Start by adding the view, *auth.register.view.html*, to the "auth" folder:

```html
<div class="row">
  <div class="col-md-4">
    <h1>Register</h1>
    <hr><br>
    <form ng-submit="authRegisterCtrl.onRegister()" novalidate>
     <div class="form-group">
       <label for="username">Username</label>
       <input type="text" class="form-control" id="username" placeholder="enter username" ng-model="authRegisterCtrl.user.username" required>
     </div>
     <div class="form-group">
       <label for="passwowrd">Password</label>
       <input type="password" class="form-control" id="passwowrd" placeholder="enter password" ng-model="authRegisterCtrl.user.password" required>
     </div>
     <button type="submit" class="btn btn-default">Submit</button>
    </form>
  </div>
</div>
```

Add a new controller to *auth.controller.js*:

```javascript
function authRegisterController(authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.user = {};
  vm.onRegister = function() {
    authService.register(vm.user)
    .then((user) => {
      console.log(user.data);
    })
    .catch((err) => {
      console.log(err);
    });
  };
}
```

Don't forget:

```javascript
angular
  .module('tokenAuthApp.components.auth', [])
  .controller('authLoginController', authLoginController)
  .controller('authRegisterController', authRegisterController);

authLoginController.$inject = ['authService'];
authRegisterController.$inject = ['authService'];
```

Add a new route handler to the *config.js* file:

```javascript
function appConfig($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'js/components/main/main.view.html',
      controller: 'mainController'
    })
    .when('/login', {
      templateUrl: 'js/components/auth/auth.login.view.html',
      controller: 'authLoginController',
      controllerAs: 'authLoginCtrl'
    })
    .when('/register', {
      templateUrl: 'js/components/auth/auth.register.view.html',
      controller: 'authRegisterController',
      controllerAs: 'authRegisterCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
}
```

Test it out by registering a new user!

## LocalStorage

Next, let's add the token to localStorage for persistence by replacing the `console.log(user.data);` with `localStorage.setItem('token', user.data.token);`:

```javascript
function authLoginController(authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.user = {};
  vm.onLogin = function() {
    authService.login(vm.user)
    .then((user) => {
      localStorage.setItem('token', user.data.token);
    })
    .catch((err) => {
      console.log(err);
    });
  };
}

function authRegisterController(authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.user = {};
  vm.onRegister = function() {
    authService.register(vm.user)
    .then((user) => {
      localStorage.setItem('token', user.data.token);
    })
    .catch((err) => {
      console.log(err);
    });
  };
}
```

As long as that token is present, the user can be considered logged in. And, when a user needs to make an AJAX request, that token can be used.

> **NOTE**: Besides the token, you could also add the user id and username. You would just need to update the server-side to send back that info.

Test this out. Ensure that the token is present in localStorage.

## User Status

To test out login persistence, we can add a new view that verifies that the user is logged in and that the token is valid.

Add the following method to `authService()`:

```javascript
this.ensureAuthenticated = function(token) {
  return $http({
    method: 'GET',
    url: baseURL + 'user',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  });
};
```

Take note of `Authorization: 'Bearer ' + token`. This is called a [Bearer schema](http://security.stackexchange.com/questions/108662/why-is-bearer-required-before-the-token-in-authorization-header-in-a-http-re), which is sent along with the request. On the server, we are simply checking for the `Authorization` header, and then whether the token is valid. Can you find this code on the server-side?

Then add a new file called *auth.status.view.html* to the "auth" folder:

```html
<div class="row">
  <div class="col-md-4">
    <h1>User Status</h1>
    <hr><br>
    <p>Logged In? {% raw %}{{ authStatusCtrl.isLoggedIn }}{% endraw %}</p>
  </div>
</div>
```


Add a new controller:

{% raw %}
```javascript
function authStatusController(authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.isLoggedIn = false;
  const token = localStorage.getItem('token');
  if (token) {
    authService.ensureAuthenticated(token)
    .then((user) => {
      if (user.data.status === 'success');
      vm.isLoggedIn = true;
    })
    .catch((err) => {
      console.log(err);
    });      
  }
}
```
{% endraw %}


And:

```javascript
angular
  .module('tokenAuthApp.components.auth', [])
  .controller('authLoginController', authLoginController)
  .controller('authRegisterController', authRegisterController)
  .controller('authStatusController', authStatusController);

authLoginController.$inject = ['authService'];
authRegisterController.$inject = ['authService'];
authStatusController.$inject = ['authService'];
```

Finally, update *config.js*:

```javascript
function appConfig($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'js/components/main/main.view.html',
      controller: 'mainController'
    })
    .when('/login', {
      templateUrl: 'js/components/auth/auth.login.view.html',
      controller: 'authLoginController',
      controllerAs: 'authLoginCtrl'
    })
    .when('/register', {
      templateUrl: 'js/components/auth/auth.register.view.html',
      controller: 'authRegisterController',
      controllerAs: 'authRegisterCtrl'
    })
    .when('/status', {
      templateUrl: 'js/components/auth/auth.status.view.html',
      controller: 'authStatusController',
      controllerAs: 'authStatusCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
}
```

Test this out at http://localhost:8888/#!/status:

* If there is a token in localStorage, you should see - `Logged In? true`
* Otherwise, you should see `Logged In? false`

Finally, let's redirect to the status page after a user successfully registers or logs in. Update the controllers like so:

```javascript
authLoginController.$inject = ['$location', 'authService'];
authRegisterController.$inject = ['$location', 'authService'];
authStatusController.$inject = ['authService'];

function authLoginController($location, authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.user = {};
  vm.onLogin = function() {
    authService.login(vm.user)
    .then((user) => {
      localStorage.setItem('token', user.data.token);
      $location.path('/status');
    })
    .catch((err) => {
      console.log(err);
    });
  };
}

function authRegisterController($location, authService) {
  /*jshint validthis: true */
  const vm = this;
  vm.user = {};
  vm.onRegister = function() {
    authService.register(vm.user)
    .then((user) => {
      localStorage.setItem('token', user.data.token);
      $location.path('/status');
    })
    .catch((err) => {
      console.log(err);
    });
  };
}
```

Test it out!

## Route Restriction

Right now, all routes are open; so, regardless of whether a user is logged in or not they, they can access each route. Certain routes should be restricted if a user is not logged in, while other routes should be restricted if a user is logged in:

1. `/` - no restrictions
1. `/login` - restricted when logged in
1. `/register` - restricted when logged in
1. `status` - restricted when not logged in

To achieve this, add the following property to each route, replacing `false` with `true` for routes that you want to restrict:

```javascript
restrictions: {
  ensureAuthenticated: false,
  loginRedirect: false
}
```

For example:

```javascript
function appConfig($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'js/components/main/main.view.html',
      controller: 'mainController',
      restrictions: {
        ensureAuthenticated: false,
        loginRedirect: false
      }
    })
    .when('/login', {
      templateUrl: 'js/components/auth/auth.login.view.html',
      controller: 'authLoginController',
      controllerAs: 'authLoginCtrl',
      restrictions: {
        ensureAuthenticated: false,
        loginRedirect: true
      }
    })
    .when('/register', {
      templateUrl: 'js/components/auth/auth.register.view.html',
      controller: 'authRegisterController',
      controllerAs: 'authRegisterCtrl',
      restrictions: {
        ensureAuthenticated: false,
        loginRedirect: true
      }
    })
    .when('/status', {
      templateUrl: 'js/components/auth/auth.status.view.html',
      controller: 'authStatusController',
      controllerAs: 'authStatusCtrl',
      restrictions: {
        ensureAuthenticated: true,
        loginRedirect: false
      }
    })
    .otherwise({
      redirectTo: '/'
    });
}
```

Next, add the following function below the route handlers in *config.js*:

```javascript
function routeStart($rootScope, $location, $route) {
  $rootScope.$on('$routeChangeStart', (event, next, current) => {
    if (next.restrictions.ensureAuthenticated) {
      if (!localStorage.getItem('token')) {
        $location.path('/login');
      }
    }
    if (next.restrictions.loginRedirect) {
      if (localStorage.getItem('token')) {
        $location.path('/status');
      }
    }
  });
}
```

The `$routeChangeStart` event fires before the actual route change occurs. So, whenever a route is accessed, we check the `restrictions` property:

1. If `ensureAuthenticated` is true and there is no token present, then we redirect them to the login page
1. If `loginRedirect` is true and there's a token present, then we redirect them to the status page

Simple, right?

Update:

```javascript
angular
  .module('tokenAuthApp.config', [])
  .config(appConfig)
  .run(routeStart);
```

Then test one last time.

## What's Next?

You've reached the end. Now what?

1. You should handle those errors in each `.catch`.
1. Check out [Satellizer](https://github.com/sahat/satellizer). It's a nice token-based auth module for Angular. You can find sample code in the following repos - [mean-token-auth](https://github.com/mjhea0/mean-token-auth) and [mean-social-token-auth](https://github.com/mjhea0/mean-social-token-auth).
1. Try using this app with a different back-end. Since this app is just the client, you can literally use any language/framework to write a RESTful API in.

Grab the final code from the [angular-token-auth](https://github.com/mjhea0/angular-token-auth) repo. Comment below. Cheers!
