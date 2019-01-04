---
layout: post
title: "Authentication in Angular with NGRX"
date: 2018-04-17 08:00:00
comments: true
toc: true
categories: [angular, auth]
keywords: "angular, javascript, authentication, auth, ngrx, ngrx store, ngrx effects"
description: "This tutorial demonstrates how to add authentication to Angular using NGRX Store and Effects."
redirect_from:
  - /blog/2018/04/17/authentication-in-angular-with-ngrx/
---

In this tutorial, we'll add authentication to Angular using [NGRX](https://github.com/ngrx/platform) Store and Effects.

> This post assumes that you a have basic working knowledge of [Angular](https://angular.io/) (2+), [TypeScript](https://www.typescriptlang.org/), [RxJS](http://reactivex.io/rxjs/) and the [Redux](https://redux.js.org/) design pattern. If you're new to [NGRX](http://ngrx.github.io/), check out the awesome [Comprehensive Introduction to @ngrx/store](https://gist.github.com/btroncone/a6e4347326749f938510) guide.

*Dependencies*:

1. Angular CLI v1.7.3 (Angular v5.2.0)
1. Node v9.11.0
1. NGRX Store v5.2.0
1. NGRX Effects v5.2.0

*Final app*:

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:10px">
  <img src="/assets/img/blog/angular-auth-ngrx/final-app.gif" style="max-width: 70%;border:0;box-shadow:none;" alt="final app">
</div>

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Objectives

By the end of this tutorial, you will be able to...

1. Develop a fully-functioning Angular app with authentication
1. Discuss the benefits and drawbacks of using token-based authentication
1. Implement user authentication with tokens
1. Utilize NGRX Store for state management
1. Isolate and manage side effects with NGRX Effects
2. Set up an HTTP Interceptor to hijack outgoing requests and incoming responses
1. Configure route-based authorization with route guards

## Token-based Authentication

With token-based Authentication, users send their credentials to an authentication server to obtain a signed token. The client then stores this token locally, usually in localStorage or in a cookie. Every subsequent call to the server, for a protected resource, includes that signed token that the server then verifies before granting access to the desired resource.

**Benefits:**

1. *Stateless*: Since the token contains all information required for the server to verify a user's identity, scaling is easier as we don't need to worry about maintaining a session store on the server-side.
1. *Single Sign On*: After a token is generated, you can have your users access a number of different resources and services without having to prompt them for their login credentials.

**Drawbacks:**

1. *Cross-site Scripting (XSS) attacks*: Storing tokens in either local or session storage can lead to XSS attacks. Because of this, it's a good idea to store tokens in a cookie with `httpOnly` and `secure` flags.

> Although we won't be covering server-side token creation in this post, it's worth noting that a [JSON Web Token](https://jwt.io/) is a popular standard for creating tokens. Just keep in mind that since a JWT is [signed rather than encrypted](https://stackoverflow.com/questions/454048/what-is-the-difference-between-encrypting-and-signing-in-asymmetric-encryption) it should never contain sensitive information like a user's password.

With that, here’s the full user auth process:

1. End user sends their credentials to the server
1. Server verifies the credentials and, if correct, generates a token, which is then passed back to the client
1. Client stores the token in localStorage or in a cookie
1. Client sends the token alongside any subsequent requests to the server

For more on token-based auth, along with the pros and cons of using it vs. session-based auth, please review the following articles:

1. [Cookies vs Tokens: The Definitive Guide](https://dzone.com/articles/cookies-vs-tokens-the-definitive-guide)
1. [Token Authentication vs. Cookies](https://stackoverflow.com/questions/17000835/token-authentication-vs-cookies)

## Project Setup

Begin by installing the Angular CLI globally, if you don't already have it:

```sh
$ npm install -g @angular/cli@1.7.3
```

Then, create a new Angular project:

```sh
$ ng new angular-auth-ngrx
$ cd angular-auth-ngrx
```

Run the server:

```sh
$ ng serve
```

Then, in your browser of choice, navigate to [http://localhost:4200](http://localhost:4200). You should see the "Welcome to app!" message along with the Angular logo in the browser.

Kill the server. Then, install [Bootstrap](http://getbootstrap.com/):

```sh
$ npm install bootstrap@4.1.0 --save
```

After installation, update the styles configuration in the *.angular-cli.json* file at the project root:

```json
"styles": [
  "../node_modules/bootstrap/dist/css/bootstrap.min.css",
  "styles.css"
],
```

Add a [container](https://getbootstrap.com/docs/4.0/layout/overview/#containers) to the *src/index.html* page:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AngularAuthNgrx</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <div class="container">
    <app-root></app-root>
  </div>
</body>
</html>
```

Run the server again to view the updated styles:

![bootstrap welcome](/assets/img/blog/angular-auth-ngrx/bootstrap-welcome.png)

## Routing and Components

Next, let's add three components and configure some basic routes:

| Component | Purpose                       | Route      |
|-----------|-------------------------------|------------|
| `Landing` | Landing page                  | `/`        |
| `LogIn`   | Authenticating existing users | `/log-in`  |
| `SignUp`  | Registering new users         | `/sign-up` |

Start by generating the components:

```sh
$ ng generate component components/landing
$ ng generate component components/sign-up
$ ng generate component components/log-in
```

Next, add the [RouterModule](https://angular.io/api/router/RouterModule) import to the *app.module.ts* file:

```typescript
import { RouterModule } from '@angular/router';
```

Add the following route configuration, to the `imports` array, to map each of the components we just created to a URL:

```typescript
RouterModule.forRoot([
  { path: 'log-in', component: LogInComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: '', component: LandingComponent },
  { path: '**', redirectTo: '/' }
])
```

Your *app.module.ts* should now look like:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    SignUpComponent,
    LogInComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: 'log-in', component: LogInComponent },
      { path: 'sign-up', component: SignUpComponent },
      { path: '', component: LandingComponent },
      { path: '**', redirectTo: '/' }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Fire up the server and test each URL in the browser:

1. [http://localhost:4200](http://localhost:4200)
1. [http://localhost:4200/log-in](http://localhost:4200/log-in)
1. [http://localhost:4200/sign-up](http://localhost:4200/sign-up)
1. [http://localhost:4200/notreal](http://localhost:4200/notreal)

We know that the routes are configured correctly since `/notreal` redirects to `/` (and renders the `LandingComponent`) while `/log-in` and `/sign-up` work just fine. Now, we still need to use the `RouterOutlet` [directive](https://angular.io/api/router/RouterOutlet) to tell Angular where to insert each of our HTML templates.

Replace the contents of the *app.component.html* file with the `<router-outlet>` tag:

```html
<router-outlet></router-outlet>
```

Run the app again. Make sure you are shown the correct component when you visit each of the URLs in the browser.

Finally, update *src/app/components/landing/landing.component.html*:

```ng2
<div class="row">
  <div class="col-md-4">
    <h1>Angular + NGRX</h1>
    <hr><br>
    <a [routerLink]="['/log-in']" class="btn btn-primary">Log in</a>
    <a [routerLink]="['/sign-up']" class="btn btn-primary">Sign up</a>
  </div>
</div>
```

<div style="text-align:left;padding-top:10px;padding-left:10px;">
  <img src="/assets/img/blog/angular-auth-ngrx/landing.png" style="max-width: 70%;border:0;box-shadow:none;" alt="landing component">
</div>

And, with that, we're ready to start adding authentication!

## Workflow

### Configure Forms

1. Add form to the `SignUpComponent`
1. Define the `User` Model
1. Add form to the `LogInComponent`

### NGRX Store

1. Install NGRX Store
1. Add files and folders for the actions and reducers
1. Define the state

### Configure Auth Service

1. Spin up the fake back-end server
1. Add a service

### NGRX Effects

1. Install NGRX Effects
1. Add effects file

### Configure Login

1. Login
    - Dispatch `LogIn` action
    - Add action
    - Add effect (to dispatch either `LogInSuccess` or `LogInFailure`)
1. Login Success
    - Add action
    - Add reducer (to create new state)
    - Add effect (to add token to localStorage and redirect user)
1. Login Failure
    - Add action
    - Add reducer (to create new state)
    - Add effect

### Configure Signup

1. Signup
    - Dispatch `SignUp` action
    - Add action
    - Add effect (to dispatch either `SignUpSuccess` or `SignUpFailure`)
1. Signup Success
    - Add action
    - Add reducer (to create new state)
    - Add effect (to add token to localStorage and redirect user)
1. Signup Failure
    - Add action
    - Add reducer (to create new state)
    - Add effect

### Configure Logout

1. Logout
    - Dispatch `LogIn` action
    - Add action
    - Add reducer (to create new state)
    - Add effect (to remove token from localStorage)

### Update the Templates

1. Add error messages to the forms
    - Update the components
    - Add messages to the templates

1. Update the `LandingComponent`

### Add HTTP Interceptor

1. Configure the interceptor
1. Handle unauthorized responses
1. Add new route

### Route Guard

1. Configure the interface
1. Protect the route

Let's get to it!

## Configure Forms

### Add form to the `SignUpComponent`

Start with the template:

```
<div class="row">
  <div class="col-md-4">
    <h1>Sign up</h1>
    <hr><br>
    <form (ngSubmit)="onSubmit()" ngNativeValidate>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          [(ngModel)]="user.email"
          name="email"
          type="email"
          required
          class="form-control"
          id="email"
          placeholder="enter your email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          [(ngModel)]="user.password"
          name="password"
          type="password"
          required
          class="form-control"
          id="password"
          placeholder="enter a password">
      </div>
      <button type="submit" class="btn btn-primary">Submit</button>
      <a [routerLink]="['/']" class="btn btn-success">Cancel</a>
    </form>
    <p>
      <span>Already have an account?&nbsp;</span>
      <a [routerLink]="['/log-in']">Log in!</a>
    </p>
  </div>
</div>
```

Since Angular now automatically adds a `novalidate` attribute to forms, we used the `ngNativeValidate` [directive](https://github.com/angular/angular/blob/master/packages/forms/src/directives/ng_no_validate_directive.ts) to turn the browser's native form validation back on.

> Feel free to use Angular's [form validation](https://angular.io/guide/form-validation).

Then, wire up the component itself:

```typescript
import { Component, OnInit } from '@angular/core';

import { User } from '../../models/user';


@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {

  user: User = new User();

  constructor() { }

  ngOnInit() {
  }

  onSubmit(): void {
    console.log(this.user);
  }

}
```

Add the `FormsModule` to *app.module.ts*:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    SignUpComponent,
    LogInComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([
      { path: 'log-in', component: LogInComponent },
      { path: 'sign-up', component: SignUpComponent },
      { path: '', component: LandingComponent },
      { path: '**', redirectTo: '/' }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Run the application. The app should fail to build, and you should see the following error in the terminal since the `User` model does not exist:

```sh
ERROR in src/app/components/sign-up/sign-up.component.ts(3,22): error TS2307:
Cannot find module '../../models/user'.
```

Kill the server.

### Define the `User` Model

Moving along, let's generate a new model class:

```sh
$ ng generate class models/user
```

Then update *src/app/models/user.ts*:

```typescript
export class User {
  id?: string;
  email?: string;
  password?: string;
  token?: string;
}
```

Run the server again. The app should compile just fine and the terminal should be error-free. Try submitting the form. You should see the user model logged to the JavaScript Console:

<div style="text-align:left;padding-top:10px;padding-left:10px;">
  <img src="/assets/img/blog/angular-auth-ngrx/signup.png" style="max-width: 70%;border:0;box-shadow:none;" alt="signup component">
</div>

### Add form to the `LogInComponent`

Again, start with the template:

```
<div class="row">
  <div class="col-md-4">
    <h1>Log in</h1>
    <hr><br>
    <form (ngSubmit)="onSubmit()" ngNativeValidate>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          [(ngModel)]="user.email"
          name="email"
          type="email"
          required
          class="form-control"
          id="email"
          placeholder="enter your email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          [(ngModel)]="user.password"
          name="password"
          type="password"
          required
          class="form-control"
          id="password"
          placeholder="enter a password">
      </div>
      <button type="submit" class="btn btn-primary">Submit</button>
      <a [routerLink]="['/']" class="btn btn-success">Cancel</a>
    </form>
    <p>
      <span>Don't have an account?&nbsp;</span>
      <a [routerLink]="['/sign-up']">Sign up!</a>
    </p>
  </div>
</div>
```

Then, update the `LogInComponent` itself:

```typescript
import { Component, OnInit } from '@angular/core';

import { User } from '../../models/user';


@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css']
})
export class LogInComponent implements OnInit {

  user: User = new User();

  constructor() { }

  ngOnInit() {
  }

  onSubmit(): void {
    console.log(this.user);
  }

}
```

Test it out! Like the sign up form, you should see the user model logged to the JavaScript Console.

With that, let's move on to NGRX!

## NGRX Store

### Install NGRX Store

State management is difficult. As your application scales, state generally scatters across your application, tucked away in various nooks and crannies. Although it's not an issue yet, it's a good idea to set a solid foundation to help ensure that, going forward, state management is easier and more predictable. This is where [NGRX Store](https://github.com/ngrx/platform/blob/master/docs/effects/README.md) comes into play. It helps to solve this problem by managing state in a single, immutable data store.

[Core tenets](https://github.com/ngrx/platform/blob/master/docs/store/README.md):

1. State is a single immutable data structure
1. Actions describe state changes
1. Pure functions called reducers take the previous state and the next action to compute the new state
1. State accessed with the Store, an observable of state and an observer of actions

In a nutshell, NGRX Store builds on Redux's core patterns by adding in RxJS. It's specifically designed for Angular apps.

Building blocks:

1. *Store* - single, immutable data structure
1. *Actions* - describe changes to state
1. *Reducers* - pure functions that create a new state

Example:

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px;">
  <img src="/assets/img/blog/angular-auth-ngrx/angular-ngrx-store-flow.png" style="max-width:90%;border:0;box-shadow:none;" alt="angular ngrx store flow">
</div>

Install:

```sh
$ npm install @ngrx/store@5.2.0 --save
```

### Add files and folders for the actions and reducers

Next, we need to add a bit of structure for the actions and reducers. Within "src/app", add a new folder called "store". Then, add the following folders to "store":

1. "actions"
1. "reducers"

Add a file called *app.states.ts* as well. Finally, add a single file to each folder:

1. *auth.actions.ts*
1. *auth.reducers.ts*

You should now have:

```sh
└── store
    ├── actions
    │   └── auth.actions.ts
    ├── app.states.ts
    └── reducers
        └── auth.reducers.ts
```

> You could also group actions and reducers by domain. Actions and reducers would live at the component level, in other words. If you decide to go that route, you should probably create a "common" folder for actions and reducers that are used across a number of components. Auth actions and reducers should then live in "common".

### Define the state

Before creating any actions or reducers, let's define structure of the store in *src/app/store/reducers/auth.reducers.ts*:

```typescript
import { User } from '../../models/user';


export interface State {
  // is a user authenticated?
  isAuthenticated: boolean;
  // if authenticated, there should be a user object
  user: User | null;
  // error message
  errorMessage: string | null;
}
```

> Remember: State is a single, immutable data structure.

Also, add an `initialState` object:

```typescript
export const initialState: State = {
  isAuthenticated: false,
  user: null,
  errorMessage: null
};
```

Then, define the top-level state interface in *src/app/store/app.states.ts*:

```typescript
import * as auth from './reducers/auth.reducers';


export interface AppState {
  authState: auth.State;
}
```

This is a map of keys to the inner state types.

## Configure Auth Service

### Spin up the fake back-end server

In this section we'll spin up a fake back-end that the client can communicate with. The app itself is a basic Node/Express application with the following routes:

| URL                            | HTTP Verb | Action              |
|--------------------------------|-----------|---------------------|
| http://localhost:1337/ping     | GET       | Sanity Check        |
| http://localhost:1337/register | POST      | Register a new user |
| http://localhost:1337/login    | POST      | Log a user in       |
| http://localhost:1337/status   | GET       | Get user status     |

> Just keep in mind that the back-end does **not** create a real [JSON Web Token](https://en.wikipedia.org/wiki/JSON_Web_Token) (JWT). Feel free to swap it out for a working back-end or use the final application from the [Token-Based Authentication with Node](http://mherman.org/blog/2016/10/28/token-based-authentication-with-node) blog post, if you'd like.

Within a new terminal window, clone down the repo, install the dependencies, and spin up the app:

```sh
$ git clone https://github.com/testdrivenio/fake-token-api
$ cd fake-token-api
$ npm install
$ npm start
```

In your browser, [http://localhost:1337/ping](http://localhost:1337/ping) should return `"pong!"`.

### Add the service

Back in Angular land, we need to wire up a service that's responsible for making API calls to the fake back-end:

```sh
$ ng generate service services/auth
```

Add the service as a provider in the `@NgModule` definition and import the `HttpClientModule`:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { AuthService } from './services/auth.service';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    SignUpComponent,
    LogInComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot([
      { path: 'log-in', component: LogInComponent },
      { path: 'sign-up', component: SignUpComponent },
      { path: '', component: LandingComponent },
      { path: '**', redirectTo: '/' }
    ])
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Add the following methods to the service:

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { User } from '../models/user';


@Injectable()
export class AuthService {
  private BASE_URL = 'http://localhost:1337';

  constructor(private http: HttpClient) {}

  getToken(): string {
    return localStorage.getItem('token');
  }

  logIn(email: string, password: string): Observable<any> {
    const url = `${this.BASE_URL}/login`;
    return this.http.post<User>(url, {email, password});
  }

  signUp(email: string, password: string): Observable<User> {
    const url = `${this.BASE_URL}/register`;
    return this.http.post<User>(url, {email, password});
  }
}
```

Both the `logIn` and `signUp` methods return `Observable`s and create new `User`s. We'll need to subscribe to `logIn` and `signUp`, after a successful form submission, to send the respective HTTP requests within the effects module.

## NGRX Effects

### Install NGRX Effects

[NGRX Effects](https://github.com/ngrx/platform/blob/master/docs/effects/README.md) listen for actions dispatched from the NGRX Store, perform some logic (e.g., a side effect), and then dispatch a new action.

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px;">
  <img src="/assets/img/blog/angular-auth-ngrx/angular-ngrx-store-effects-flow.png" style="max-width:90%;border:0;box-shadow:none;" alt="angular ngrx store + effects flow">
</div>

Install:

```sh
$ npm install @ngrx/effects@5.2.0 --save
```

### Add effects file

Then, within the "store" folder, add a new folder called "effects". And, within that folder, add a new file called *auth.effects.ts*:

```typescript
import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/catch';
import { tap } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';


@Injectable()
export class AuthEffects {

  constructor(
    private actions: Actions,
    private authService: AuthService,
    private router: Router,
  ) {}

  // effects go here

}
```

Then, register the effects module in `@NgModule`:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EffectsModule } from '@ngrx/effects';

import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { AuthService } from './services/auth.service';
import { AuthEffects } from './store/effects/auth.effects';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    SignUpComponent,
    LogInComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    EffectsModule.forRoot([AuthEffects]),
    RouterModule.forRoot([
      { path: 'log-in', component: LogInComponent },
      { path: 'sign-up', component: SignUpComponent },
      { path: '', component: LandingComponent },
      { path: '**', redirectTo: '/' }
    ])
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Configure Login

### Login

#### Dispatch `LogIn` action

First, after a successful form submission, we need to dispatch a `LogIn` action, which will send an action and a parameter to a reducer to eventually create a new state.

*src/app/components/log-in/log-in.component.ts*:

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { User } from '../../models/user';
import { AppState } from '../../store/app.states';
import { LogIn } from '../../store/actions/auth.actions';


@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css']
})
export class LogInComponent implements OnInit {

  user: User = new User();

  constructor(
    private store: Store<AppState>
  ) { }

  ngOnInit() {
  }

  onSubmit(): void {
    const payload = {
      email: this.user.email,
      password: this.user.password
    };
    this.store.dispatch(new LogIn(payload));
  }

}
```

With the Angular server running, you should see the following error since we still need to set up the module for the actions along with the `LogIn` action:

```sh
ERROR in src/app/components/log-in/log-in.component.ts(6,23): error TS2306:
File 'angular-auth-ngrx/src/app/store/actions/auth.actions.ts' is not a module.
```

#### Add action

Actions describe changes to state. They are dispatched to a reducer, which will then create a new state.

Update *src/app/store/user.actions.ts* like so:

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login'
}
```

Add the action class as well:

```typescript
export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export type All =
  | LogIn;
```

You should now have:

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login'
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export type All =
  | LogIn;
```

#### Add effect (to dispatch either `LogInSuccess` or `LogInFailure`)

Add the first effect to *src/app/store/effects/auth.effects.ts*

```typescript
@Effect()
LogIn: Observable<any> = this.actions
  .ofType(AuthActionTypes.LOGIN)
  .map((action: LogIn) => action.payload)
  .switchMap(payload => {
    return this.authService.logIn(payload.email, payload.password)
      .map((user) => {
        console.log(user);
        return new LogInSuccess({token: user.token, email: payload.email});
      })
      .catch((error) => {
        console.log(error);
        return Observable.of(new LogInFailure({ error: error }));
      });
  });
```

The `ofType` operator filters the action by a type. It accepts multiple action types, so one effect can handle a number of actions. Then, with `map`, we "map" the action to its payload. This, essentially, returns an observable with *just* the payload. The `switchMap` is used to switch *back* to the response observable but still use the payload as an argument in the `switchMap` function.

Add the import:

```typescript
import {
  AuthActionTypes,
  LogIn, LogInSuccess, LogInFailure,
} from '../actions/auth.actions';
```

For AJAX requests, it's a good practice to also dispatch a success or error action based on the result of the request.

### Login Success

#### Add action

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;
  constructor(public payload: any) {}
}

export type All =
  | LogIn
  | LogInSuccess;
```

#### Add reducer (to create new state)

Reducers are pure functions that create a new state.

When the log in is successful, we need to set `isAuthenticated` to `true` and add the token and email to the `user` object.

Update *src/app/store/reducers/auth.reducers.ts*:

```typescript
export function reducer(state = initialState, action: All): State {
  switch (action.type) {
    case AuthActionTypes.LOGIN_SUCCESS: {
      return {
        ...state,
        isAuthenticated: true,
        user: {
          token: action.payload.token,
          email: action.payload.email
        },
        errorMessage: null
      };
    }
    default: {
      return state;
    }
  }
}
```

Add the import:

```typescript
import { AuthActionTypes, All } from '../actions/auth.actions';
```

Import the reducers into the Angular module:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { AuthService } from './services/auth.service';
import { AuthEffects } from './store/effects/auth.effects';
import { reducers } from './store/app.states';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    SignUpComponent,
    LogInComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, {}),
    EffectsModule.forRoot([AuthEffects]),
    RouterModule.forRoot([
      { path: 'log-in', component: LogInComponent },
      { path: 'sign-up', component: SignUpComponent },
      { path: '', component: LandingComponent },
      { path: '**', redirectTo: '/' }
    ])
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Then, update *app.states.ts*, adding in the reducers:

```typescript
import * as auth from './reducers/auth.reducers';


export interface AppState {
  authState: auth.State;
}

export const reducers = {
  auth: auth.reducer
};
```

#### Add effect (to add token to localStorage and redirect user)

```typescript
@Effect({ dispatch: false })
LogInSuccess: Observable<any> = this.actions.pipe(
  ofType(AuthActionTypes.LOGIN_SUCCESS),
  tap((user) => {
    localStorage.setItem('token', user.payload.token);
    this.router.navigateByUrl('/');
  })
);
```

Version 5.5 of RXJS introduced the `pipe` [method](https://github.com/ReactiveX/rxjs/blob/master/doc/pipeable-operators.md), which is used to compose a number of functions to act on the observable.  Again, `ofType` associates the effect with an action while `tap` performs a side effect transparently. In other words, it returns an observable identical to the source. In our case, we're adding the token to localStorage and then redirecting the user to `/`.

> Check out the comments for [pipe](https://github.com/ReactiveX/rxjs/blob/5.5.5/src/Observable.ts#L305) and [tap](https://github.com/ReactiveX/rxjs/blob/5.5.5/src/operators/tap.ts#L14), respectively, from the source code.

### Login Failure

#### Add action

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;
  constructor(public payload: any) {}
}

export class LogInFailure implements Action {
  readonly type = AuthActionTypes.LOGIN_FAILURE;
  constructor(public payload: any) {}
}

export type All =
  | LogIn
  | LogInSuccess
  | LogInFailure;
```

#### Add reducer (to create new state)

```typescript
case AuthActionTypes.LOGIN_FAILURE: {
  return {
    ...state,
    errorMessage: 'Incorrect email and/or password.'
  };
}
```

#### Add effect

```typescript
@Effect({ dispatch: false })
LogInFailure: Observable<any> = this.actions.pipe(
  ofType(AuthActionTypes.LOGIN_FAILURE)
);
```

Try it out. Make sure the token is added to localStorage and you are redirected after a successful log in:

- *email*: `test@test.com`
- *password*: `test`

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px">
  <img src="/assets/img/blog/angular-auth-ngrx/angular-ngrx-login.gif" style="max-width: 70%;border:0;box-shadow:none;" alt="log in">
</div>

The fake back-end will throw a `400` error if you use any email other than `test@test.com`. As of now, nothing happens on the UI, though. We'll wire up error messaging shorty.

> Looking for a quick challenge? Refactor the `LogIn` effect to use the `pipe` method. Clean up the code!

## Configure Signup

Your turn! Configuring the sign up functionality is nearly the same as the log in functionality. Try it on your own before reviewing the post.

### Signup

#### Dispatch `SignUp` action

*src/app/components/sign-up/sign-up.component.ts*:

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { User } from '../../models/user';
import { AppState } from '../../store/app.states';
import { SignUp } from '../../store/actions/auth.actions';


@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {

  user: User = new User();

  constructor(
    private store: Store<AppState>
  ) { }

  ngOnInit() {
  }

  onSubmit(): void {
    const payload = {
      email: this.user.email,
      password: this.user.password
    };
    this.store.dispatch(new SignUp(payload));
  }

}
```

#### Add action

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
  SIGNUP = '[Auth] Signup',
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;
  constructor(public payload: any) {}
}

export class LogInFailure implements Action {
  readonly type = AuthActionTypes.LOGIN_FAILURE;
  constructor(public payload: any) {}
}

export class SignUp implements Action {
  readonly type = AuthActionTypes.SIGNUP;
  constructor(public payload: any) {}
}

export type All =
  | LogIn
  | LogInSuccess
  | LogInFailure
  | SignUp;
```

#### Add effect (to dispatch either `SignUpSuccess` or `SignUpFailure`)

```typescript
@Effect()
SignUp: Observable<any> = this.actions
  .ofType(AuthActionTypes.SIGNUP)
  .map((action: SignUp) => action.payload)
  .switchMap(payload => {
    return this.authService.signUp(payload.email, payload.password)
      .map((user) => {
        console.log(user);
        return new SignUpSuccess({token: user.token, email: payload.email});
      })
      .catch((error) => {
        console.log(error);
        return Observable.of(new SignUpFailure({ error: error }));
      });
  });
```

Add the import:

```typescript
import {
  AuthActionTypes,
  LogIn, LogInSuccess, LogInFailure,
  SignUp, SignUpSuccess, SignUpFailure
} from '../actions/auth.actions';
```

### Signup Success

#### Add action

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
  SIGNUP = '[Auth] Signup',
  SIGNUP_SUCCESS = '[Auth] Signup Success',
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;
  constructor(public payload: any) {}
}

export class LogInFailure implements Action {
  readonly type = AuthActionTypes.LOGIN_FAILURE;
  constructor(public payload: any) {}
}

export class SignUp implements Action {
  readonly type = AuthActionTypes.SIGNUP;
  constructor(public payload: any) {}
}

export class SignUpSuccess implements Action {
  readonly type = AuthActionTypes.SIGNUP_SUCCESS;
  constructor(public payload: any) {}
}

export type All =
  | LogIn
  | LogInSuccess
  | LogInFailure
  | SignUp
  | SignUpSuccess;
```

#### Add reducer (to create new state)

```typescript
case AuthActionTypes.SIGNUP_SUCCESS: {
  return {
    ...state,
    isAuthenticated: true,
    user: {
      token: action.payload.token,
      email: action.payload.email
    },
    errorMessage: null
  };
}
```

#### Add effect (to add token to localStorage and redirect user)

```typescript
@Effect({ dispatch: false })
SignUpSuccess: Observable<any> = this.actions.pipe(
  ofType(AuthActionTypes.SIGNUP_SUCCESS),
  tap((user) => {
    localStorage.setItem('token', user.payload.token);
    this.router.navigateByUrl('/');
  })
);
```

### Signup Failure

Again, try this on your own!

#### Add action

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
  SIGNUP = '[Auth] Signup',
  SIGNUP_SUCCESS = '[Auth] Signup Success',
  SIGNUP_FAILURE = '[Auth] Signup Failure',
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;
  constructor(public payload: any) {}
}

export class LogInFailure implements Action {
  readonly type = AuthActionTypes.LOGIN_FAILURE;
  constructor(public payload: any) {}
}

export class SignUp implements Action {
  readonly type = AuthActionTypes.SIGNUP;
  constructor(public payload: any) {}
}

export class SignUpSuccess implements Action {
  readonly type = AuthActionTypes.SIGNUP_SUCCESS;
  constructor(public payload: any) {}
}

export class SignUpFailure implements Action {
  readonly type = AuthActionTypes.SIGNUP_FAILURE;
  constructor(public payload: any) {}
}

export type All =
  | LogIn
  | LogInSuccess
  | LogInFailure
  | SignUp
  | SignUpSuccess
  | SignUpFailure;
```

#### Add reducer (to create new state)

```typescript
case AuthActionTypes.SIGNUP_FAILURE: {
  return {
    ...state,
    errorMessage: 'That email is already in use.'
  };
}
```

#### Add effect

```typescript
@Effect({ dispatch: false })
SignUpFailure: Observable<any> = this.actions.pipe(
  ofType(AuthActionTypes.SIGNUP_FAILURE)
);
```

> You could combine `SignUpFailure` and `LogInFailure`, to make a single effect:
>
  ```typescript
  AuthFailure: Observable<any> = this.actions.pipe(
    ofType(AuthActionTypes.SIGNUP_FAILURE, AuthActionTypes.LOGIN_FAILURE)
  );
  ```
>

We're now ready to test!

With the fake back-end running, try signing up with the following credentials:

- *email*: `test@test.com`
- *password*: `test`

Make sure that you are redirected after a successful attempt and that a token was added to localStorage. Also, ensure that nothing happens on an unsuccessful attempt (when you use an email other than `test@test.com`). We still need to wire up the handling of the error to the template.

## Configure Logout

### Logout

#### Dispatch `LogOut` action

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../store/app.states';
import { LogOut } from '../../store/actions/auth.actions';


@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  constructor(
    private store: Store<AppState>
  ) { }

  ngOnInit() {
  }

  logOut(): void {
    this.store.dispatch(new LogOut);
  }

}
```

#### Add action

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
  SIGNUP = '[Auth] Signup',
  SIGNUP_SUCCESS = '[Auth] Signup Success',
  SIGNUP_FAILURE = '[Auth] Signup Failure',
  LOGOUT = '[Auth] Logout',
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;
  constructor(public payload: any) {}
}

