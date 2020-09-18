#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const yaml = require('js-yaml')
const fs = require('fs')

const isUpdated = (a, b, properties) => {
  return properties.find(prop => {
    if (prop.includes('.')) {
      const props = prop.split('.')
      return a[props[0]][props[1]] !== b[props[0]][props[1]]
    }
    return a[prop] !== b[prop]
  })
}

module.exports = async (config, manifest) => {
  const apigee = new Apigee(config)
  let yml = yaml.safeLoad(fs.readFileSync(manifest, 'utf8'))
  if (!yml) {
    return false
  }
  const productConfig = yml.products
  if (!productConfig) {
    return false
  }
  productConfig.map(async (product) => {
    const newProduct = {
      'apiResources': [],
      'approvalType': product.approvalType || 'auto',
      'attributes': [
        {
          'name': 'access',
          'value': product.accessType || 'public'
        }
      ],
      'description': product.description,
      'displayName': product.name,
      'environments': product.environments,
      'name': product.name,
      'proxies': product.proxies,
      'scopes': []
    }

    return apigee.apiproduct.add(newProduct)
  })
}
