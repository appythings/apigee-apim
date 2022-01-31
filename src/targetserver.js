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
  const targetServerConfig = yml.targetServers
  if (!targetServerConfig) {
    return false
  }
  targetServerConfig.map(async (targetServer) => {
    const newtargetServer = {
      'name': targetServer.name,
      'host': targetServer.host,
      'isEnabled': true,
      'protocol': targetServer.protocol ? targetServer.protocol : undefined,
      'port': targetServer.port || 443,
      'sSLInfo': {
        'enabled': !(targetServer.sSLInfo && targetServer.sSLInfo.enabled === false),
        'clientAuthEnabled': (targetServer.sSLInfo && targetServer.sSLInfo.clientAuthEnabled),
        'keyStore': targetServer.sSLInfo ? targetServer.sSLInfo.keyStore : undefined,
        'trustStore': targetServer.sSLInfo ? targetServer.sSLInfo.trustStore : undefined,
        'keyAlias': targetServer.sSLInfo ? targetServer.sSLInfo.keyAlias : undefined,
        'ignoreValidationErrors': targetServer.sSLInfo ? targetServer.sSLInfo.ignoreValidationErrors : false
      }
    }
    try {
      await apigee.targetserver.detail(newtargetServer.name)
      await apigee.targetserver.update(newtargetServer)
      console.log('Updated targetserver: ' + newtargetServer.name)
    } catch (e) {
      if (e.message.includes('404')) {
        await apigee.targetserver.add(newtargetServer)
        console.log('Created targetserver: ' + newtargetServer.name)
      } else {
        console.log(e)
        process.exitCode = 1
      }
    }
  })
}
