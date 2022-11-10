#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const fs = require('fs-extra')
const yaml = require('js-yaml')
const chai = require('chai')
const expect = chai.expect

module.exports = async (config, manifest) => {
  const apigee = new Apigee(config)
  let yml = yaml.safeLoad(fs.readFileSync(manifest, 'utf8'))
  if (!yml) {
    return false
  }
  const resourceConfig = yml.resourcefiles
  console.log(resourceConfig)
  if (!resourceConfig) {
    return false
  }

  Object.keys(resourceConfig).map(async (resourceName) => {
    const resource = resourceConfig[resourceName]
    resource.name = resourceName
    expect(resource, 'The resourcefiles value is not an object').to.be.an('object')
    const exists = await apigee.resource.detail(resource)
    console.log(exists.data)
    if (exists) {
      await apigee.resource.update(fs.createReadStream(resource.filename), {
        type: resource.type,
        name: resourceName
      })
      console.log(`updated resource file "${resourceName}"`)
    } else {
      await apigee.resource.add(fs.createReadStream(resource.filename), {
        type: resource.type,
        name: resourceName
      })
      console.log(`added resource file "${resourceName}"`)
    }
  })
}
