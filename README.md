# `workspace-release` 🚚

A simple script which makes it easier to publish npm packages from yarn workspace based projects via Travis.

> **Disclaimer**: Don't expect this package to be full featured and super well maintained. At least for now it was mainly a proof-of-concept for myself.

You'd probably want to install this package as a dev depenendency in your workspace root:

```
$ yarn add -D workspace-release -W
```

I expect a global environment variable called `NPM_TOKEN` being available for publishing. To store it in a secure way you need to install the Travis terminal client. Now run `$ travis encrypt NPM_TOKEN={YOUR-TOKEN} --add env.global` where `{YOUR-TOKEN}` is this `authToken` you see in in your `.npmrc` after you logged into npm at least once. (I also assume that you already created a `.travis.yml`.)

To change the `registry`, `tag` or `access` use [`publishConfig` in your `package.json`](https://docs.npmjs.com/files/package.json#publishconfig). If `tag` is not set, if will be _automatically_ set to `'next'` for prereleases (versions containing a `'-'`) and to `'latest'` for everything else.

You can look into a [working example here](https://github.com/donaldpipowitch/workspace-release-demo).