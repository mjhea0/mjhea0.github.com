---
layout: post
title: "Pulling Images From Private Docker Registries on GitLab CI"
date: 2020-07-16
last_modified_at: 2020-07-16
comments: true
toc: true
categories: [docker, devops]
keywords: "gitlab docker, gitlab docker private registry, gitlab ecr"
description: "Step-by-step guide covering how to use an image from a private Docker registry as the base for GitLab Runner's Docker executor."
---

Want to use an image from a private Docker registry as the base for GitLab Runner's Docker executor?

[ECR](https://aws.amazon.com/ecr/) example:

```yaml
<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<NAMESPACE>:<TAG>
```

Full job:

```yaml
test:api:dev:
  stage: test
  image: <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<NAMESPACE>:<TAG>
  services:
    - postgres:latest
    - redis:latest
  variables:
    POSTGRES_DB: data_api
    POSTGRES_USER: runner
    POSTGRES_PASSWORD: runner
    DATABASE_URL: postgres://runner:runner@postgres:5432/data_api
  script:
    - cd api
    - export DEBUG=1
    - export ENVIRONMENT=dev
    - export CELERY_BROKER_URL=redis://redis
    - export CELERY_RESULT_BACKEND=redis://redis
    - python -m pytest -p no:warnings .
    - flake8 .
    - black --exclude="migrations|env" --check .
    - isort --skip=migrations --skip=env --check-only
    - export DEBUG=0
    - export ENVIRONMENT=prod
    - python manage.py check --deploy --fail-level=WARNING
```

Assuming the image exists on the registry, you can set the `DOCKER_AUTH_CONFIG` variable within your project's Settings > CI/CD page:

```json
"auths": {
  "registry.example.com:5000": {
    "auth": "TBD"
  }
}
```

The value of `auth` is a base64-encoded version of your username and password that you use to authenticate into the registry:

```sh
$ echo -n "my_username:my_password" | base64
```

Continuing with the ECR example, you can generate a password using the following command:

```sh
$ docker run --rm \
    -e AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID> \
    -e AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY> \
    amazon/aws-cli ecr get-login-password \
        --region <AWS_REGION>
```

To test, run:

```sh
$ docker login -u AWS -p <GENERATED_PASSWORD> <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com

Login Succeeded
```

Now, add the `DOCKER_AUTH_CONFIG` variable to your project's Settings > CI/CD page:

```json
"auths": {
  "registry.example.com:5000": {
    "auth": "<GENERATED_PASSWORD>"
  }
}
```

Test out your build. You should see something similar to the following in your logs, indicating that the login was successful:

```sh
Authenticating with credentials from $DOCKER_AUTH_CONFIG
Pulling docker image [MASKED].dkr.ecr.us-east-1.amazonaws.com/api:latest ...
```

Unfortunately, we're not done yet since the generated password/token from the [get-login-password](https://docs.aws.amazon.com/cli/latest/reference/ecr/get-login-password.html) command is only valid for 12 hours. So, we need to dynamically update the `DOCKER_AUTH_CONFIG` variable with a new password. We can set up a new job for this:

```yaml
build:aws_auth:
  stage: build
  services:
    - docker:dind
  image: docker:stable
  variables:
    DOCKER_DRIVER: overlay2
    DOCKER_BUILDKIT: 1
  script:
    - export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
    - export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
    - export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
    - export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
    - export TOKEN=$TOKEN
    - export PROJECT_ID=$PROJECT_ID
    - apk add --no-cache curl jq bash
    - chmod +x ./aws_auth.sh
    - bash ./aws_auth.sh
```

Here, after exporting the appropriate environment variables (so we can access them in the *aws_auth.sh* script), we installed the appropriate dependencies, and then ran the *aws_auth.sh* script.

*aws_auth.sh*:

```sh
#!/bin/sh

set -e

AWS_PASSWORD=$(docker run --rm \
    -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    amazon/aws-cli ecr get-login-password \
    --region $AWS_DEFAULT_REGION)
ENCODED=$(echo -n "AWS:$AWS_PASSWORD" | base64)
PAYLOAD=$( jq -n --arg userpass "$ENCODED" '{"auths": {"263993132376.dkr.ecr.us-east-1.amazonaws.com": {"auth": $userpass}}}' )
curl --request PUT --header "PRIVATE-TOKEN:$TOKEN" "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables/DOCKER_AUTH_CONFIG" --form "value=$PAYLOAD"
```

What's happening?

1. We generated a new password from the `get-login-password` command and assigned it to `AWS_PASSWORD`
1. We then base64 encoded the username and password and assigned it to `ENCODED`
1. We used jq to create the necessary JSON for the value of the `DOCKER_AUTH_CONFIG` variable
1. Finally, using a GitLab [Personal access token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) we updated the `DOCKER_AUTH_CONFIG` variable

Make sure to add all variables you project's Settings > CI/CD page.

Now, the `DOCKER_AUTH_CONFIG` variable should be updated with a new password for each build.

That's it!

--

Helpful Resources:

1. GitLab Runner Issue Thread - [Pull images from aws ecr or private registry](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/1583)
1. GitLab Docs - [Define an image from a private Container Registry](https://docs.gitlab.com/ee/ci/docker/using_docker_images.html#define-an-image-from-a-private-container-registry)
