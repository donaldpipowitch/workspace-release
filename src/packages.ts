import { join, dirname } from 'path';
import globby from 'globby';
import { WorkspaceReleaseWarning, WorkspaceReleaseError } from './errors';

export function getRootPackage() {
  let rootPkg;
  try {
    rootPkg = require(join(process.cwd(), 'package.json'));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new WorkspaceReleaseWarning(
        `I couldn't found a package.json in your current working directory. I assume to be executed in the root of a workspace based yarn project.`
      );
    } else {
      throw err;
    }
  }

  if (!rootPkg.workspaces) {
    throw new WorkspaceReleaseWarning(
      `Your package.json doesn't contain a "workspaces" property. I assume to be executed in the root of a workspace based yarn project.`
    );
  }

  if (!Array.isArray(rootPkg.workspaces)) {
    throw new WorkspaceReleaseError(
      `The "workspaces" property in your package.json isn't an array.`
    );
  }

  if (!rootPkg.workspaces.length) {
    throw new WorkspaceReleaseWarning(
      `The "workspaces" property in your package.json is empty.`
    );
  }

  return rootPkg;
}

export class PackageInfo {
  file: string;
  data: {
    name: string;
    version: string;
    private?: boolean;
    publishConfig?: { tag?: string; access?: string };
  };
  dir: string;
  wasChanged: boolean;

  constructor(file: string) {
    this.file = file;
    this.data = require(join(process.cwd(), file));
    this.dir = dirname(file);
    this.wasChanged = false;
  }
}

export async function getPackageInfos({
  workspaces
}: {
  workspaces: string[];
}) {
  const files = await globby(
    workspaces.map((pattern) => join(pattern, 'package.json'))
  );
  const pkgInfos = files
    .map((file) => new PackageInfo(file))
    .sort(({ data: a }, { data: b }) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
  return pkgInfos;
}
