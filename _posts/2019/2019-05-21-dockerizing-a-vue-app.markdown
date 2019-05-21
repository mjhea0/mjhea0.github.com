---
layout: post
title: "Dockerizing a Vue App"
date: 2019-05-21
last_modified_at: 2019-05-21
comments: true
toc: true
categories: [docker, vue]
keywords: "docker, vue, 'vuejs', 'javascript, containerization, vue-cli, vue cli, multistage builds, nginx"
description: "This tutorial looks at how to Dockerize a Vue app."
---

This tutorial looks at how to Dockerize a [Vue](https://vuejs.org/) app, built with the [Vue CLI](https://cli.vuejs.org/), using Docker along with Docker Compose and Docker Machine for both development and production. We'll specifically focus on-

1. Setting up a development environment with code hot-reloading
1. Configuring a production-ready image using multistage builds

*We will be using:*

- Docker v18.09.2
- Vue CLI v3.7.0
- Node v12.2.0

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Project Setup

Install the [Vue CLI](https://cli.vuejs.org/) globally:

```sh
$ npm install -g @vue/cli@3.7.0
```

Generate a new app, using the [default preset](https://cli.vuejs.org/guide/creating-a-project.html):

```sh
$ vue create my-app --default
$ cd my-app
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
RUN npm install
RUN npm install @vue/cli@3.7.0 -g

# start app
CMD ["npm", "run", "serve"]
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
$ docker build -t my-app:dev .
```

Then, spin up the container once the build is done:

```sh
$ docker run -v ${PWD}:/app -v /app/node_modules -p 8081:8080 --rm my-app:dev
```

What's happening here?

1. The [docker run](https://docs.docker.com/engine/reference/commandline/run/) command creates a new container instance, from the image we just created, and runs it.
1. `-v ${PWD}:/app` mounts the code into the container at "/app".

    > `{PWD}` may not work on Windows. See [this](https://stackoverflow.com/questions/41485217/mount-current-directory-as-a-volume-in-docker-on-windows-10) Stack Overflow question for more info.

1. Since we want to use the container version of the "node_modules" folder, we configured another volume: `-v /app/node_modules`. You should now be able to remove the local "node_modules" flavor.
1. `-p 8081:8080` exposes port 8080 to other Docker containers on the same network (for inter-container communication) and port 8081 to the host.

    > For more, review [this](https://stackoverflow.com/questions/22111060/what-is-the-difference-between-expose-and-publish-in-docker) Stack Overflow question.

1. Finally, `--rm` [removes](https://docs.docker.com/engine/reference/run/#clean-up---rm) the container and volumes after the container exits.

Open your browser to [http://localhost:8081](http://localhost:8081) and you should see the app. Try making a change to the `App` component (*src/App.vue*) within your code editor. You should see the app hot-reload. Kill the server once done.

> What happens when you add `-it`?
>
```sh
$ docker run -it -v ${PWD}:/app -v /app/node_modules -p 8081:8080 --rm my-app:dev
```
>
> Check your understanding and look this up on your own.

Want to use [Docker Compose](https://docs.docker.com/compose/)? Add a *docker-compose.yml* file to the project root:

```yaml
version: '3.7'

services:

  my-app:
    container_name: my-app
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/app'
      - '/app/node_modules'
    ports:
      - '8081:8080'
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

## Docker Machine

To get hot-reloading to work with [Docker Machine](https://docs.docker.com/machine/) and [VirtualBox](https://docs.docker.com/machine/get-started/) you'll need to enable a polling mechanism via [chokidar](https://github.com/paulmillr/chokidar) (which wraps `fs.watch`, `fs.watchFile`, and `fsevents`).

Create a new Machine:

```sh
$ docker-machine create -d virtualbox my-app
$ docker-machine env my-app
$ eval $(docker-machine env my-app)
```

Grab the IP address:

```sh
$ docker-machine ip my-app
```

Then, build the images:

```sh
$ docker build -t my-app:dev .
```

And run the container:

```sh
$ docker run -it -v ${PWD}:/app -v /app/node_modules -p 8081:8080 --rm my-app:dev
```

Test the app again in the browser at [http://DOCKER_MACHINE_IP:8081](http://DOCKER_MACHINE_IP:8081) (make sure to replace `DOCKER_MACHINE_IP` with the actual IP address of the Docker Machine). Also, confirm that auto reload is *not* working. You can try with Docker Compose as well, but the result will be the same.

To get hot-reload working, we need to add an environment variable: `CHOKIDAR_USEPOLLING=true`.

```sh
$ docker run -it -v ${PWD}:/app -v /app/node_modules -p 8081:8080 -e CHOKIDAR_USEPOLLING=true --rm my-app:dev
```

Test it out again. Then, kill the server and add the environment variable to the *docker-compose.yml* file:

```yaml
version: '3.7'

services:

  my-app:
    container_name: my-app
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - '.:/app'
      - '/app/node_modules'
    ports:
      - '8081:8080'
    environment:
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
RUN npm install @vue/cli@3.7.0 -g
COPY . /app
RUN npm run build

# production environment
FROM nginx:1.16.0-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Here, we take advantage of the [multistage build](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) pattern to create a temporary image used for building the artifact -- the production-ready Vue static files -- that is then copied over to the production image. The temporary build image is discarded along with the original files and folders associated with the image. This produces a lean, production-ready image.

> Check out the [Builder pattern vs. Multi-stage builds in Docker](https://blog.alexellis.io/mutli-stage-docker-builds/) blog post for more info on multistage builds.

Using the production Dockerfile, build and tag the Docker image:

```sh
$ docker build -f Dockerfile-prod -t my-app:prod .
```

Spin up the container:

```sh
$ docker run -it -p 80:80 --rm my-app:prod
```

Assuming you are still using the same Docker Machine, navigate to [http://DOCKER_MACHINE_IP/](http://DOCKER_MACHINE_IP/) in your browser.

Test with a new Docker Compose file as well called *docker-compose-prod.yml*:

```yaml
version: '3.7'

services:

  my-app-prod:
    container_name: my-app-prod
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

Test it out once more in your browser.

If you're done, go ahead and destroy the Machine:

```sh
$ eval $(docker-machine env -u)
$ docker-machine rm my-app
```

## Vue Router and Nginx

If you're using [Vue Router](https://router.vuejs.org/), then you'll need to change the default Nginx config at build time:

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
RUN npm install @vue/cli@3.7.0 -g
COPY . /app
RUN npm run build

# production environment
FROM nginx:1.16.0-alpine
COPY --from=build /app/dist /usr/share/nginx/html
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

---

Cheers!
