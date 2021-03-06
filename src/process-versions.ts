import { execSync } from 'child_process';
import chalk from 'chalk';
import { prompt } from 'inquirer';
import { valid, inc, ReleaseType } from 'semver';
import { writeFile } from 'fs-extra';
import { getRootPackage, getPackageInfos } from './packages';
import { WorkspaceReleaseWarning, WorkspaceReleaseError } from './errors';

const { gray, cyan } = chalk;

export async function processVersions() {
  const rootPkg = getRootPackage();
  const pkgInfos = (await getPackageInfos(rootPkg)).filter(
    ({ data }) => !data.private
  );

  if (!pkgInfos.length) {
    const prettyWorkspaces = `["${rootPkg.workspaces.join('", "')}"]`;
    throw new WorkspaceReleaseWarning(
      `I couldn't find non-private packages with the given workspace setting. ${gray(
        `(used config: ${prettyWorkspaces})`
      )}`
    );
  }

  pkgInfos.forEach(({ data: { name, version } }) => {
    if (!valid(version)) {
      throw new WorkspaceReleaseError(
        `The version "${version}" in your package "${name}" is not valid.`
      );
    }
  });

  for (const info of pkgInfos) {
    const {
      data: { name, version }
    } = info;
    const { shouldUpdate } = await prompt({
      name: 'shouldUpdate',
      message: `Do you want to update the version of ${cyan(name)}? ${gray(
        `(current version: ${version})`
      )}`,
      type: 'confirm',
      default: false
    });

    if (shouldUpdate) {
      const releaseTypes: ReleaseType[] = [
        'prerelease',
        'prepatch',
        'preminor',
        'premajor',
        'patch',
        'minor',
        'major'
      ];
      const { chosenVersion } = await prompt({
        type: 'list',
        name: 'chosenVersion',
        message: 'What version update do you want to use?',
        choices: releaseTypes.map((release) => {
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
    changedPkgs.map(({ data, file }) =>
      writeFile(file, JSON.stringify(data, null, 2))
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

  execSync('git add .');
  execSync('git commit -m "release"');
  changedPkgs.forEach(({ data: { name, version } }) =>
    execSync(`git tag ${name}@${version}`)
  );
  execSync('git push');
  execSync('git push --tags');
}
