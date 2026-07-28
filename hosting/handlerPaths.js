const MINERAL_ROOT = `${ __dirname }/..`;
const MINERAL_API_DIR = `${ MINERAL_ROOT }/api`;

const getRequirePathForHandler = (handler, workspace) => {
  const normalisedWorkspace = workspace.replace(/\/$/, '');
  const { filePath } = handler;

  if (filePath.startsWith(`${ normalisedWorkspace }/`)) {
    return `./${ filePath.slice(normalisedWorkspace.length + 1) }`;
  }

  if (filePath.startsWith(`${ MINERAL_API_DIR }/`)) {
    const relativePath = filePath.slice(MINERAL_API_DIR.length + 1);
    return `@foxtware/mineral/api/${ relativePath }`;
  }

  throw new Error(`Handler "${ handler.routeName }" is not in workspace or mineral api dirs`);
};

module.exports = {
  MINERAL_API_DIR,
  getRequirePathForHandler,
};
