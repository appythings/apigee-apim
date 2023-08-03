#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const readSwaggerFile = require('./helper/readSwaggerFileHelper')

module.exports = async (config, spec, product, portal) => {
  const apigee = new Apigee(config)
  await apigee.login()
  const swagger = readSwaggerFile(spec)

  const specification = await apigee.spec.createOrUpdateSwagger(swagger)
  await apigee.portal.publishSpecToPortal(swagger, specification, product, portal)
  console.log(`Deployed spec for product "${product}" to portal "${portal}"`)
}
