const { join } = require('path');
const { execSync } = require('child_process');
const fg = require('fast-glob');
const { gray, cyan } = require('chalk');
const { prompt } = require('inquirer');
const { valid, inc } = require('semver');
const { writeFile } = require('fs-extra');
const { warning } = require('log-symbols');

class PackageInfo {
  constructor(path, data) {
    this.path = path;
    this.data = data;
    this.wasChanged = false;
  }
}

async function processVersions() {
  let rootPkg;
  try {
    rootPkg = require(join(process.cwd(), 'package.json'));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return console.warn(
        `${warning} I couldn't found a package.json in your current working directory. I assume to be executed in the root of a workspace based yarn project.`
      );
    } else {
      throw err;
    }
  }

  if (!rootPkg.workspaces) {
    return console.warn(
      `${warning} Your package.json doesn't contain a "workspaces" property. I assume to be executed in the root of a workspace based yarn project.`
    );
  }

  if (!Array.isArray(rootPkg.workspaces)) {
    throw `The "workspaces" property in your package.json isn't an array.`;
  }

  if (!rootPkg.workspaces.length) {
    return console.warn(
      `${warning} The "workspaces" property in your package.json is empty.`
    );
  }

  const pkgPaths = await fg(
    rootPkg.workspaces.map((pattern) => join(pattern, 'package.json'))
  );
  const pkgInfos = pkgPaths
    .map((path) => new PackageInfo(path, require(join(process.cwd(), path))))
    .filter(({ data }) => !data.private)
    .sort(
      ({ data: a }, { data: b }) =>
        a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );

  if (!pkgInfos.length) {
    const prettyWorkspaces = `["${rootPkg.workspaces.join('", "')}"]`;
    return console.warn(
      `${warning} I couldn't find non-private packages with the given workspace setting. ${gray(
        `(used config: ${prettyWorkspaces})`
      )}`
    );
  }

  pkgInfos.forEach(({ data: { name, version } }) => {
    if (!valid(version)) {
      throw `${error} The version "${version}" in your package "${name}" is not valid.`;
    }
  });

  for (const info of pkgInfos) {
    const { data: { name, version } } = info;
    const { shouldUpdate } = await prompt({
      name: 'shouldUpdate',
      message: `Do you want to update the version of ${cyan(name)}? ${gray(
        `(current version: ${version})`
      )}`,
      type: 'confirm',
      default: false
    });

    if (shouldUpdate) {
      const { chosenVersion } = await prompt({
        type: 'list',
        name: 'chosenVersion',
        message: 'What version update do you want to use?',
        choices: [
          'major',
          'minor',
          'patch',
          'premajor',
          'preminor',
          'prepatch',
          'prerelease'
        ].map((release) => {
          const value = inc(version, release);
          return {
            value,
            name: `${release} ${gray(`(${value})`)}`
          };
        })
      });

      info.data.version = chosenVersion;
      info.wasChanged = true;
    }
  }

  const changedPkgs = pkgInfos.filter(({ wasChanged }) => wasChanged);
  if (!changedPkgs.length) {
    return console.log('No change was found. ✌');
  }

  await Promise.all(
    changedPkgs.map(({ data, path }) =>
      writeFile(path, JSON.stringify(data, null, 2))
    )
  );
  const { shouldPush } = await prompt({
    name: 'shouldPush',
    message: `Should I commit and push all changes with tags?
${gray(
      `${changedPkgs
        .map(({ data: { name, version } }) => `  - ${name}@${version}\n`)
        .join('')}`
    )}`,
    type: 'confirm',
    default: false
  });

  if (!shouldPush) {
    return console.log(`I haven't committed or pushed the changes.`);
  }

  const stdio = 'inherit';
  execSync('git add .');
  execSync('git commit -m "release"');
  changedPkgs.forEach(({ data: { name, version } }) =>
    execSync(`git tag ${name}@${version}`)
  );
  execSync('git push');
  execSync('git push --tags');
}

exports.processVersions = processVersions;
