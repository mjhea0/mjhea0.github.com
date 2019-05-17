---
layout: post
title: "Dockerizing a React App"
date: 2019-05-17
last_modified_at: 2019-05-17
comments: true
toc: true
categories: [docker, react]
keywords: "docker, react, reactjs, javascript, containerization, create-react-app, create react app, multistage builds, nginx, react-router, react router"
description: "Let's look at how to Dockerize a React app."
redirect_from:
  - /blog/2017/12/07/dockerizing-a-react-app/
---

[Docker](https://www.docker.com/) is a containerization tool that helps speed up the development and deployment processes. If you're working with microservices, Docker makes it much easier to link together small, independent services. It also helps to eliminate environment-specific bugs since you can replicate your production environment locally.

This tutorial demonstrates how to Dockerize a React app using the [Create React App](https://facebook.github.io/create-react-app/) generator. We'll specifically focus on-

1. Setting up a development environment with code hot-reloading
1. Configuring a production-ready image using multistage builds

<div style="text-align:center;">
  <img src="/assets/img/blog/docker-logo.png" style="max-width: 100%; border:0; box-shadow: none;" alt="docker">
</div>

<br>

*Updates:*

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

- Docker v18.09.2
- Create React App v3.0.1
- Node v12.2.0

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Install [Create React App](https://github.com/facebookincubator/create-react-app) globally:

```sh
$ npm install -g create-react-app@3.0.1
```

Generate a new app:

```sh
$ create-react-app sample
$ cd sample
```

## Docker

Add a *Dockerfile* to the project root:

```dockerfile
# base image
FROM node:12.2.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install --silent
RUN npm install react-scripts@3.0.1 -g --silent

# start app
CMD ["npm", "start"]
```

> Silencing the NPM output, via `--silent`, is a personal choice. It's often frowned upon, though, since it can swallow errors. Keep this in mind so you don't waste time debugging.

Add a *.dockerignore*:

```
node_modules
```

This will speed up the Docker build process as our local dependencies will not be sent to the Docker daemon.

Build and tag the Docker image:

```sh
$ docker build -t sample:dev .
```

Then, spin up the container once the build is done:

```sh
$ docker run -v ${PWD}:/app -v /app/node_modules -p 3001:3000 --rm sample:dev
```

> If you run into an `"ENOENT: no such file or directory, open '/app/package.json".` error, you may need to add an additional volume: `-v /app/package.json`.

What's happening here?

1. The [docker run](https://docs.docker.com/engine/reference/commandline/run/) command creates a new container instance, from the image we just created, and runs it.
1. `-v ${PWD}:/app` mounts the code into the container at "/app".

    > `{PWD}` may not work on Windows. See [this](https://stackoverflow.com/questions/41485217/mount-current-directory-as-a-volume-in-docker-on-windows-10) Stack Overflow question for more info.

1. Since we want to use the container version of the "node_modules" folder, we configured another volume: `-v /app/node_modules`. You should now be able to remove the local "node_modules" flavor.
1. `-p 3001:3000` exposes port 3000 to other Docker containers on the same network (for inter-container communication) and port 3001 to the host.

    > For more, review [this](https://stackoverflow.com/questions/22111060/what-is-the-difference-between-expose-and-publish-in-docker) Stack Overflow question.

1. Finally, `--rm` [removes](https://docs.docker.com/engine/reference/run/#clean-up---rm) the container and volumes after the container exits.

Open your browser to [http://localhost:3001/](http://localhost:3001/) and you should see the app. Try making a change to the `App` component within your code editor. You should see the app hot-reload. Kill the server once done.

> What happens when you add `-it`?
>
```sh
$ docker run -it -v ${PWD}:/app -v /app/node_modules -p 3001:3000 --rm sample:dev
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
      - '3001:3000'
    environment:
      - NODE_ENV=development
```

Take note of the volumes. Without the data volume (`'/app/node_modules'`), the *node_modules* directory would be overwritten by the mounting of the host directory at runtime. In other words, this would happen:

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

## Docker Machine

To get hot-reloading to work with [Docker Machine](https://docs.docker.com/machine/) and [VirtualBox](https://docs.docker.com/machine/get-started/) you'll need to [enable](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#troubleshooting) a polling mechanism via [chokidar](https://github.com/paulmillr/chokidar) (which wraps `fs.watch`, `fs.watchFile`, and `fsevents`).

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

Then, build the images and run the container:

```sh
$ docker build -t sample:dev .

$ docker run -v ${PWD}:/app -v /app/node_modules -p 3001:3000 --rm sample:dev
```

Test the app again in the browser at [http://DOCKER_MACHINE_IP:3001/](http://DOCKER_MACHINE_IP:3001/) (make sure to replace `DOCKER_MACHINE_IP` with the actual IP address of the Docker Machine). Also, confirm that hot reload is *not* working. You can try with Docker Compose as well, but the result will be the same.

To get hot-reload working, we need to add an environment variable: `CHOKIDAR_USEPOLLING=true`.

```sh
$ docker run -v ${PWD}:/app -v /app/node_modules -p 3001:3000 -e CHOKIDAR_USEPOLLING=true --rm sample:dev
```

Test it out again. Ensure that hot reload works again.

Updated *docker-compose.yml* file:

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
      - '3001:3000'
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
```

## Production

Let's create a separate Dockerfile for use in production called *Dockerfile-prod*:

```dockerfile
# build environment
FROM node:12.2.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install --silent
RUN npm install react-scripts@3.0.1 -g --silent
COPY . /app
RUN npm run build

# production environment
FROM nginx:1.16.0-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Here, we take advantage of the [multistage build](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) pattern to create a temporary image used for building the artifact -- the production-ready React static files -- that is then copied over to the production image. The temporary build image is discarded along with the original files and folders associated with the image. This produces a lean, production-ready image.

> Check out the [Builder pattern vs. Multi-stage builds in Docker](https://blog.alexellis.io/mutli-stage-docker-builds/) blog post for more info on multistage builds.

Using the production Dockerfile, build and tag the Docker image:

```sh
$ docker build -f Dockerfile-prod -t sample:prod .
```

Spin up the container:

```sh
$ docker run -it -p 80:80 --rm sample:prod
```

Assuming you are still using the same Docker Machine, navigate to [http://DOCKER_MACHINE_IP](http://DOCKER_MACHINE_IP) in your browser.

Test with a new Docker Compose file as well called *docker-compose-prod.yml*:

```yaml
version: '3.7'

services:

  sample-prod:
    container_name: sample-prod
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

Test it out once more in your browser. Then, if you're done, go ahead and destroy the Machine:

```sh
$ eval $(docker-machine env -u)
$ docker-machine rm sample
```

## React Router and Nginx

If you're using [React Router](https://reacttraining.com/react-router/), then you'll need to change the default Nginx config at build time:

```dockerfile
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d
```

Add the changes to *Dockerfile-prod*:

```dockerfile
# build environment
FROM node:12.2.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install --silent
RUN npm install react-scripts@3.0.1 -g --silent
COPY . /app
RUN npm run build

# production environment
FROM nginx:1.16.0-alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d
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

With that, you should now be able to add React to a larger Docker-powered project for both development and production environments. If you'd like to learn more about working with React and Docker along with building and testing microservices, check out the [Microservices with Docker, Flask, and React](https://testdriven.io/) course.
