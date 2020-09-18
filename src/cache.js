const Apigee = require('./lib/apigee')
const yaml = require('js-yaml')
const fs = require('fs')

const validateDate = (cache) => {
  if ((cache.timeoutInSec && cache.timeOfDay) || (cache.timeOfDay && cache.expiryDate) || (cache.timeoutInSec && cache.expiryDate)) {
    throw new Error(`Only one of 'timeoutInSec', 'timeOfDay', 'expiryDate' can be filled`)
  }
  if (!cache.timeoutInSec && !cache.timeOfDay && !cache.expiryDate) {
    throw new Error(`At least one of 'timeoutInSec', 'timeOfDay', 'expiryDate' must be filled`)
  }
  return {
    'timeOfDay': { 'value': cache.timeOfDay },
    'timeoutInSec': { 'value': cache.timeoutInSec },
    'expiryDate': { 'value': cache.expiryDate },
    'valuesNull': cache.expirySettings.valuesNull
  }
}

module.exports = async (config, manifest) => {
  const apigee = new Apigee(config)
  let yml = yaml.safeLoad(fs.readFileSync(manifest, 'utf8'))
  if (!yml) {
    return false
  }
  const cacheConfig = yml.caches
  if (!Array.isArray(cacheConfig)) {
    return false
  }
  return Promise.all(cacheConfig.map(async (cache) => {
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
  }))
}
