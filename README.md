# mherman.org

[![Build Status](https://travis-ci.org/mjhea0/mjhea0.github.com.svg?branch=backup)](https://travis-ci.org/mjhea0/mjhea0.github.com)

### Run locally

```sh
$ bundle exec jekyll serve
```

### Deploy

```sh
# generate build locally
$ JEKYLL_ENV=production bundle exec jekyll build

# commit and push to 'backup' branch
$ git push origin master:backup

# if travis build passes, deploy
$ git subtree push --prefix _site origin master
```
