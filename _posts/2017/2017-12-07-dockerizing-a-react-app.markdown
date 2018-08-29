---
layout: post
title: "Dockerizing a React App"
date: 2017-12-07 08:23:24
comments: true
toc: true
categories: [docker, react]
keywords: "docker, react, reactjs, javascript, containerization, create-react-app, create react app, multistage builds, nginx, react-router, react router"
description: "Let's look at how to Dockerize a React app."
redirect_from:
  - /blog/2017/12/07/dockerizing-a-react-app/
---

[Docker](https://www.docker.com/) is a technology that helps to speed up the development and deployment processes. If you're working with microservices, Docker makes it much easier to link together small, independent services. It also helps to eliminate environment-specific bugs since you can replicate your production environment locally.

This tutorial demonstrates how to Dockerize a React app using the [Create React App](https://github.com/facebookincubator/create-react-app) generator. We'll specifically focus on-

1. Setting up a development environment with code hot-reloading
1. Configuring a production-ready image using multistage builds

<div style="text-align:center;">
  <img src="/assets/img/blog/docker-logo.png" style="max-width: 100%; border:0; box-shadow: none;" alt="docker">
</div>

<br>

*Updates:*

- Feb 26, 2018: Updated to the latest versions of Node, React, and Nginx.
- Feb 14, 2018: Added an anonymous volume; detailed how to configure Nginx to work properly with React Router.
- Jan 17, 2018: Added a production build section that uses multistage Docker builds.

*We will be using:*

- Docker v17.12.0-ce
- Create React App v1.5.2
- Node v9.6.1

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Install [Create React App](https://github.com/facebookincubator/create-react-app):

```sh
$ npm install -g create-react-app@1.5.2
```

Generate a new app:

```sh
$ create-react-app sample-app
$ cd sample-app
```

## Docker

Add a *Dockerfile* to the project root:

```
# base image
FROM node:9.6.1

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install react-scripts@1.1.1 -g --silent

# start app
CMD ["npm", "start"]
```

> Silencing the NPM output, via `--silent`, is a personal choice. It's often frowned upon, though, since it can swallow errors. Keep this in mind so you don't waste time debugging.

Add a *.dockerignore*:

```
node_modules
```

This will greatly speed up the Docker build process as our local dependencies will not be sent to the Docker daemon.

Build and tag the Docker image:

```sh
$ docker build -t sample-app .
```

Then, spin up the container once the build is done:

```sh
$ docker run -it \
  -v ${PWD}:/usr/src/app \
  -v /usr/src/app/node_modules \
  -p 3000:3000 \
  --rm \
  sample-app
```

Open your browser to [http://localhost:3000/](http://localhost:3000/) and you should see the app. Try making a change to the `App` component within your code editor. You should see the app hot-reload. Kill the server once done.

Want to use [Docker Compose](https://docs.docker.com/compose/)? Add a *docker-compose.yml* file to the project root:

```yaml
version: '3.5'

services:

  sample-app:
    container_name: sample-app
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/usr/src/app'
      - '/usr/src/app/node_modules'
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
```

Take note of the volumes. Without the data volume (`'/usr/src/app/node_modules'`), the *node_modules* directory would be overwritten by the mounting of the host directory at runtime:

- *Build* - The `node_modules` directory is created.
- *Run* - The current directory is mounted into the container, overwriting the `node_modules` that were just installed when the container was built.

Build the image and fire up the container:

```sh
$ docker-compose up -d --build
```

Ensure the app is running in the browser and test hot-reloading again. Bring down the container before moving on:

```sh
$ docker-compose stop
```

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
$ docker build -t sample-app .

$ docker run -it \
  -v ${PWD}:/usr/src/app \
  -v /usr/src/app/node_modules \
  -p 3000:3000 \
  --rm sample-app
```

Test the app again in the browser at [http://DOCKER_MACHINE_IP:3000/](http://DOCKER_MACHINE_IP:3000/). Also, confirm that auto reload is *not* working. You can try with Docker Compose as well, but the result will be the same.

To get hot-reload working, we need to add an environment variable:

```sh
$ docker run -it \
  -v ${PWD}:/usr/src/app \
  -v /usr/src/app/node_modules \
  -p 3000:3000 \
  -e CHOKIDAR_USEPOLLING=true \
  --rm sample-app
```

Test it out again. You could add the variable to a *.env* file, however you  won't need it for a production build.

Updated *docker-compose.yml* file:

```yaml
version: '3.5'

services:

  sample-app:
    container_name: sample-app
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/usr/src/app'
      - '/usr/src/app/node_modules'
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
```

## Production

Let's create a separate Dockerfile for use in production called *Dockerfile-prod*:

```
# build environment
FROM node:9.6.1 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install react-scripts@1.1.1 -g --silent
COPY . /usr/src/app
RUN npm run build

# production environment
FROM nginx:1.13.9-alpine
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Here, we take advantage of [multistage builds](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) to create a temporary image used for building the artifact that is then copied over to the production image. The temporary build image is discarded along with the original files and folders associated with the image. This produces a lean, production-ready image.

> Check out the [Builder pattern vs. Multi-stage builds in Docker](https://blog.alexellis.io/mutli-stage-docker-builds/) blog post for more info on multistage builds.

Using the production Dockerfile, build and tag the Docker image:

```sh
$ docker build -f Dockerfile-prod -t sample-app-prod .
```

Spin up the container:

```sh
$ docker run -it -p 80:80 --rm sample-app-prod
```

Assuming you are still using the same Docker Machine, navigate to [http://DOCKER_MACHINE_IP](http://DOCKER_MACHINE_IP) in your browser.

Test with a new Docker Compose file as well called *docker-compose-prod.yml*:

```yaml
version: '3.5'

services:

  sample-app-prod:
    container_name: sample-app-prod
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

If you are using [React Router](https://reacttraining.com/react-router/), then you'll need to change the default Nginx config at build time:

```
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx
```

Add the changes to *Dockerfile-prod*:

```
# build environment
FROM node:9.6.1 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY package.json /usr/src/app/package.json
RUN npm install --silent
RUN npm install react-scripts@1.1.1 -g --silent
COPY . /usr/src/app
RUN npm run build

# production environment
FROM nginx:1.13.9-alpine
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create the following two folders along with a *default.conf* file:

```sh
└── conf
    └── conf.d
        └── default.conf
```

*default.conf*:

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

With that, you should now be able to add React to a larger Docker-powered project for both development and production environments. If you'd like to learn more about working with React and Docker along with building and testing microservices, check out [Microservices with Docker, Flask, and React](https://testdriven.io/).
