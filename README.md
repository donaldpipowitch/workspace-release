# `workspace-release`

A simple script which makes it easier to publish npm packages from yarn workspace based projects via Travis. You can use it if you want or make Pull Requests, but don't expect this project to be super well maintained.

I expect a global environment variable called `NPM_TOKEN` being available for publishing. To store it in a secure way you need to install the Travis terminal client. Now run `$ travis encrypt NPM_AUTH_TOKEN={YOUR-TOKEN} --add env.global` where `{YOUR-TOKEN}` is this `authToken` you see in in your `.npmrc` after you logged into npm at least once. (I also assume that you already created a `.travis.yml`.)

You'd probably want to install this package as a dev depenendency in your workspace root:

```
$ yarn add -D workspace-release -W
```

To change the `registry`, `tag` or `access` use [`publishConfig` in your `package.json`](https://docs.npmjs.com/files/package.json#publishconfig). The `tag`