export class LogInFailure implements Action {
  readonly type = AuthActionTypes.LOGIN_FAILURE;
  constructor(public payload: any) {}
}

export class SignUp implements Action {
  readonly type = AuthActionTypes.SIGNUP;
  constructor(public payload: any) {}
}

export class SignUpSuccess implements Action {
  readonly type = AuthActionTypes.SIGNUP_SUCCESS;
  constructor(public payload: any) {}
}

export class SignUpFailure implements Action {
  readonly type = AuthActionTypes.SIGNUP_FAILURE;
  constructor(public payload: any) {}
}

export class LogOut implements Action {
  readonly type = AuthActionTypes.LOGOUT;
}

export type All =
  | LogIn
  | LogInSuccess
  | LogInFailure
  | SignUp
  | SignUpSuccess
  | SignUpFailure
  | LogOut;
```

Did you notice we're not sending any parameters with the dispatch? Because of that, we left off the payload in the constructor.

#### Add reducer (to create new state)

```typescript
case AuthActionTypes.LOGOUT: {
  return initialState;
}
```

#### Add effect (to remove token from localStorage)

```typescript
@Effect({ dispatch: false })
public LogOut: Observable<any> = this.actions.pipe(
  ofType(AuthActionTypes.LOGOUT),
  tap((user) => {
    localStorage.removeItem('token');
  })
);
```

Import:

```typescript
import {
  AuthActionTypes,
  LogIn, LogInSuccess, LogInFailure,
  SignUp, SignUpSuccess, SignUpFailure,
  LogOut,
} from '../actions/auth.actions';
```

We'll test this functionality out shortly.

## Update the Templates

### Add error messages to the forms

#### Update the components

`LogInComponent`:

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { User } from '../../models/user';
import { AppState, selectAuthState } from '../../store/app.states';
import { LogIn } from '../../store/actions/auth.actions';


@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css']
})
export class LogInComponent implements OnInit {

  user: User = new User();
  getState: Observable<any>;
  errorMessage: string | null;

  constructor(
    private store: Store<AppState>
  ) {
    this.getState = this.store.select(selectAuthState);
  }

  ngOnInit() {
    this.getState.subscribe((state) => {
      this.errorMessage = state.errorMessage;
    });
  };

  onSubmit(): void {
    const payload = {
      email: this.user.email,
      password: this.user.password
    };
    this.store.dispatch(new LogIn(payload));
  }

}
```

