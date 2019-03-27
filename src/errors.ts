import chalk from 'chalk';

const { red, yellow } = chalk;

const name = 'workspace-publish';
const errorPrefix = red(name);
const warningPrefix = yellow(name);

export class WorkspaceReleaseError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, WorkspaceReleaseError.prototype);
  }

  toString() {
    return this.message;
  }
}
export class WorkspaceReleaseWarning extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, WorkspaceReleaseWarning.prototype);
  }

  toString() {
    return this.message;
  }
}

export function handleError(err: unknown) {
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
