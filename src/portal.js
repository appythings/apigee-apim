#!/usr/bin/env node
const Apigee = require('./lib/apigee')
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

module.exports = async (config, spec, product, portal) => {
  const apigee = new Apigee(config)
  await apigee.login()
  const swagger = readSwaggerFile(spec)

  const specification = await apigee.spec.createOrUpdateSwagger(swagger)
  await apigee.portal.publishSpecToPortal(swagger, specification, product, portal)
  console.log(`Deployed spec for product "${product}" to portal "${portal}"`)
}
