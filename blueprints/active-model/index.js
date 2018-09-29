const fs = require('fs')
const path = require('path')

/**
 * Determine if directory exists
 * @param {String} path - directory path
 * @returns {Boolean} whether or not directory exists
 */
function isDirectory (path) {
  try {
    return fs.statSync(path).isDirectory()
  }
  catch (err) {
    return false
  }
}

/**
 * Check if a directory exists and if not create it
 * @param {String} path - directory path
 */
function ensureDirectory (path) {
  if (!isDirectory(path)) {
    fs.mkdirSync(path)
  }
}

/**
 * Write contents to file
 * @param {String} fileDir - directory in which to write file
 * @param {String} fileName - name of file to write
 * @param {String} contents - contents to write
 */
function writeFile (fileDir, fileName, contents) {
  const filePath = path.join(fileDir, fileName)
  ensureDirectory(fileDir)
  fs.writeFileSync(filePath, contents)
}

/**
 * Generate adapter
 * @param {Array} args - cli arguments
 * @param {String} projectRoot - root path for consuming project
 * @param {String} appWritePath - path in which to write app files
 * @param {Boolean} useMocha - whether or not to use mocha for tests
 * @returns {Promise} resolves once complete
 */
function generateAdapter (args, projectRoot, appWritePath, useMocha) {
  const name = args[0]

  const appFileContents = fs.readFileSync(path.join(__dirname, 'other-files', 'adapter.js'), {encoding: 'ascii'})
  const appFileDestDir = path.join(appWritePath, 'adapters')
  writeFile(appFileDestDir, `${name}.js`, appFileContents)

  const testFramework = useMocha ? 'mocha' : 'qunit'
  const testFileSrcPath = path.join(__dirname, 'other-files', `adapter-test-${testFramework}.js`)
  const testFileContents = fs.readFileSync(testFileSrcPath, {encoding: 'ascii'})
  const testFileDestDir = path.join(projectRoot, 'tests', 'unit', 'adapters')
  writeFile(testFileDestDir, `${name}-test.js`, testFileContents)

  return Promise.resolve()
}

/**
 * Generate serializer
 * @param {Array} args - cli arguments
 * @param {String} projectRoot - root path for consuming project
 * @param {String} appWritePath - path in which to write app files
 * @param {Boolean} useMocha - whether or not to use mocha for tests
 * @returns {Promise} resolves once complete
 */
function generateSerializer (args, projectRoot, appWritePath, useMocha) {
  const name = args[0]

  const appFileContents = fs.readFileSync(path.join(__dirname, 'other-files', 'serializer.js'), {encoding: 'ascii'})
  const appFileDestDir = path.join(appWritePath, 'serializers')
  writeFile(appFileDestDir, `${name}.js`, appFileContents)

  const testFramework = useMocha ? 'mocha' : 'qunit'
  const testFileSrcPath = path.join(__dirname, 'other-files', `serializer-test-${testFramework}.js`)
  const testFileContents = fs.readFileSync(testFileSrcPath, {encoding: 'ascii'}).replace(/<%= dasherizedModuleName %>/g, name)
  const testFileDestDir = path.join(projectRoot, 'tests', 'unit', 'serializers')
  writeFile(testFileDestDir, `${name}-test.js`, testFileContents)

  return Promise.resolve()
}

/**
 * Get path in which to write app files
 * @param {String} projectRoot - root path for consuming project
 * @param {Boolean} usePods - whether or not to use pods path
 * @returns {String} path in which to write app files
 */
function getAppWritePath (projectRoot, usePods) {
  const projectDirectory = projectRoot.split('/').pop()
  const configPath = `${projectRoot}/config/environment.js`
  const ENV = require(configPath)()
  var podModulePrefix = ENV.podModulePrefix

  if (usePods && podModulePrefix) {
    if (podModulePrefix.indexOf(`${projectDirectory}/`) === 0) {
      podModulePrefix = podModulePrefix.replace(`${projectDirectory}/`, '')
    }

    return `${projectRoot}/app/${podModulePrefix}`
  }

  return `${projectRoot}/app/`
}

module.exports = {
  install (options) {
    const generatorArgs = options.args.slice(2) // Remove "active-model-adapter" and entity name from args
    const useMocha = 'ember-cli-mocha' in options.project.addonPackages
    const projectRoot = options.project.root
    const appWritePath = getAppWritePath(projectRoot, options.pod)

    switch (options.entity.name) {
      case 'adapter':
        return generateAdapter(generatorArgs, projectRoot, appWritePath, useMocha)

      case 'serializer':
        return generateSerializer(generatorArgs, projectRoot, appWritePath, useMocha)
    }

    return Promise.resolve()
  }
}
