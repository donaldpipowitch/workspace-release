const { execSync } = require('child_process');
const { valid } = require('semver');
const { getRootPackage, getPackageInfos } = require('./packages');
const { WorkspaceReleaseWarning, WorkspaceReleaseError } = require('./errors');

function getNameVersionPair() {
  const { TRAVIS_TAG } = process.env;
  const isScopedPackage = TRAVIS_TAG[0] === '@';
  if (isScopedPackage) {
    const [name, version] = TRAVIS_TAG.substring(1).split('@');
    return ['@' + name, version];
  } else {
    return TRAVIS_TAG.split('@');
  }
}

function getTag(pkgInfo) {
  const isPrerelease = pkgInfo.data.version.includes('-');
  if (pkgInfo.data.publishConfig && pkgInfo.data.publishConfig.tag) {
    return `--tag ${pkgInfo.data.publishConfig.tag}`;
  } else if (isPrerelease) {
    return '--tag next';
  } else {
    return '--tag latest';
  }
}

function getAccess(pkgInfo) {
  if (pkgInfo.data.publishConfig && pkgInfo.data.publishConfig.access) {
    return `--access ${pkgInfo.data.publishConfig.access}`;
  } else {
    return '';
  }
}

async function publish() {
  const { TRAVIS_TAG } = process.env;
  if (!TRAVIS_TAG) {
    throw new WorkspaceReleaseError(
      `The environment variable "TRAVIS_TAG" seems to be undefined.`
    );
  }

  const isScopedPackage = TRAVIS_TAG[0] === '@';
  if (
    isScopedPackage
      ? !TRAVIS_TAG.substring(1).includes('@')
      : !TRAVIS_TAG.includes('@')
  ) {
    throw new WorkspaceReleaseWarning(
      `This tag doesn't seem to be a tag which should be used for publishing packages, because it misses a @ to separate package name and version.`
    );
  }

  const [name, version] = getNameVersionPair();
  if (!valid(version)) {
    throw new WorkspaceReleaseError(
      `The tagged version "${version}" for the package "${name}" is not a valid SemVer version.`
    );
  }

  const rootPkg = getRootPackage();
  const pkgInfo = (await getPackageInfos(rootPkg)).find(
    ({ data }) => data.name === name
  );

  if (!pkgInfo) {
    throw new WorkspaceReleaseError(
      `I couldn't found a package with name "${name}" in your workspace.`
    );
  }

  if (pkgInfo.data.version !== version) {
    throw new WorkspaceReleaseError(
      `The tagged version "${version}" and the version of "${
        pkgInfo.data.name
      }" in the package.json which is "${
        pkgInfo.data.version
      }" differ. This should not be the case, if workspace-release was used correctly.`
    );
  }

  const options = { cwd: pkgInfo.dir };

  // set auth token, which should be stored securely in process.env.NPM_TOKEN
  // damn... I can't use `const { setAuthToken } = require('npm-utils');` directly,
  // because I need to set cwd properly
  const setAuthTokenPath = require.resolve(
    'npm-utils/bin/set-auth-token-var-name.js'
  );
  execSync(`node ${setAuthTokenPath}`, options);

  // triggers normal lifecycle hooks, but we don't need to change anything
  execSync(
    `npm version --allow-same-version --no-git-tag-version ${version}`,
    options
  );

  const tag = getTag(pkgInfo);
  const access = getAccess(pkgInfo);
  execSync(`npm publish ${tag} ${access}`, options);
}

exports.publish = publish;
