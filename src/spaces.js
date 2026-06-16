#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const yaml = require('js-yaml')
const fs = require('fs')

module.exports = async (config, manifest) => {
  const apigee = new Apigee(config)
  const yml = yaml.safeLoad(fs.readFileSync(manifest, 'utf8'))
  if (!yml) {
    return false
  }
  const spacesConfig = yml.spaces
  if (!Array.isArray(spacesConfig)) {
    return false
  }

  for (const spaceEntry of spacesConfig) {
    const { name, displayName, members } = spaceEntry
    const existing = await apigee.space.get(name)

    if (!existing) {
      await apigee.space.create({ name, displayName })
      console.log(`Created space: ${name}`)
    } else if (displayName && existing.displayName !== displayName) {
      await apigee.space.update(name, displayName)
      console.log(`Updated space: ${name}`)
    } else {
      console.log(`Space unchanged: ${name}`)
    }

    if (Array.isArray(members) && members.length > 0) {
      await apigee.space.syncIamPolicy(name, members)
      console.log(`Synced IAM policy for space: ${name}`)
    }
  }
}
