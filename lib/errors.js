const { red, yellow } = require('chalk');

const name = 'workspace-publish';
const errorPrefix = red(name);
const warningPrefix = yellow(name);

class WorkspaceReleaseError extends Error {
  toString() {
    return this.message;
  }
}
class WorkspaceReleaseWarning extends Error {
  toString() {
    return this.message;
  }
}

function handleError(err) {
  if (err instanceof WorkspaceReleaseWarning) {
    console.error(`${warningPrefix} ${err}`);
  } else if (err instanceof WorkspaceReleaseError) {
    console.error(`${errorPrefix} ${err}`);
    process.exitCode = 1;
  } else {
    console.error(`${errorPrefix} crashed`);
    console.error(err);
    process.exitCode = 1;
  }
}

exports.WorkspaceReleaseWarning = WorkspaceReleaseWarning;
exports.WorkspaceReleaseError = WorkspaceReleaseError;
exports.handleError = handleError;
