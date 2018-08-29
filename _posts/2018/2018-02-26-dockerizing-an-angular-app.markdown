---
layout: post
title: "Dockerizing an Angular App"
date: 2018-02-26 08:00:00
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

1. Setting up an image for development with code hot-reloading that includes an instance of Chrome for Karma testing
1. Configuring a lean, production-ready image using multistage builds

*Dependencies:*

- Docker v17.12.0-ce
- Angular CLI v1.7.1
- Node v9.6.1

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Install the [Angular CLI](https://github.com/angular/angular-cli):

```sh
$ npm install -g @angular/cli@1.7.1
```

Generate a new app:

```sh
$ ng new something-clever
$ cd something-clever
```

## Docker

Add a *Dockerfile* to the project root:

```
# base image
FROM node:9.6.1

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
RUN npm install
RUN npm install -g @angular/cli@1.7.1

# add app
COPY . /usr/src/app

# start app
CMD ng serve --host 0.0.0.0
```

Add a *.dockerignore* as well:

```
node_modules
.git
```

This will greatly speed up the Docker build process as our local dependencies and git repo will not be sent to the Docker daemon.

Build and tag the Docker image:

```sh
$ docker build -t something-clever .
```

> If the `RUN npm install -g @angular/cli@1.7.1` results in an infinite loop, you may need to add an `--unsafe` flag:
>
```
RUN npm install -g @angular/cli@1.7.1 --unsafe
```
> Review this [issue](https://github.com/angular/angular-cli/issues/7389) for more info.

Then, spin up the container once the build is done:

```sh
$ docker run -it \
  -v ${PWD}:/usr/src/app \
  -v /usr/src/app/node_modules \
  -p 4200:4200 \
  --rm \
  something-clever
```

Open your browser to [http://localhost:4200](http://localhost:4200) and you should see the app. Try making a change to the `AppComponent`'s template (*src/app/app.component.html*) within your code editor. You should see the app hot-reload. Kill the server once done.

Use the `-d` flag to run the container in the background:

```sh
$ docker run -d \
  -v ${PWD}:/usr/src/app \
  -v /usr/src/app/node_modules \
  -p 4200:4200 \
  --name something-clever-container \
  something-clever
```

Once up, update the Karma config to run Chrome in headless mode:

```javascript
browsers: ['ChromeHeadless'],
customLaunchers: {
  'ChromeHeadless': {
    base: 'Chrome',
    flags: ['--no-sandbox', '--headless', '--disable-gpu', '--remote-debugging-port=9222']
  }
},
```

Run the unit and e2e tests:

```sh
$ docker exec -it something-clever-container ng test --watch=false
$ ng e2e
```

Stop and then remove the container once done:

```sh
$ docker stop something-clever-container
$ docker rm something-clever-container
```

Want to use [Docker Compose](https://docs.docker.com/compose/)? Add a *docker-compose.yml* file to the project root:

```yaml
version: '3.5'

services:

  something-clever:
    container_name: something-clever
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/usr/src/app'
      - '/usr/src/app/node_modules'
    ports:
      - '4200:4200'
```

Take note of the volumes. Without the [anonymous](https://success.docker.com/article/Different_Types_of_Volumes) volume (`'/usr/src/app/node_modules'`), the *node_modules* directory would essentially disappear by the mounting of the host directory at runtime:

- *Build* - The `node_modules` directory is created.
- *Run* - The current directory is copied into the container, overwriting the `node_modules` that were just installed when the container was built.

Build the image and fire up the container:

```sh
$ docker-compose up -d --build
```

Ensure the app is running in the browser and test hot-reloading again. Try both the unit and e2e tests as well:

```sh
$ docker-compose run something-clever ng test --watch=false
$ ng e2e
```

Stop the container before moving on:

```sh
$ docker-compose stop
```

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
$ docker build -t something-clever .
```

And run the container:

```sh
$ docker run -it \
  -v ${PWD}:/usr/src/app \
  -v /usr/src/app/node_modules \
  -p 4200:4200 \
  --rm \
  something-clever
```

Test the app again in the browser at [http://DOCKER_MACHINE_IP:4200](http://DOCKER_MACHINE_IP:4200). Also, confirm that auto reload is *not* working. You can try with Docker Compose as well, but the result will be the same.

To get hot-reload working, we need to add an environment variable:

```sh
$ docker run -it \
  -v ${PWD}:/usr/src/app \
  -v /usr/src/app/node_modules \
  -p 4200:4200 \
  -e CHOKIDAR_USEPOLLING=true \
  --rm \
  something-clever
```

Test it out again. Then, kill the server and add the environment variable to the *docker-compose.yml* file:

```yaml
version: '3.5'

services:

  something-clever:
    container_name: something-clever
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/usr/src/app'
      - '/usr/src/app/node_modules'
    ports:
      - '4200:4200'
    environment:
      - CHOKIDAR_USEPOLLING=true
```

Spin up the container. Run the unit tests. Update the `baseUrl` in *protractor.conf.js* with the Docker Machine IP before running the e2e tests.


## Production

Let's create a separate Dockerfile for use in production called *Dockerfile-prod*:

```
#########################
### build environment ###
#########################

# base image
FROM node:9.6.1 as builder

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
RUN npm install
RUN npm install -g @angular/cli@1.7.1 --unsafe

# add app
COPY . /usr/src/app

# run tests
RUN ng test --watch=false

# generate build
RUN npm run build

##################
### production ###
##################

# base image
FROM nginx:1.13.9-alpine

# copy artifact build from the 'build environment'
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
```

Two important things to note:

1. First, we take advantage of [multistage builds](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) to create a temporary image used for building the artifact that is then copied over to the production image. The temporary build image is discarded along with the original files, folders, and dependencies associated with the image. This produces a lean, production-ready image.

    In other words, the only thing kept from the first image is the compiled distribution code.

    > Check out the [Builder pattern vs. Multi-stage builds in Docker](https://blog.alexellis.io/mutli-stage-docker-builds/) blog post for more info on multistage builds.

1. Next, the unit tests are run in the build process, so the build will fail if the tests do not succeed.

Using the production Dockerfile, build and tag the Docker image:

```sh
$ docker build -f Dockerfile-prod -t something-clever-prod .
```

Spin up the container:

```sh
$ docker run -it -p 80:80 --rm something-clever-prod
```

Assuming you are still using the same Docker Machine, navigate to [http://DOCKER_MACHINE_IP](http://DOCKER_MACHINE_IP) in your browser.

Test with a new Docker Compose file as well called *docker-compose-prod.yml*:

```yaml
version: '3.5'

services:

  something-clever-prod:
    container_name: something-clever-prod
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
ERROR: Service 'something-clever-prod' failed to build:
The command '/bin/sh -c ng test --watch=false' returned a non-zero code: 1
```

If you're done, go ahead and destroy the Machine:

```sh
$ eval $(docker-machine env -u)
$ docker-machine rm clever
```

---


Cheers!
