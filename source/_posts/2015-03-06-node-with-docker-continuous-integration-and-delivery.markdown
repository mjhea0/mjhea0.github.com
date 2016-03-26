---
layout: post
toc: true
title: "Node with Docker - continuous integration and delivery"
date: 2015-03-06 08:05
comments: true
categories: docker
keywords: "node, docker, web development, express, continuous integration, tutum, docker compose, continuous delivery"
description: "This article details how to set up your local development environment with Docker as well as continuous integration and delivery, step by step."
---

Welcome.

**This is a quick start guide for spinning up Docker containers that run NodeJS and Redis. We’ll look at a basic development workflow to manage the local development of an app, on Mac OS X, as well as continuous integration and delivery, step by step.**

<div style="text-align:center;">
  <img src="https://raw.githubusercontent.com/mjhea0/node-docker-workflow/master/_presentation/images/logo.png" style="max-width: 100%; border:0;" alt="logo">
</div>

<br>

**Updates**:
  - *October 18th, 2015* - Upgraded to the latest versions of Docker (1.8.3), Docker Compose (1.4.2), and NodeJS (4.1.1). Added Docker Machine (0.4.1).
  - *May 13th, 2015* - Upgraded to the latest versions of Docker (1.6.1), boot2docker (1.6.1), and Docker Compose (1.2.0)

