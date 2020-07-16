---
layout: post
title: "Deploying a Jekyll Site to Netlify with Docker and GitLab CI"
date: 2020-03-01
last_modified_at: 2020-03-01
comments: true
toc: true
categories: [docker, devops]
keywords: "jekyll netlify, docker jekyll, gitlab netlify, gitlab docker, gitlab jekyll"
description: "Step-by-step guide covering how to automatically deploy a Jekyll site to Netlify using Docker and GitLab CI."
---

This is a step-by-step guide covering how to automatically deploy a [Jekyll](https://jekyllrb.com/) site to [Netlify](https://www.netlify.com/) using [Docker](https://www.docker.com/) and [GitLab CI/CD](https://about.gitlab.com/stages-devops-lifecycle/continuous-integration/).

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Assumptions

This post assumes that have already set up a GitLab repository and a Netlify site. Your Jekyll site should have the following project structure as well:

```sh
├── .gitignore
└── src
    ├── 404.html
    ├── Gemfile
    ├── Gemfile.lock
    ├── _config.yml
    ├── _posts
    ├── about.markdown
    └── index.markdown
```

## Docker Setup

Let's start by setting up a Dockerfile based on the [jekyll/jekyll](https://hub.docker.com/r/jekyll/jekyll/) Docker image to manage a compatible Ruby version for Jekyll along with [bundler](https://bundler.io/) and all the [RubyGems](https://rubygems.org/).

Add the *Dockerfile* to the project root:

```dockerfile
FROM jekyll/jekyll:3.8.0

WORKDIR /tmp

ENV BUNDLER_VERSION 2.1.4
ENV NOKOGIRI_USE_SYSTEM_LIBRARIES 1

ADD ./src/Gemfile /tmp/
ADD ./src/Gemfile.lock /tmp/

RUN gem install bundler -i /usr/gem -v 2.1.4
RUN bundle install

WORKDIR /srv/jekyll
```

Build and tag the image:

```sh
$ docker build --tag jekyll-docker .
```

Once built, spin up the container like so to serve up the site locally on port 4000:

```sh
$ docker run \
  -d -v $PWD/src:/srv/jekyll -p 4000:4000 \
  jekyll-docker bundle exec jekyll serve -H 0.0.0.0
```

Make sure the site is up at [http://localhost:4000/](http://localhost:4000/).

Bring down the container once done:

```
sh docker stop $(docker ps -q --filter ancestor=jekyll-docker)
```

## GitLab Build

With that, to configure the GitLab CI pipeline associated with the repo, add a *.gitlab-ci.yml* file to the project root:

```yaml
image: docker:stable

services:
  - docker:dind

stages:
  - build

variables:
  IMAGE: ${CI_REGISTRY}/${CI_PROJECT_NAMESPACE}/${CI_PROJECT_NAME}

build:
  stage: build
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_JOB_TOKEN $CI_REGISTRY
    - docker pull $IMAGE:latest || true
    - docker build --cache-from $IMAGE:latest --tag $IMAGE:latest .
    - docker push $IMAGE:latest
    - docker run -v $PWD/src:/srv/jekyll $IMAGE:latest bundle exec jekyll build
```

Here, using [Docker-in-Docker](https://hub.docker.com/_/docker), we defined a single [stage](https://docs.gitlab.com/ee/ci/yaml/#stages) called `build` that:

1. Logs in to the GitLab Container Registry
1. Pulls the previously pushed image (if it exists)
1. Builds and tags the new image
1. Pushes the image up to the GitLab [Container Registry](https://docs.gitlab.com/ee/user/packages/container_registry/)
1. Creates a Jekyll build

Commit your code and push it up to GitLab. This should trigger a new build, which should pass. You should also see the image in the Container Registry:

<div style="text-align:center;">
  <img src="/assets/img/blog/jekyll-netlify-gitlab/gitlab-container-registry.png" style="max-width:90%;border:0;box-shadow:none;margin-bottom:20px;" alt="gitlab container registry">
</div>

This first build should take between five to six minutes to complete. Subsequent builds will be much faster since they will leverage Docker layer caching.

> For more on caching check out [Faster CI Builds with Docker Cache](https://testdriven.io/blog/faster-ci-builds-with-docker-cache/).

## Netlify API Deployment

Next, to use the [Netlify API](https://docs.netlify.com/api/get-started/) to [deploy](https://docs.netlify.com/api/get-started/#deploy-via-api) the Jekyll site, add the following to a *deploy.sh* script in the project root:

```sh
#!/usr/bin/env bash

zip -r website.zip ./src/_site

curl -H "Content-Type: application/zip" \
      -H "Authorization: Bearer $NETLIFY_ACCESS_TOKEN" \
      --data-binary "@website.zip" \
      https://api.netlify.com/api/v1/sites/$NETLIFY_SUBDOMAIN.netlify.com/deploys
```

To test locally, you'll first need to create an access token (if you haven't already done so), which can be [obtained](https://docs.netlify.com/cli/get-started/#authentication) from either the command line or the Netlify UI.

Once obtained, set it as an environment variable along with your Netlify subdomain:

```sh
$ export NETLIFY_ACCESS_TOKEN=<your_access_token>
$ export NETLIFY_SUBDOMAIN=<your_subdomain>
```

Generate the static files:

```sh
$ docker run \
  -v $PWD/src:/srv/jekyll -p 4000:4000 \
  jekyll-docker bundle exec jekyll build
```

Make sure the "src/_site" directory was created before deploying the site:

```sh
$ chmod +x deploy.sh
$ ./deploy.sh
```

So, after zipping the "src/_site" directory, we sent a POST request to `https://api.netlify.com/api/v1/sites/$NETLIFY_SUBDOMAIN.netlify.com/deploys` with the zip file in the HTTP request body.

Make sure the site was deployed before moving on.

## GitLab Deploy

Finally, to automate the deploy, add a new stage to the *.gitlab-ci.yml* file, called `deploy`, to deploy the site to Netlify after a successful build:

```yaml
image: docker:stable

services:
  - docker:dind

stages:
  - build
  - deploy

variables:
  IMAGE: ${CI_REGISTRY}/${CI_PROJECT_NAMESPACE}/${CI_PROJECT_NAME}

build:
  stage: build
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_JOB_TOKEN $CI_REGISTRY
    - docker pull $IMAGE:latest || true
    - docker build --cache-from $IMAGE:latest --tag $IMAGE:latest .
    - docker push $IMAGE:latest
    - docker run -v $PWD/src:/srv/jekyll $IMAGE:latest bundle exec jekyll build
  artifacts:
    paths:
      - src/_site

deploy:
  stage: deploy
  script:
    - apk add --update zip curl
    - chmod +x ./deploy.sh
    - /bin/sh ./deploy.sh


  artifacts:
    paths:
      - src/_site
```

Take note of the new [artifacts](https://docs.gitlab.com/ee/user/project/pipelines/job_artifacts.html) definition added to the `build` stage:

```yaml
artifacts:
  paths:
    - src/_site
```

If the `build` stage succeeds, the generated static files from the *src/_site* directory -- the result of `docker run -v $PWD/src:/srv/jekyll $IMAGE:latest bundle exec jekyll build` -- will be passed on to subsequent stages.

Add the `NETLIFY_ACCESS_TOKEN` and `NETLIFY_SUBDOMAIN` variables to your project's CI/CD settings: Settings > CI / CD > Variables:

<div style="text-align:center;">
  <img src="/assets/img/blog/jekyll-netlify-gitlab/gitlab-variables.png" style="max-width:90%;border:0;box-shadow:none;margin-bottom:20px;" alt="gitlab variables">
</div>

Commit your code and push it up again to GitLab to trigger a new build. After the `build` stage completes, you should be able to see the artifact on the job page:

<div style="text-align:center;">
  <img src="/assets/img/blog/jekyll-netlify-gitlab/gitlab-job-artifact.png" style="max-width:90%;border:0;box-shadow:none;margin-bottom:20px;" alt="gitlab job artifact">
</div>

The site should be deployed during the `deploy` stage.

---

You can find the code in the [jekyll-netlify-gitlab](https://gitlab.com/michaelherman/jekyll-netlify-gitlab) repo on GitLab.
