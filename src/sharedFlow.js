#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const fs = require('fs-extra')
const archiver = require('archiver')

module.exports = async (config, name, directory) => {
  const apigee = new Apigee(config)
  if (!await fs.exists(directory)) {
    throw new Error(`Directory ${directory} not found`)
  }
  const output = fs.createWriteStream('sharedflowbundle.zip')
  const archive = archiver('zip')
  archive.pipe(output)
  archive.directory(directory, 'sharedflowbundle')
  archive.finalize()
  output.on('close', async function () {
    try {
      await apigee.sharedFlow.add(fs.createReadStream('sharedflowbundle.zip'), name)
    } catch (e) {
      process.exitCode = 1
      console.log(JSON.stringify(e.response.data))
    }
  })
}
