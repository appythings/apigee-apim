#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const fs = require('fs')

module.exports = async (config, spec, product, portal) => {
  const apigee = new Apigee(config)
  await apigee.login()
  const swagger = JSON.parse(fs.readFileSync(spec))

  const specification = await apigee.spec.createOrUpdateSwagger(swagger)
  await apigee.portal.publishSpecToPortal(swagger, specification, product, portal)
  console.log(`Deployed spec for product "${product}" to portal "${portal}"`)
}
