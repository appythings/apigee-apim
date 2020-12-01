#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const fs = require('fs-extra')
const archiver = require('archiver')

module.exports = {
  deployProxy: async (config, name, directory) => {
    const apigee = new Apigee(config)
    if (!await fs.exists(directory)) {
      throw new Error(`Directory ${directory} not found`)
    }
    const output = fs.createWriteStream('apiproxy.zip')
    const archive = archiver('zip')
    archive.pipe(output)
    archive.directory(directory, 'apiproxy')
    archive.finalize()
    output.on('close', async function () {
      try {
        await apigee.proxy.add(fs.createReadStream('apiproxy.zip'), name)
      } catch (e) {
        process.exitCode = 1
        console.log(JSON.stringify(e.response.data))
      }
    })
  },
  deployExistingRevision: async (config, name, revision) => {
    const apigee = new Apigee(config)
    const deployment = await apigee.proxy.deploy(name, revision)
    console.log(`Deployed proxy "${name}" revision "${revision}"`)
    return deployment
  },
  listDeployedRevision: async (config, name) => {
    const apigee = new Apigee(config)
    const deployment = await apigee.proxy.deployment(name)
    console.log(deployment.name)
    return deployment
  }

}
