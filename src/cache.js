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

const validateDate = (cache) => {
  if (((cache.timeoutInSec !== null || undefined) && (cache.timeOfDay !== null || undefined)) ||
     ((cache.timeOfDay !== null || undefined) && (cache.expiryDate !== null || undefined)) ||
     ((cache.timeoutInSec !== null || undefined) && (cache.expiryDate !== null || undefined))) {
    console.log('You can only have 1 expirySettings option. Set to default 300 seconds')
    return {'timeoutInSec': {'value': 300}, 'valuesNull': cache.expirySettings.valuesNull}
  } else if (cache.expiryDate) {
    return {'expiryDate': {'value': cache.expiryDate}, 'valuesNull': cache.expirySettings.valuesNull}
  } else if (cache.timeOfDay) {
    return {'timeOfDay': {'value': cache.timeOfDay}, 'valuesNull': cache.expirySettings.valuesNull}
  } else if (cache.timeoutInSec) {
    return {'timeoutInSec': {'value': cache.timeoutInSec}, 'valuesNull': cache.expirySettings.valuesNull}
  } else {
    return {'timeoutInSec': {'value': 300}, 'valuesNull': cache.expirySettings.valuesNull}
  }
}

module.exports = async (config, manifest) => {
  const apigee = new Apigee(config)
  let yml = yaml.safeLoad(fs.readFileSync(manifest, 'utf8'))
  const cacheConfig = yml.caches
  if (!cacheConfig) {
    return false
  }
  Object.keys(cacheConfig).map(async (cacheName) => {
    const cache = cacheConfig[cacheName]
    expect(cache, 'The cache value is not an object').to.be.an('object')
    const newCache = {
      'name': cache.name,
      'description': cache.description,
      'expirySettings': validateDate(cache),
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