> This tutorial is ported from [Docker in Action - Fitter, Happier, More Productive](https://realpython.com/blog/python/docker-in-action-fitter-happier-more-productive/).

We'll be using the following tools, technologies, and services in this post:

1. [NodeJS](http://nodejs.org/) v4.1.1
1. [Express](http://expressjs.com/) v4.13.3
1. [Redis](http://redis.io/) v2.2.5
1. [Docker](https://www.docker.com/) v1.8.3
1. [Docker Compose](https://docs.docker.com/compose/) v1.4.2
1. [Docker Machine](https://docs.docker.com/machine/) v0.4.1
1. [Docker Hub](https://hub.docker.com/)
1. [CircleCI](https://circleci.com/)
1. [Digital Ocean](https://www.digitalocean.com/)
1. [Tutum](https://www.tutum.co/)

> There's slides too! Check them out [here](http://realpython.github.io/fitter-happier-docker/node.html#/), if interested.

## Docker?

Be sure you understand the Docker basics before diving into this tutorial. Check out the official ["What is Docker?"](https://www.docker.com/whatisdocker/) guide for an excellent intro.

In short, with Docker, you can truly mimic your production environment on your local machine. No more having to debug environment specific bugs or worrying that your app will perform differently in production.

1. Version control for infrastructure
1. Easily distribute/recreate your entire development environment
1. Build once, run anywhere – aka The Holy Grail!

### Docker-specific terms

- A *Dockerfile is a file that contains a set of instructions used to create an *image*.
- An *image* is used to build and save snapshots (the state) of an environment.
- A *container* is an instantiated, live *image* that runs a collection of processes.

> Be sure to check out the Docker [documentation](https://docs.docker.com/) for more info on [Dockerfiles](https://docs.docker.com/reference/builder/), [images](https://docs.docker.com/terms/image/), and [containers](https://docs.docker.com/terms/container/).

## Local Setup

Let's get your local development environment set up!

### Get Docker

Follow the download instructions from the guide [Installing Docker on Mac OS X](https://docs.docker.com/installation/mac/) to install the Docker client along with-
  - [Docker Machine](https://docs.docker.com/machine/) for creating Docker hosts both locally and in the cloud
  - [Docker Compose](https://docs.docker.com/compose/) for orchestrating a multi-container application into a single app

Once installed, let's run a quick sanity check to ensure Docker is installed correctly. Start by creating a Docker VM by running the "Docker Quickstart Terminal" application. If all went well, you should see something similar to in your terminal:

```sh
bash --login '/Applications/Docker/Docker Quickstart Terminal.app/Contents/Resources/Scripts/start.sh'
➜  ~  bash --login '/Applications/Docker/Docker Quickstart Terminal.app/Contents/Resources/Scripts/start.sh'
Creating Machine default...
Creating CA: /Users/michaelherman/.docker/machine/certs/ca.pem
Creating client certificate: /Users/michaelherman/.docker/machine/certs/cert.pem
Creating VirtualBox VM...
Creating SSH key...
Starting VirtualBox VM...
Starting VM...
To see how to connect Docker to this machine, run: docker-machine env default
Starting machine default...
Started machines may have new IP addresses. You may need to re-run the `docker-machine env` command.
Setting environment variables for machine default...


                        ##         .
                  ## ## ##        ==
               ## ## ## ## ##    ===
           /"""""""""""""""""\___/ ===
      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~
           \______ o           __/
             \    \         __/
              \____\_______/


docker is configured to use the default machine with IP 192.168.99.100
For help getting started, check out the docs at https://docs.docker.com
```

Now let's create a new container:

```sh
$ docker run hello-world
```

You should see:

```sh
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
b901d36b6f2f: Pull complete
0a6ba66e537a: Pull complete
Digest: sha256:517f03be3f8169d84711c9ffb2b3235a4d27c1eb4ad147f6248c8040adb93113
Status: Downloaded newer image for hello-world:latest

Hello from Docker.
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker Hub account:
 https://hub.docker.com

For more examples and ideas, visit:
 https://docs.docker.com/userguide/
```

With that, let's create our Node Project...

### Get the Project

Grab the base code from the [repo](https://github.com/mjhea0/node-docker-workflow/releases/tag/v2), and add it to your project directory:

```sh
└── app
    ├── Dockerfile
    ├── index.js
    ├── package.json
    └── test
        └── test.js
```

### Docker Machine

Within your project directory, start Docker Machine:

```sh
$ docker-machine create -d virtualbox dev;
```

This command, `create`, setup a new "Machine" (called `dev`) for local Docker development. Now we just need to point Docker at this specific Machine:

```sh
eval "$(docker-machine env dev)"
```

You now should have two Machines running:

```sh
$ docker-machine  ls
NAME      ACTIVE   DRIVER       STATE     URL                         SWARM
default            virtualbox   Running   tcp://192.168.99.100:2376
dev       *        virtualbox   Running   tcp://192.168.99.102:2376
```

> Make sure the `dev` is the active Machine.

### Compose Up!

[Docker Compose](https://github.com/docker/compose) (Previously known as fig) is an orchestration framework that handles the building and running of multiple services, making it easy to link multiple services together running in different containers.

Make sure Compose is set up correctly:

```sh
$ docker-compose -v
docker-compose version: 1.4.2
```

Now we just need to define the services - web (NodeJS) and persistence (Redis) in a configuration file called  *docker-compose.yml*:

```yaml
web:
  build: ./app
  volumes:
    - "./app:/src/app"
  ports:
    - "80:3000"
  links:
   - redis
redis:
    image: redis:latest
    ports:
        - "6379:6379"
```

Here we add the services that make up our basic stack:

1. **web**: First, we build the image based on the instructions in the *app/Dockerfile* - where we setup our Node environment, create a volume, install the required dependencies, and fire up the app running on port 3000. Then we forward that port in the container to port 80 on the host environment - e.g., the Docker VM.
1. **redis**: Next, the Redis service is built from the [image](https://registry.hub.docker.com/_/redis/) on Docker Hub. Port 6379 is exposed and forwarded.

### Profit

Run `docker-compose up` to build new images for the NodeJS/Express app and Redis services and then run both processes in new containers. Grab a cup of coffee. Or go for a long walk. This will take a while the first time you run it. Subsequent builds run much quicker since Docker [caches](https://docs.docker.com/articles/dockerfile_best-practices/#build-cache) the results from the first build.

Open your browser and navigate to the IP address associated with the Docker VM (`docker-machine ip dev`). You should see the text, "You have viewed this page 1 times!" in your browser. Refresh. The page counter should increment.

Once done, kill the processes (Ctrl-C). Commit your changes locally, and then push to Github.

### Next Steps

So, what did we accomplish?

We set up our local environment, detailing the basic process of building an *image* from a *Dockerfile* and then creating an instance of the image called a *container*. We then tied everything together with Docker Compose to build and connect different containers for both the NodeJS/Express app and Redis process.

Need the updated code? Grab it from the [repo](https://github.com/mjhea0/node-docker-workflow/releases/tag/v2b).

Next, let’s talk about Continuous Integration...

## Continuous Integration

We'll start with Docker Hub.

### Docker Hub

[Docker Hub](https://hub.docker.com/) "manages the lifecycle of distributed apps with cloud services for building and sharing containers and automating workflows". It's the Github for Docker images.

1. [Signup](https://hub.docker.com/account/signup/) using your Github credentials.
1. [Set up](http://docs.docker.com/docker-hub/builds/#about-automated-builds) a new automated build. And add your Github repo that you created and pushed to earlier. Just accept all the default options, expect for the "Dockerfile Location" - change that to "/app".

Each time you push to Github, Docker Hub will generate a new build from scratch.

Docker Hub acts much like a continuous integration server since it ensures you do not cause a regression that completely breaks the build process when the code base is updated. That said, Docker Hub should be the last test before deployment to either staging or production so let's use a *true* continuous integration server to fully test our code before it hits Docker Hub.

### CircleCI

[CircleCI](https://circleci.com/) is a CI platform that supports Docker.

Given a Dockerfile, CircleCI builds an image, starts a new container (or containers), and then runs tests inside that container.

1. [Sign up](https://circleci.com/) with your Github account.
1. Create a new project using the Github repo you created.

Next we need to add a configuration file, called *circle.yml*, to the root folder of the project so that CircleCI can properly create the build.

```yaml
machine:
  services:
    - docker

dependencies:
  override:
    - sudo pip install --upgrade docker-compose==1.3.3

test:
  override:
    - docker-compose run -d --no-deps web
    - cd app; mocha
```

Here, we install Docker Compose, create a new image, and run the container along with our unit tests.

> Notice how we’re using the command `docker-compose run -d --no-deps web`, to run the web process, instead of `docker-compose up`. This is because CircleCI already has Redis [running](https://circleci.com/docs/environment#databases) and available to us for our tests. So, we just need to run the web process.

Before we test this out, we need to change some settings on Docker Hub.

### Docker Hub (redux)

Right now, each push to Github will create a new build. That's not what we want. Instead, we want CircleCI to run tests against the master branch then *after* they pass (and only after they pass), a new build should trigger on Docker Hub.

Open your repository on Docker Hub, and make the following updates:

1. Click *Build Settings*.
1. Uncheck the *Activate Auto-build* box: "When activated, your image will build automatically when your source code repo is pushed.". Save the changes.
1. Then once again under *Build Settings* scroll down to *Build Triggers*.
1. Active the *Trigger Status*.
1. Copy the curl command that "Trigger all tags/branches for this automated build" – i.e., `curl -H "Content-Type: application/json" --data '{"build": true}' -X POST https://registry.hub.docker.com/u/mjhea0/node-docker-workflow/trigger/e80163ce-9f98-40ba-8498-c84538917fbc/`.

### CircleCI (redux)

Back on CircleCI, let's add that curl command as an environment variable:

1. Within the *Project Settings*, select *Environment variables*.
1. Add a new variable with the name "DEPLOY" and paste the curl command as the value.

Then add the following code to the bottom of the *circle.yml* file:

```yaml
deployment:
  hub:
    branch: master
    commands:
      - $DEPLOY
```

This simply fires the `$DEPLOY` variable after our tests pass on the master branch.

Now, let's test!

### Profit!

Follow these steps...

1. Create a new branch
1. Make changes locally
1. Push changes to Github
1. Issue a pull request
1. Manually merge into Master once the tests pass
1. Once the second round passes, a new build is triggered on Docker Hub

What's left? Deployment! Grab the updated [code](https://github.com/mjhea0/node-docker-workflow/releases/tag/v2c), if necessary.

## Deployment

Let's get our app running on [Digital Ocean](https://www.digitalocean.com/).

After you've signed up and [set up an SSH key](https://www.digitalocean.com/community/tutorials/how-to-use-ssh-keys-with-digitalocean-droplets), create a new $5 Droplet, choose "Applications" and then select the Docker Application.

Once setup, SSH into the server as the 'root' user:

```sh
$ ssh root@<some_ip_address>
```

Now you just need to clone the repo, install Docker compose, and then you can run your app:

```sh
$ git clone https://github.com/mjhea0/node-docker-workflow.git
$ curl -L https://github.com/docker/compose/releases/download/1.4.2/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
$ chmod +x /usr/local/bin/docker-compose
$ docker-compose up -d
```

Sanity check. Navigate to your Droplet’s IP address in the browser. You should see your app.

Nice!

But what about continuous delivery? Instead of having to SSH into the server and clone the new code, the process should be part of our workflow so that once a new build is generated on Docker Hub, the code is updated on Digital Ocean automatically.

Enter [Tutum](https://www.tutum.co/).

## Continuous Delivery

[Tutum](https://www.tutum.co/) manages the orchestration and deployment of Docker images and containers. Setup is simple. After you've signed up (with Github), you need to add a [Node](https://support.tutum.co/support/solutions/articles/5000523221-your-first-node), which is just a Linux host. We'll use Digital Ocean.

Start by linking your Digital Ocean account within the "Account Info" area.

Now you can add a new Node. The process is straightforward, but if you need help, please refer to the [official documentation](https://support.tutum.co/support/solutions/articles/5000523221-your-first-node). Just add a name, select a region, and then you're good to go.

With a Node setup, we can now add a [Stack](https://support.tutum.co/support/solutions/articles/5000569899-stacks) of services - *web* and *Redis*, in our case - that make up our tech stack. Next, create a new file called *tutum.yml*, and add the following code:

```yaml
web:
  image: mjhea0/node-docker-workflow
  autorestart: always
  ports:
    - "80:3000"
  links:
   - "redis:redis"
redis:
    image: redis
    autorestart: always
    ports:
        - "6379:6379"
```

Here, we are pulling the images from Docker Hub and building them just like we did with Docker Compose. Notice the difference here, between this file and the *docker-compose.yml* file. Here, we are not creating images, we're pulling them in from Docker Hub. It's essentially the same thing since the most updated build is on Docker Hub.

Now just create a new Stack, adding a name and uploading the *tutum.yml* file, and click "Create and deploy" to pull in the new images on the Node and then build and run the containers.

Once done, you can view your live app!

> Note: You lose the "magic" of Tutum when running things in a single host, as we're currently doing. In a real world scenario you'd want to deploy multiple web containers, load balance across them and have them live on different hosts, sharing a single REDIS cache. We may look at this in a future post, focusing solely on delivery.

Before we call it quits, we need to sync Docker Hub with Tutum so that when a new build is created on Docker Hub, the services are rebuilt and redeployed on Tutum - automatically!

Tutum makes this simple.

Under the *Services* tab, click the *web* service, and, finally, click the *Webhooks tab*. To create a new hook, simply add a name and then click *Add*. Copy the URL, and then navigate back to Docker Hub. Once there, click the *Webhook* link and add a new hook, pasting in the URL.

Now after a build is created on Docker Hub, a POST request is sent to that URL, which, in turn, triggers a redeploy on Tutum. Boom!

## Conclusion

As always comment below if you have questions. If you manage a different workflow for continuous integration and delivery, please post the details below. Grab the final code from the [repo](https://github.com/mjhea0/node-docker-workflow).

See you next time!

