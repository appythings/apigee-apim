const Apigee = require('./lib/apigee')
const yaml = require('js-yaml')
const fs = require('fs')
const chai = require('chai')
const expect = chai.expect

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
  const cacheConfig = yml.caches
  console.log(yml.caches)
  if (!cacheConfig) {
    return false
  }
  Object.keys(cacheConfig).map(async (cacheName) => {
    const cache = cacheConfig[cacheName]
    expect(cache, 'The cache value is not an object').to.be.an('object')
    const newCache = {
      'name': cache.name,
      'description': cache.description,
      'expirySettings': {
        'expiryDate': { 'value': cache.expiryDate },
        'valuesNull': cache.expirySettings.valuesNull
      },
      // 'timeoutInSec': {'value': cache.expirySettings.timeoutInSec.value},
      // 'timeOfDay': {'value': cache.expirySettings.timeOfDay.value},
      // 'expiryDate': {'value': cache.expirySettings.expiryDate.value},

      'overflowToDisk': cache.overflowToDisk,
      'skipCacheIfElementSizeInKBExceeds': cache.skipCacheIfElementSizeInKBExceeds
    }

    try {
      await apigee.cache.detail(newCache.name)
      await apigee.cache.update(newCache)
      console.log('Updated cache: ' + newCache.name)
    } catch (e) {
      if (e.message.includes('404')) {
        await apigee.cache.add(newCache)
        console.log('Created cache: ' + newCache.name)
      } else {
        console.log(e)
        process.exitCode = 1
      }
    }
  })
}
