---
layout: post
title: "Dockerizing a React App"
date: 2017-12-07 08:23:24
comments: true
toc: false
categories: [docker, react]
keywords: "docker, react, reactjs, javascript, containerization, create-react-app, create react app"
description: "Let's look at how to Dockerize a React app."
---

This tutorial demonstrates how to Dockerize a React app using the [Create React App](https://github.com/facebookincubator/create-react-app) generator. We'll specifically focus on setting up a development environment with code hot-reloading.

<div style="text-align:center;">
  <img src="/assets/img/blog/docker-logo.png" style="max-width: 100%; border:0; box-shadow: none;" alt="docker">
</div>

<br>

*We will be using:*

- Docker v17.09.0-ce
- Create React App v1.4.3
- Node v9.2

### Project Setup

Install [Create React App](https://github.com/facebookincubator/create-react-app):

```sh
$ npm install -g create-react-app@1.4.3
```

Generate a new app:

```sh
$ create-react-app sample-app
$ cd sample-app
```

### Docker

Add a Dockerfile to the project root:

```
# base image
FROM node:9.2

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install react-scripts@1.0.17 -g --silent

# start app
CMD ["npm", "start"]
```

> Silencing the NPM output via `--silent` is a personal choice. It's often frowned upon, though, since it can swallow errors. Keep this in mind so you don't waste time debugging.

Add a *.dockerignore*:

```
node_modules
```

So, this will greatly speed up the Docker build process as our local dependencies will not be sent to the Docker daemon.

Build and tag the Docker image:

```sh
$ docker build -t sample-app .
```

Then, spin up the container once the build is done:

```sh
$ docker run -it -v ${PWD}:/usr/src/app -p 3000:3000 --rm sample-app
```

Open your browser to [http://localhost:3000/](http://localhost:3000/) and you should see the app. Try making a change to the `App` component within your code editor. You should see the app hot-reload.

### Docker Compose

Want to use [Docker Compose](https://docs.docker.com/compose/)? Add a *docker-compose.yml* file to the project root:

```yaml
version: '3.3'

services:

  sample-app:
    container_name: sample-app
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/usr/src/app'
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
```

Build the image and fire up the container:

```sh
$ docker-compose up -d --build
```

Ensure the app is running in the browser and test hot-reloading again. Bring down the containers before moving on:

```sh
$ docker-compose stop
```

### Docker Machine

To get hot-reloading to work with [Docker Machine](https://docs.docker.com/machine/) and [VirtualBox](https://docs.docker.com/machine/get-started/) you'll need to [enable](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#troubleshooting) a polling mechanism via [chokidar](https://github.com/paulmillr/chokidar).

Create a new Machine:

```sh
$ docker-machine create -d virtualbox sample
$ docker-machine env sample
$ eval $(docker-machine env sample)
```

Grab the IP address:

```sh
$ docker-machine ip sample
```

Then, build the images and run the containers:

```sh
$ docker build -t sample-app .
$ docker run -it -v ${PWD}:/usr/src/app -p 3000:3000 --rm sample-app
```

Test the app again in the browser at [http://DOCKER_MACHINE_IP:3000/](http://DOCKER_MACHINE_IP:3000/). Also, confirm that auto reload is *not* working. You can try with Docker Compose as well, but the results will be the same.

To get hot-reload working, we need to add an environment variable:

```sh
$ docker run -it -v ${PWD}:/usr/src/app -p 3000:3000 \
  -e CHOKIDAR_USEPOLLING=true --rm sample-app
```

Test it out again. You could add the variable to a *.env* file, however you  don't need it for a production build.

Updated *docker-compose.yml* file:

```yaml
version: '3.3'

services:

  sample-app:
    container_name: sample-app
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/usr/src/app'
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
```

Want to destroy the Machine?

```sh
$ eval $(docker-machine env -u)
$ docker-machine rm sample
```
