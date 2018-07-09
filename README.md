# `workspace-release` 🚚

A simple script which makes it easier to publish npm packages from yarn workspace based projects via Travis.

> **Disclaimer**: Don't expect this package to be full featured and super well maintained. At least for now it was mainly a proof-of-concept for myself.

You'd probably want to install this package as a dev depenendency in your workspace root:

```
$ yarn add -D workspace-release -W
```

This package comes with two scripts:
- `workspace-version`: You call this one locally in your project to set new versions for your packages. Just run `$ yarn workspace-version`.
- `workspace-publish`: This script will be called by Travis on tag. In simple cases you can just add `if [ -n "$TRAVIS_TAG" ]; then node node_modules/.bin/workspace-publish; fi` in the `scripts` section of your `.travis.yml` for this (see this [example](https://github.com/donaldpipowitch/workspace-release-demo/blob/6edcad43da8b98de4056f7c47ef674e1c0e78651/.travis.yml#L15)). If you have a matrix build (e.g. because you test your package against multiple Node versions) you probably want to create a deploy stage, so that the package will only be deployed, if all tests were successful (see this [example](https://github.com/donaldpipowitch/pipo-scripts/blob/dfd6bb19712425ba4b80812d35c5fe57e3579b4f/.travis.yml#L15)). If you need to build you project before publishing make sure to either do it manually before calling `workspace-publish` or do it in your `preversion` lifecycle for example.

I expect a global environment variable called `NPM_TOKEN` being available for publishing. To store it in a secure way you need to install the Travis terminal client (either by following [these instructions](https://github.com/travis-ci/travis.rb#installation) or by running `$ brew install travis` on a Mac). Now run `$ travis encrypt NPM_TOKEN={YOUR-TOKEN} --add env.global` where `{YOUR-TOKEN}` is this `authToken` you see in in your `.npmrc` after you logged into npm at least once. (I also assume that you already created a `.travis.yml`.)

To change the `registry`, `tag` or `access` use [`publishConfig` in your `package.json`](https://docs.npmjs.com/files/package.json#publishconfig). If `tag` is not set, if will be _automatically_ set to `'next'` for prereleases (versions containing a `'-'`) and to `'latest'` for everything else.

You can look into a [basic example here](https://github.com/donaldpipowitch/workspace-release-demo) and [a more complex example here](https://github.com/donaldpipowitch/pipo-scripts).

Lifecycle events for `$ npm version` and `$ npm publish` are run as usual - but only on Travis' side and _not_ locally.

(Note: This project itself is currently released without `workspace-release`. It uses plain old `$ npm version patch && git push && npm publish`.)
