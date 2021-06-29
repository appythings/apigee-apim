#!/usr/bin/env node
const Apigee = require('./lib/apigee')

module.exports = {
  updateCustomAttribute: async (config, developer, app, attributeName,attributeValue) => {
    const apigee = new Apigee(config)
    const developerApp = await apigee.developerApps.updateCustomAttribute(developer,app, attributeName, attributeValue)
    return developerApp
  },
  getCustomAttributeValue: async (config, developer, app, attributeName) => {
    try {
      const apigee = new Apigee(config)
      const developerApp = await apigee.developerApps.getCustomAttribute(developer,app, attributeName)
      console.log(developerApp.data.value)
    } catch (e) {
      if (e.response.status == '404') {
        console.log('Custom attribute does not exist')
        return false
      } else{
        console.log(e)
        process.exitCode = 1
      }
    }
  }
}
