---
layout: post
title: "Dockerizing an Angular App"
date: 2019-05-20
last_modified_at: 2019-05-20
comments: true
toc: true
categories: [docker, angular]
keywords: "docker, angular, javascript, containerization, multistage builds, nginx, protractor, karma"
description: "This tutorial demonstrates how to Dockerize an Angular app."
redirect_from:
  - /blog/2018/02/26/dockerizing-an-angular-app/
---

[Docker](https://www.docker.com/) is a containerization tool used to streamline application development and deployment workflows across various environments.

This tutorial shows how to Dockerize an [Angular](https://angular.io/) app, built with the [Angular CLI](https://cli.angular.io/), using Docker along with Docker Compose and Docker Machine for both development and production. We'll specifically focus on-

1. Setting up an image for development with code hot-reloading that includes an instance of Chrome for Karma and Protractor testing
1. Configuring a lean, production-ready image using multistage builds

*Updates:*

- May 2019:
  - Updated to the latest versions of Docker, Node, Angular, and Nginx.
  - Added explanations for various Docker commands and flags.
  - Added a number of notes based on reader comments and feedback.
  - Fixed the running of Protractor e2e tests.

*We will be using:*

- Docker v18.09.2
- Angular CLI v7.3.9
- Node v12.2.0

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Install the [Angular CLI](https://github.com/angular/angular-cli) globally:

```sh
$ npm install -g @angular/cli@7.3.9
```

Generate a new app:

```sh
$ ng new example
$ cd example
```

## Docker

Add a *Dockerfile* to the project root:

```dockerfile
# base image
FROM node:12.2.0

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli@7.3.9

# add app
COPY . /app

# start app
CMD ng serve --host 0.0.0.0
```

Add a *.dockerignore* as well:

```
node_modules
.git
.gitignore
```

This will speed up the Docker build process as our local dependencies and git repo will not be sent to the Docker daemon.

Build and tag the Docker image:

```sh
$ docker build -t example:dev .
```

> If `RUN npm install -g @angular/cli@7.3.9` results in an infinite loop, you may need to add an `--unsafe` flag:
>
```
RUN npm install -g @angular/cli@7.3.9 --unsafe
```
> Review this [issue](https://github.com/angular/angular-cli/issues/7389) for more info.

Then, spin up the container once the build is done:

```sh
$ docker run -v ${PWD}:/app -v /app/node_modules -p 4201:4200 --rm example:dev
```

What's happening here?

1. The [docker run](https://docs.docker.com/engine/reference/commandline/run/) command creates a new container instance, from the image we just created, and runs it.
1. `-v ${PWD}:/app` mounts the code into the container at "/app".

    > `{PWD}` may not work on Windows. See [this](https://stackoverflow.com/questions/41485217/mount-current-directory-as-a-volume-in-docker-on-windows-10) Stack Overflow question for more info.

1. Since we want to use the container version of the "node_modules" folder, we configured another volume: `-v /app/node_modules`. You should now be able to remove the local "node_modules" flavor.
1. `-p 4201:4200` exposes port 4200 to other Docker containers on the same network (for inter-container communication) and port 4201 to the host.

    > For more, review [this](https://stackoverflow.com/questions/22111060/what-is-the-difference-between-expose-and-publish-in-docker) Stack Overflow question.

1. Finally, `--rm` [removes](https://docs.docker.com/engine/reference/run/#clean-up---rm) the container and volumes after the container exits.

Open your browser to [http://localhost:4201](http://localhost:4201) and you should see the app. Try making a change to the `AppComponent`'s template (*src/app/app.component.html*) within your code editor. You should see the app hot-reload. Kill the server once done.

> What happens when you add `-it`?
>
```sh
$ docker run -it -v ${PWD}:/app -v /app/node_modules -p 4201:4200 --rm example:dev
```
>
> Check your understanding and look this up on your own.

Use the `-d` flag to run the container in the background:

```sh
$ docker run -d -v ${PWD}:/app -v /app/node_modules -p 4201:4200 --name foo --rm example:dev
```

Once up, update the Karma and Protractor config files to run Chrome in headless mode.

*src/karma.conf.js*:

```javascript
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../coverage/example'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    // updated
    browsers: ['ChromeHeadless'],
    // new
    customLaunchers: {
      'ChromeHeadless': {
        base: 'Chrome',
        flags: [
          '--no-sandbox',
          '--headless',
          '--disable-gpu',
          '--remote-debugging-port=9222'
        ]
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
```

*e2e/protractor.conf.js*:

```javascript
const { SpecReporter } = require('jasmine-spec-reporter');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './src/**/*.e2e-spec.ts'
  ],
  capabilities: {
    'browserName': 'chrome',
    // new
    'chromeOptions': {
      'args': [
        '--no-sandbox',
        '--headless',
        '--window-size=1024,768'
      ]
    }
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json')
    });
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  }
};
```

Run the unit and e2e tests:

```sh
$ docker exec -it foo ng test --watch=false
$ docker exec -it foo ng e2e --port 4202
```

Stop the container once done:

```sh
$ docker stop foo
```

Want to use [Docker Compose](https://docs.docker.com/compose/)? Add a *docker-compose.yml* file to the project root:

```yaml
version: '3.7'

services:

  example:
    container_name: example
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/app'
      - '/app/node_modules'
    ports:
      - '4201:4200'
```

Take note of the volumes. Without the [anonymous](https://success.docker.com/article/Different_Types_of_Volumes) volume (`'/app/node_modules'`), the *node_modules* directory would be overwritten by the mounting of the host directory at runtime. In other words, this would happen:

- *Build* - The `node_modules` directory is created in the image.
- *Run* - The current directory is mounted into the container, overwriting the `node_modules` that were installed during the build.

Build the image and fire up the container:

```sh
$ docker-compose up -d --build
```

Ensure the app is running in the browser and test hot-reloading again. Try both the unit and e2e tests as well:

```sh
$ docker-compose exec example ng test --watch=false
$ docker-compose exec example ng e2e --port 4202
```

Stop the container before moving on:

```sh
$ docker-compose stop
```

> *Windows Users*: Having problems getting the volumes to work properly? Review the following resources:
>
1. [Docker on Windows--Mounting Host Directories](https://rominirani.com/docker-on-windows-mounting-host-directories-d96f3f056a2c)
1. [Configuring Docker for Windows Shared Drives](https://blogs.msdn.microsoft.com/stevelasker/2016/06/14/configuring-docker-for-windows-volumes/)
>
> You also may need to add `COMPOSE_CONVERT_WINDOWS_PATHS=1` to the environment portion of your Docker Compose file. Review the [Declare default environment variables in file](https://docs.docker.com/compose/env-file/) guide for more info.

## Docker Machine

To get hot-reloading to work with [Docker Machine](https://docs.docker.com/machine/) and [VirtualBox](https://docs.docker.com/machine/get-started/) you'll need to enable a polling mechanism via [chokidar](https://github.com/paulmillr/chokidar) (which wraps `fs.watch`, `fs.watchFile`, and `fsevents`).

Create a new Machine:

```sh
$ docker-machine create -d virtualbox clever
$ docker-machine env clever
$ eval $(docker-machine env clever)
```

Grab the IP address:

```sh
$ docker-machine ip clever
```

Then, build the images:

```sh
$ docker build -t example:dev .
```

And run the container:

```sh
$ docker run -it -v ${PWD}:/app -v /app/node_modules -p 4201:4200 --rm example:dev
```

Test the app again in the browser at [http://DOCKER_MACHINE_IP:4201](http://DOCKER_MACHINE_IP:4201) (make sure to replace `DOCKER_MACHINE_IP` with the actual IP address of the Docker Machine). Also, confirm that auto reload is *not* working. You can try with Docker Compose as well, but the result will be the same.

To get hot-reload working, we need to add an environment variable: `CHOKIDAR_USEPOLLING=true`.

```sh
$ docker run -it -v ${PWD}:/app -v /app/node_modules -p 4201:4200 -e CHOKIDAR_USEPOLLING=true --rm example:dev
```

Test it out again. Then, kill the server and add the environment variable to the *docker-compose.yml* file:

```yaml
version: '3.7'

services:

  example:
    container_name: example
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/app'
      - '/app/node_modules'
    ports:
      - '4201:4200'
    environment:
      - CHOKIDAR_USEPOLLING=true
```

Spin up the container. Run the unit tests and e2e tests.

## Production

Let's create a separate Dockerfile for use in production called *Dockerfile-prod*:

```dockerfile
#############
### build ###
#############

# base image
FROM node:12.2.0 as build

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli@7.3.9

# add app
COPY . /app

# run tests
RUN ng test --watch=false
RUN ng e2e --port 4202

# generate build
RUN ng build --output-path=dist

############
### prod ###
############

# base image
FROM nginx:1.16.0-alpine

# copy artifact build from the 'build environment'
COPY --from=build /app/dist /usr/share/nginx/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
```

Two important things to note:

1. First, we take advantage of the [multistage build](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) pattern to create a temporary image used for building the artifact -- the production-ready Angular static files -- that is then copied over to the production image. The temporary build image is discarded along with the original files, folders, and dependencies associated with the image. This produces a lean, production-ready image.

    In other words, the only thing kept from the first image is the compiled distribution code.

    > Check out the [Builder pattern vs. Multi-stage builds in Docker](https://blog.alexellis.io/mutli-stage-docker-builds/) blog post for more info on multistage builds.

1. Next, the unit and e2e tests are run in the build process, so the build will fail if the tests do not succeed.

Using the production Dockerfile, build and tag the Docker image:

```sh
$ docker build -f Dockerfile-prod -t example:prod .
```

Spin up the container:

```sh
$ docker run -it -p 80:80 --rm example:prod
```

Assuming you are still using the same Docker Machine, navigate to [http://DOCKER_MACHINE_IP/](http://DOCKER_MACHINE_IP/) in your browser.

Test with a new Docker Compose file as well called *docker-compose-prod.yml*:

```yaml
version: '3.7'

services:

  example-prod:
    container_name: example-prod
    build:
      context: .
      dockerfile: Dockerfile-prod
    ports:
      - '80:80'
```

Fire up the container:

```sh
$ docker-compose -f docker-compose-prod.yml up -d --build
```

Test it out once more in your browser. Then, break a test in *src/app/app.component.spec.ts* and re-build. It should fail:

```sh
ERROR: Service 'example-prod' failed to build:
The command '/bin/sh -c ng test --watch=false' returned a non-zero code: 1
```

If you're done, go ahead and destroy the Machine:

```sh
$ eval $(docker-machine env -u)
$ docker-machine rm clever
```

---

Cheers!
