#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const yaml = require('js-yaml')
const fs = require('fs')

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
  return productConfig.map(async (product) => {
    const operations = []
    if (product.openapi) {
      const openapi = JSON.parse(fs.readFileSync(product.openapi, 'utf8'));
      const paths = Object.keys(openapi.paths)
      if (product.basePath) {
        paths.map(path => {
          operations.push(
            {
              "apiSource": product.apiSource,
              "operations": [{
                "resource": path.replace(product.basePath, ''),
                "methods": Object.keys(openapi.paths[path]).map(method => method.toUpperCase())
              }]
            })
        })
      }

      const newProduct = {
        'approvalType': product.approvalType || 'auto',
        'attributes': [
          {
            'name': 'access',
            'value': product.accessType || 'public'
          }
        ],
        'description': product.description,
        'displayName': product.displayName || product.name,
        'environments': product.environments,
        "quota": product.quota,
        "quotaInterval": product.quotaInterval,
        "quotaTimeUnit": product.quotaTimeUnit,
        'name': product.name,
        "operationGroup": {
          "operationConfigs": operations
        },
        'scopes': []
      }
      if (product.tags) {
        newProduct.attributes.push({
          'name': 'tags',
          'value': product.tags
        })
      }

      return apigee.apiproduct.add(newProduct)
    }
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
      'displayName': product.displayName || product.name,
      'environments': product.environments,
      "quota": product.quota,
      "quotaInterval": product.quotaInterval,
      "quotaTimeUnit": product.quotaTimeUnit,
      'name': product.name,
      'proxies': product.proxies,
      'scopes': []
    }

    return apigee.apiproduct.add(newProduct)
  })
}
