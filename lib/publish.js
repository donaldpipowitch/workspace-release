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

  const options = { cwd: pkgInfo.dir };
  // triggers normal lifecycle hooks, but we don't need to change anything
  execSync(
    `npm version --allow-same-version --no-git-tag-version ${version}`,
    options
  );

  const isPrerelease = version.includes('-');
  const tag = isPrerelease ? 'next' : 'latest';
  // default to public access for scoped packages (note: this is a different default than npm uses)
  const access = isScopedPackage ? '--access public' : '';
  execSync(`npm publish --tag ${tag} ${access}`, options);
}

exports.publish = publish;
