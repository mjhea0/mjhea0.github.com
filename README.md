# mherman.org

### Run locally

```sh
$ bundle exec jekyll serve
```

### Deploy

```sh
# generate build
$ JEKYLL_ENV=production bundle exec jekyll build
# deploy
$ git subtree push --prefix _site origin master
# backup
git push origin master:backup
```
