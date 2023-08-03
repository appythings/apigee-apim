const yaml = require('js-yaml')
const fs = require('fs')

const readSwaggerFile = (swaggerFile) => {
  const swagger = fs.readFileSync(swaggerFile, 'utf8')

  if (swaggerFile.endsWith('.yml') || swaggerFile.endsWith('.yaml')) {
    return yaml.safeLoad(swagger)
  }
  if (swaggerFile.endsWith('.json')) {
    return JSON.parse(swagger)
  }
  throw new Error('Openapi spec must be either yaml/yml or json')
}
module.exports = readSwaggerFile;