Here, we're subscribing to the store and assigning the `errorMessage` to `this.errorMessage`, which we can reference in our template.

Update *app.states.ts*:

```typescript
import { createFeatureSelector } from '@ngrx/store';

import * as auth from './reducers/auth.reducers';


export interface AppState {
  authState: auth.State;
}

export const reducers = {
  auth: auth.reducer
};

export const selectAuthState = createFeatureSelector<AppState>('auth');
```

`createFeatureSelector` is a [selector](https://github.com/ngrx/platform/blob/master/docs/store/selectors.md) used to query the state.

`SignUpComponent`:

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { User } from '../../models/user';
import { AppState, selectAuthState } from '../../store/app.states';
import { SignUp } from '../../store/actions/auth.actions';


@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {

  user: User = new User();
  getState: Observable<any>;
  errorMessage: string | null;

  constructor(
    private store: Store<AppState>
  ) {
    this.getState = this.store.select(selectAuthState);
  }

  ngOnInit() {
    this.getState.subscribe((state) => {
      this.errorMessage = state.errorMessage;
    });
  }

  onSubmit(): void {
    const payload = {
      email: this.user.email,
      password: this.user.password
    };
    this.store.dispatch(new SignUp(payload));
  }

}
```

#### Add messages to the templates

Login:

{% raw %}
```
<div class="row">
  <div class="col-md-4">
    <h1>Log in</h1>
    <hr><br>
    <div *ngIf="errorMessage">
      <div class="alert alert-danger" role="alert">
        {{errorMessage}}
      </div>
    </div>
    <form (ngSubmit)="onSubmit()" ngNativeValidate>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          [(ngModel)]="user.email"
          name="email"
          type="email"
          required
          class="form-control"
          id="email"
          placeholder="enter your email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          [(ngModel)]="user.password"
          name="password"
          type="password"
          required
          class="form-control"
          id="password"
          placeholder="enter a password">
      </div>
      <button type="submit" class="btn btn-primary">Submit</button>
      <a [routerLink]="['/']" class="btn btn-success">Cancel</a>
    </form>
    <p>
      <span>Don't have an account?&nbsp;</span>
      <a [routerLink]="['/sign-up']">Sign up!</a>
    </p>
  </div>
</div>
```
{% endraw %}

Signup:

{% raw %}
```
<div class="row">
  <div class="col-md-4">
    <h1>Sign up</h1>
    <hr><br>
    <div *ngIf="errorMessage">
      <div class="alert alert-danger" role="alert">
        {{errorMessage}}
      </div>
    </div>
    <form (ngSubmit)="onSubmit()" ngNativeValidate>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          [(ngModel)]="user.email"
          name="email"
          type="email"
          required
          class="form-control"
          id="email"
          placeholder="enter your email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          [(ngModel)]="user.password"
          name="password"
          type="password"
          required
          class="form-control"
          id="password"
          placeholder="enter a password">
      </div>
      <button type="submit" class="btn btn-primary">Submit</button>
      <a [routerLink]="['/']" class="btn btn-success">Cancel</a>
    </form>
    <p>
      <span>Already have an account?&nbsp;</span>
      <a [routerLink]="['/log-in']">Log in!</a>
    </p>
  </div>
</div>
```
{% endraw %}

Test this out!

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px">
  <img src="/assets/img/blog/angular-auth-ngrx/angular-ngrx-error-messages.gif" style="max-width: 70%;border:0;box-shadow:none;" alt="error messages">
</div>

### Update the `LandingComponent`

Update the component:

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { AppState, selectAuthState } from '../../store/app.states';
import { LogOut } from '../../store/actions/auth.actions';


@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  getState: Observable<any>;
  isAuthenticated: false;
  user = null;
  errorMessage = null;

  constructor(
    private store: Store<AppState>
  ) {
    this.getState = this.store.select(selectAuthState);
  }

  ngOnInit() {
    this.getState.subscribe((state) => {
      this.isAuthenticated = state.isAuthenticated;
      this.user = state.user;
      this.errorMessage = state.errorMessage;
    });
  }

  logOut(): void {
    this.store.dispatch(new LogOut);
  }

}
```

Next, update the Landing template so that the *Log in* and *Sign up* buttons are *only* visible when a user is not authenticated. Also, when the user is authenticated, a welcome message will be displayed along with a *Log out* button.

{% raw %}
```
<div class="row">
  <div class="col-md-4">
    <h1>Angular + NGRX</h1>
    <hr><br>
    <div *ngIf="isAuthenticated; then doSomething; else doSomethingElse;"></div>
    <ng-template #doSomething>
      <p>You logged in <em>{{user.email}}!</em></p>
      <button class="btn btn-primary" (click)="logOut()">Log out</button>
    </ng-template>
    <ng-template #doSomethingElse>
      <a [routerLink]="['/log-in']" class="btn btn-primary">Log in</a>
      <a [routerLink]="['/sign-up']" class="btn btn-primary">Sign up</a>
    </ng-template>
  </div>
</div>
```
{% endraw %}

Test it out! Make sure the token is removed when the user logs out.

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px;">
  <img src="/assets/img/blog/angular-auth-ngrx/landing-logged-in.png" style="max-width: 70%;border:0;box-shadow:none;" alt="landing component">
</div>

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px;">
  <img src="/assets/img/blog/angular-auth-ngrx/landing-logged-out.png" style="max-width: 70%;border:0;box-shadow:none;" alt="landing component">
</div>

Finally, update the template once again to show the current application state. This is just for reference while developing, so be sure to remove it before deploying to production.

Template:

{% raw %}
```
<div class="row">
  <div class="col-md-4">

    <h1>Angular + NGRX</h1>
    <hr><br>

    <div *ngIf="isAuthenticated; then doSomething; else doSomethingElse;"></div>
    <ng-template #doSomething>
      <p>You logged in <em>{{user.email}}!</em></p>
      <button class="btn btn-primary" (click)="logOut()">Log out</button>
    </ng-template>
    <ng-template #doSomethingElse>
      <a [routerLink]="['/log-in']" class="btn btn-primary">Log in</a>
      <a [routerLink]="['/sign-up']" class="btn btn-primary">Sign up</a>
    </ng-template>

    <br><br><br>

    <div class="card" style="width: 18rem;">
      <div class="card-body">
        <h5 class="card-title">Current State</h5>
        <ul>
          <li><strong>isAuthenticated</strong> - {{isAuthenticated}}</li>
          <li><strong>user.email</strong> - {{ user?.email || 'null'}}</li>
          <li><strong>user.token</strong> - {{ user?.token || 'null'}}</li>
          <li><strong>errorMessage</strong> - {{ errorMessage || 'null'}}</li>
        </ul>
      </div>
    </div>

  </div>
</div>
```
{% endraw %}

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px">
  <img src="/assets/img/blog/angular-auth-ngrx/angular-ngrx-landing-show-state.gif" style="max-width: 70%;border:0;box-shadow:none;" alt="state on landing page">
</div>

## Add HTTP Interceptor

### Configure the interceptor

The `HttpInterceptor` [interface](https://angular.io/api/common/http/HttpInterceptor) is used to intercept and modify HTTP requests globally. We'll use it to add the authentication token and content type to the request headers.

Create the service:

```sh
$ ng generate service services/token
```

Rename *token.service.ts* to *token.interceptor.ts* and then remove  *token.service.spec.ts*.

```typescript
import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { AuthService } from './auth.service';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private authService: AuthService;
  constructor(private injector: Injector) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.authService = this.injector.get(AuthService);
    const token: string = this.authService.getToken();
    request = request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return next.handle(request);
  }
}
```

Import the `TokenInterceptor` and `HTTP_INTERCEPTORS` from `@angular/common/http` to *src/app/app.module.ts*, and then add the interceptor as a provider in the `@NgModule` definition:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { AuthService } from './services/auth.service';
import { AuthEffects } from './store/effects/auth.effects';
import { reducers } from './store/app.states';
import { TokenInterceptor } from './services/token.interceptor';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    SignUpComponent,
    LogInComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, {}),
    EffectsModule.forRoot([AuthEffects]),
    RouterModule.forRoot([
      { path: 'log-in', component: LogInComponent },
      { path: 'sign-up', component: SignUpComponent },
      { path: '', component: LandingComponent },
      { path: '**', redirectTo: '/' }
    ])
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Now, when an HTTP request is made, the token (if it exists in localStorage) will be added to the header.

### Handle unauthorized responses

The interceptor can also be used to intercept incoming HTTP responses. We can use it here to check for any `401` codes and redirect the user to the log in route:

```typescript
import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest,
  HttpResponse, HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private authService: AuthService;
  constructor(private injector: Injector) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.authService = this.injector.get(AuthService);
    const token: string = this.authService.getToken();
    request = request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return next.handle(request);
  }
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(request)
      .catch((response: any) => {
        if (response instanceof HttpErrorResponse && response.status === 401) {
          console.log(response);
        }
        return Observable.throw(response);
      });
  }
}
```

Add the `ErrorInterceptor` to the provider array:

```typescript
providers: [
  AuthService,
  {
    provide: HTTP_INTERCEPTORS,
    useClass: TokenInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
  }
],
```

Make sure to import it:

```typescript
import {
  TokenInterceptor, ErrorInterceptor
} from './services/token.interceptor';
```

We'll test this out shortly.

### Add new route

Generate the component:

```sh
$ ng generate component components/status
```

Update the router:

```typescript
RouterModule.forRoot([
  { path: 'log-in', component: LogInComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'status', component: StatusComponent },
  { path: '', component: LandingComponent },
  { path: '**', redirectTo: '/' }
])
```

Dispatch a new action in the component:

```typescript
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../store/app.states';
import { GetStatus } from '../../store/actions/auth.actions';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    this.store.dispatch(new GetStatus);
  }

}
```

Add the action:

```typescript
import { Action } from '@ngrx/store';


export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
  SIGNUP = '[Auth] Signup',
  SIGNUP_SUCCESS = '[Auth] Signup Success',
  SIGNUP_FAILURE = '[Auth] Signup Failure',
  LOGOUT = '[Auth] Logout',
  GET_STATUS = '[Auth] GetStatus'
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;
  constructor(public payload: any) {}
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;
  constructor(public payload: any) {}
}

export class LogInFailure implements Action {
  readonly type = AuthActionTypes.LOGIN_FAILURE;
  constructor(public payload: any) {}
}

export class SignUp implements Action {
  readonly type = AuthActionTypes.SIGNUP;
  constructor(public payload: any) {}
}

export class SignUpSuccess implements Action {
  readonly type = AuthActionTypes.SIGNUP_SUCCESS;
  constructor(public payload: any) {}
}

export class SignUpFailure implements Action {
  readonly type = AuthActionTypes.SIGNUP_FAILURE;
  constructor(public payload: any) {}
}

export class LogOut implements Action {
  readonly type = AuthActionTypes.LOGOUT;
}

export class GetStatus implements Action {
  readonly type = AuthActionTypes.GET_STATUS;
}

export type All =
  | LogIn
  | LogInSuccess
  | LogInFailure
  | SignUp
  | SignUpSuccess
  | SignUpFailure
  | LogOut
  | GetStatus;
```

Effect:

```typescript
@Effect({ dispatch: false })
GetStatus: Observable<any> = this.actions
  .ofType(AuthActionTypes.GET_STATUS)
  .map((action: GetStatus) => action)
  .switchMap(payload => {
    return this.authService.getStatus();
  });

@Effect({ dispatch: false })
GetStatus: Observable<any> = this.actions
  .ofType(AuthActionTypes.GET_STATUS)
  .switchMap(payload => {
    return this.authService.getStatus();
  });
```

Add the `getStatus` method to `AuthService`:

```typescript
getStatus(): Observable<User> {
  const url = `${this.BASE_URL}/status`;
  return this.http.get<User>(url);
}
```

Remove the token from localStorage (if it exists), since it's invalid, and redirect the user:

```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(request)
      .catch((response: any) => {
        if (response instanceof HttpErrorResponse && response.status === 401) {
          localStorage.removeItem('token');
          this.router.navigateByUrl('/log-in');
        }
        return Observable.throw(response);
      });
  }
}
```

Add a `/status` link to the Landing template:

{% raw %}
```
<div class="row">
  <div class="col-md-4">

    <h1>Angular + NGRX</h1>
    <hr><br>

    <div *ngIf="isAuthenticated; then doSomething; else doSomethingElse;"></div>
    <ng-template #doSomething>
      <p>You logged in <em>{{user.email}}!</em></p>
      <button class="btn btn-primary" (click)="logOut()">Log out</button>
    </ng-template>
    <ng-template #doSomethingElse>
      <a [routerLink]="['/log-in']" class="btn btn-primary">Log in</a>
      <a [routerLink]="['/sign-up']" class="btn btn-primary">Sign up</a>
    </ng-template>

    <a [routerLink]="['/status']" class="btn btn-primary">Status</a>

    <br><br><br>

    <div class="card" style="width: 18rem;">
      <div class="card-body">
        <h5 class="card-title">Current State</h5>
        <ul>
          <li><strong>isAuthenticated</strong> - {{isAuthenticated}}</li>
          <li><strong>user.email</strong> - {{ user?.email || 'null'}}</li>
          <li><strong>user.token</strong> - {{ user?.token || 'null'}}</li>
          <li><strong>errorMessage</strong> - {{ errorMessage || 'null'}}</li>
        </ul>
      </div>
    </div>

  </div>
</div>
```
{% endraw %}

Status template:

```
<div class="row">
  <div class="col-md-4">
    <h1>Status Works!</h1>
    <hr><br>
    <a [routerLink]="['/']" class="btn btn-primary">Home</a>
</div>
```

Now, if you try to access `/status` and are *not* logged in, you will be redirected to the `/log-in` route:

<div style="text-align:left;padding-top:10px;padding-left:10px;">
  <img src="/assets/img/blog/angular-auth-ngrx/angular-ngrx-http-interceptor.gif" style="max-width: 70%;border:0;box-shadow:none;" alt="http interceptor">
</div>

You should also see the token added to the header when you hit the `/status` route:

<div style="text-align:left;padding-top:10px;padding-left:10px;padding-bottom:20px;">
  <img src="/assets/img/blog/angular-auth-ngrx/status.png" style="max-width: 70%;border:0;box-shadow:none;" alt="status component">
</div>

## Route Guard

Try going to [http://localhost:4200/status](http://localhost:4200/status) in the browser. Did you notice that the component will render for a second before re-directing? That's because `ngOnInit()` is fired *after* the component is created. We can use a route guard to prevent access to the route altogether so the redirect will happen *before* the component gets created.

### Configure the interface

Create the service:

```sh
$ ng generate service services/auth-guard
```

Update:

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { AuthService } from './auth.service';


@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
    public auth: AuthService,
    public router: Router
  ) {}
  canActivate(): boolean {
    if (!this.auth.getToken()) {
      this.router.navigateByUrl('/log-in');
      return false;
    }
    return true;
  }
}
```

So, we are using the `CanActivate` route guard [interface](https://angular.io/api/router/CanActivate) to implement the guard itself. In the `canActivate` method, we check to see if a token is in localStorage, return the appropriate boolean, and (if necessary) redirect the user.

> It's probably worth looking at state as well, to get the value of `isAuthenticated`. Make this change on your own.

### Protect the route

Update the route in *app.module.ts*:

```typescript
{ path: 'status', component: StatusComponent, canActivate: [AuthGuard] },
```

Add the provider:

```typescript
providers: [
  AuthService,
  AuthGuard,
  {
    provide: HTTP_INTERCEPTORS,
    useClass: TokenInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
  }
],
```

Import `canActivate`:

```typescript
import { RouterModule, CanActivate } from '@angular/router';
```

Import the service:

```typescript
import { AuthGuardService as AuthGuard } from './services/auth-guard.service';
```

You should no longer see the template flicker before being redirected.

## Conclusion

This article took a look at how to add authentication to an Angular app using NGRX Store (to manage state) and Effects (to manage side-effects). The full code can be found in the [angular-auth-ngrx](https://github.com/mjhea0/angular-auth-ngrx) repository.

> Want to learn how to test this app? Check out the [Testing Angular with Cypress and Docker](https://testdriven.io/testing-angular-with-cypress-and-docker) blog post!

Looking for some challenges?

1. Add some additional actions and effects: `[Auth] Signup Redirect` and `[Auth] Login Redirect`
1. Refactor out native form validation (`ngNativeValidate`) and add in reactive Angular form validation
1. Add unit and end-to-end tests
1. Configure NGRX [Router Store](https://github.com/ngrx/platform/blob/master/docs/router-store/README.md) so that the Angular Router has access to state
1. Add Docker to simplify the development workflow (see [Dockerizing an Angular App
](http://mherman.org/blog/2018/02/26/dockerizing-an-angular-app) for more info)
1. Remove all `console.log` statements
1. Use a [cookie instead of localStorage](https://stackoverflow.com/questions/43466159/how-to-set-a-cookie-for-jwt-token-in-angular-2/43475915)
