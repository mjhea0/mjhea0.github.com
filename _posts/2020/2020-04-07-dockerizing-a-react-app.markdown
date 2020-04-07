---
layout: post
title: "Dockerizing a React App"
date: 2020-04-07
last_modified_at: 2020-04-07
comments: true
toc: true
categories: [docker, react]
keywords: "docker, react, reactjs, javascript, containerization, create-react-app, create react app, multistage builds, nginx, react-router, react router"
description: "Let's look at how to Dockerize a React app."
redirect_from:
  - /blog/2017/12/07/dockerizing-a-react-app/
---

[Docker](https://www.docker.com/) is a containerization tool used to speed up the development and deployment processes. If you're working with microservices, Docker makes it much easier to link together small, independent services. It also helps to eliminate environment-specific bugs since you can replicate your production environment locally.

This tutorial demonstrates how to Dockerize a React app using the [Create React App](https://facebook.github.io/create-react-app/) generator. We'll specifically focus on-

1. Setting up a development environment with code hot-reloading
1. Configuring a production-ready image using multistage builds

<div style="text-align:center;">
  <img src="/assets/img/blog/docker-logo.png" style="max-width: 100%; border:0; box-shadow: none;" alt="docker">
</div>

<br>

*Updates:*

- April 2020:
  - Updated to the latest versions of Docker, Node, React, and Nginx.
  - Removed the Docker Machine section.
  - Updated the `docker run` commands to account for [changes]((https://github.com/facebook/create-react-app/issues/8688)) in `react-scripts` v3.4.1.
- May 2019:
  - Updated to the latest versions of Docker, Node, React, and Nginx.
  - Added explanations for various Docker commands and flags.
  - Added a number of notes based on reader comments and feedback.
- Feb 2018:
  - Updated to the latest versions of Node, React, and Nginx.
  - Added an anonymous volume.
  - Detailed how to configure Nginx to work properly with React Router.
  - Added a production build section that uses multistage Docker builds.

*We will be using:*

- Docker v19.03.8.
- Create React App v3.4.1
- Node v13.12.0

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Install [Create React App](https://github.com/facebookincubator/create-react-app) globally:

```sh
$ npm install -g create-react-app@3.4.1
```

Generate a new app:

```sh
$ npm init react-app sample --use-npm
$ cd sample
```

## Docker

Add a *Dockerfile* to the project root:

```dockerfile
# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent
RUN npm install react-scripts@3.4.1 -g --silent

# add app
COPY . ./

# start app
CMD ["npm", "start"]
```

> Silencing the NPM output, via `--silent`, is a personal choice. It's often frowned upon, though, since it can swallow errors. Keep this in mind so you don't waste time debugging.

Add a *.dockerignore*:

```
node_modules
build
.dockerignore
Dockerfile
Dockerfile.prod
```

This will speed up the Docker build process as our local dependencies inside the "node_modules" directory will not be sent to the Docker daemon.

Build and tag the Docker image:

```sh
$ docker build -t sample:dev .
```

Then, spin up the container once the build is done:

```sh
$ docker run \
    -it \
    --rm \
    -v ${PWD}:/app \
    -v /app/node_modules \
    -p 3001:3000 \
    -e CHOKIDAR_USEPOLLING=true \
    sample:dev
```

> If you run into an `"ENOENT: no such file or directory, open '/app/package.json".` error, you may need to add an additional volume: `-v /app/package.json`.

What's happening here?

1. The [docker run](https://docs.docker.com/engine/reference/commandline/run/) command creates and runs a new container instance from the image we just created.
1. `-it` starts the container in [interactive mode](https://stackoverflow.com/questions/48368411/what-is-docker-run-it-flag). Why is this necessary? As of [version 3.4.1](https://github.com/facebook/create-react-app/issues/8688), `react-scripts`  exits after start-up (unless CI mode is specified) which will cause the container to exit. Thus the need for interactive mode.

1. `--rm` [removes](https://docs.docker.com/engine/reference/run/#clean-up---rm) the container and volumes after the container exits.
1. `-v ${PWD}:/app` mounts the code into the container at "/app".

    > `{PWD}` may not work on Windows. See [this](https://stackoverflow.com/questions/41485217/mount-current-directory-as-a-volume-in-docker-on-windows-10) Stack Overflow question for more info.

1. Since we want to use the container version of the "node_modules" folder, we configured another volume: `-v /app/node_modules`. You should now be able to remove the local "node_modules" flavor.
1. `-p 3001:3000` exposes port 3000 to other Docker containers on the same network (for inter-container communication) and port 3001 to the host.

    > For more, review [this](https://stackoverflow.com/questions/22111060/what-is-the-difference-between-expose-and-publish-in-docker) Stack Overflow question.

1. Finally, `-e CHOKIDAR_USEPOLLING=true` [enables](https://create-react-app.dev/docs/troubleshooting/#npm-start-doesn-t-detect-changes) a polling mechanism via [chokidar](https://github.com/paulmillr/chokidar) (which wraps `fs.watch`, `fs.watchFile`, and `fsevents`) so that hot-reloading will work.

Open your browser to [http://localhost:3001/](http://localhost:3001/) and you should see the app. Try making a change to the `App` component within your code editor. You should see the app hot-reload. Kill the server once done.

> What happens when you add `d` to ` -it`?
>
```sh
$ docker run \
    -itd \
    --rm \
    -v ${PWD}:/app \
    -v /app/node_modules \
    -p 3001:3000 \
    -e CHOKIDAR_USEPOLLING=true \
    sample:dev
```
>
> Check your understanding and look this up on your own.

Want to use [Docker Compose](https://docs.docker.com/compose/)? Add a *docker-compose.yml* file to the project root:

```yaml
version: '3.7'

services:

  sample:
    container_name: sample
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/app'
      - '/app/node_modules'
    ports:
      - 3001:3000
    environment:
      - CHOKIDAR_USEPOLLING=true
```

Take note of the volumes. Without the [anonymous](https://success.docker.com/article/Different_Types_of_Volumes) volume (`'/app/node_modules'`), the *node_modules* directory would be overwritten by the mounting of the host directory at runtime. In other words, this would happen:

- *Build* - The `node_modules` directory is created in the image.
- *Run* - The current directory is mounted into the container, overwriting the `node_modules` that were installed during the build.

Build the image and fire up the container:

```sh
$ docker-compose up -d --build
```

Ensure the app is running in the browser and test hot-reloading again. Bring down the container before moving on:

```sh
$ docker-compose stop
```

> *Windows Users*: Having problems getting the volumes to work properly? Review the following resources:
>
1. [Docker on Windows--Mounting Host Directories](https://rominirani.com/docker-on-windows-mounting-host-directories-d96f3f056a2c)
1. [Configuring Docker for Windows Shared Drives](https://blogs.msdn.microsoft.com/stevelasker/2016/06/14/configuring-docker-for-windows-volumes/)
>
> You also may need to add `COMPOSE_CONVERT_WINDOWS_PATHS=1` to the environment portion of your Docker Compose file. Review the [Declare default environment variables in file](https://docs.docker.com/compose/env-file/) guide for more info.

## Production

Let's create a separate Dockerfile for use in production called *Dockerfile.prod*:

```dockerfile
# build environment
FROM node:13.12.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --silent
RUN npm install react-scripts@3.4.1 -g --silent
COPY . ./
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Here, we take advantage of the [multistage build](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) pattern to create a temporary image used for building the artifact -- the production-ready React static files -- that is then copied over to the production image. The temporary build image is discarded along with the original files and folders associated with the image. This produces a lean, production-ready image.

> Check out the [Builder pattern vs. Multi-stage builds in Docker](https://blog.alexellis.io/mutli-stage-docker-builds/) blog post for more info on multistage builds.

Using the production Dockerfile, build and tag the Docker image:

```sh
$ docker build -f Dockerfile.prod -t sample:prod .
```

Spin up the container:

```sh
$ docker run -it --rm -p 1337:80 sample:prod
```

Navigate to [http://localhost:1337/](http://localhost:1337/) in your browser to view the app.

Test with a new Docker Compose file as well called *docker-compose.prod.yml*:

```yaml
version: '3.7'

services:

  sample-prod:
    container_name: sample-prod
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - '1337:80'
```

Fire up the container:

```sh
$ docker-compose -f docker-compose.prod.yml up -d --build
```

Test it out once more in your browser.

## React Router and Nginx

If you're using [React Router](https://reacttraining.com/react-router/), then you'll need to change the default Nginx config at build time:

```dockerfile
COPY --from=build /app/build /usr/share/nginx/html
```

Add the change to *Dockerfile.prod*:

```dockerfile
# build environment
FROM node:13.12.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --silent
RUN npm install react-scripts@3.4.1 -g --silent
COPY . ./
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
# new
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create the following folder along with a *nginx.conf* file:

```sh
└── nginx
    └── nginx.conf
```

*nginx.conf*:

```
server {

  listen 80;

  location / {
    root   /usr/share/nginx/html;
    index  index.html index.htm;
    try_files $uri $uri/ /index.html;
  }

  error_page   500 502 503 504  /50x.html;

  location = /50x.html {
    root   /usr/share/nginx/html;
  }

}
```

## Next Steps

With that, you should now be able to add React to a larger Docker-powered project for both development and production environments. If you'd like to learn more about working with React and Docker along with building and testing microservices, check out the [Microservices with Docker, Flask, and React](https://testdriven.io/bundle/microservices-with-docker-flask-and-react/) course bundle at [TestDriven.io](https://testdriven.io).
