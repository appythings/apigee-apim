#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const fs = require('fs-extra')
const archiver = require('archiver')
const unzipper = require('unzipper')
const yaml = require('js-yaml')

const Proxy = {
  deployProxy: async (config, name, directory, serviceAccount) => {
    const apigee = new Apigee(config)
    if (!await fs.exists(directory)) {
      throw new Error(`Directory ${directory} not found`)
    }
    const output = fs.createWriteStream(`apiproxy_${name}.zip`)
    const archive = archiver('zip')
    archive.pipe(output)
    archive.directory(directory, 'apiproxy')
    archive.finalize()
    output.on('close', async function () {
      try {
        await apigee.proxy.add(fs.createReadStream(`apiproxy_${name}.zip`), name, serviceAccount)
      } catch (e) {
        process.exitCode = 1
        if (e.response) {
          console.log(JSON.stringify(e.response.data))
        } else {
          console.log(e.message)
        }
      }
    })
  },
  undeployProxy: async (config, name, revision, serviceAccount) => {
    const apigee = new Apigee(config)
    try {
      await apigee.proxy.undeploy(name, revision, serviceAccount)
    } catch (e) {
      process.exitCode = 1
      if (e.response) {
        console.log(JSON.stringify(e.response.data))
      } else {
        console.log(e.message)
      }
    }
  },
  deployExistingRevision: async (config, name, revision, serviceAccount) => {
    const apigee = new Apigee(config)
    const deployment = await apigee.proxy.deploy(name, revision, serviceAccount)
    console.log(`Deployed proxy "${name}" revision "${revision}"`)
    return deployment
  },
  listDeployedRevision: async (config, name) => {
    const apigee = new Apigee(config)
    const deployment = await apigee.proxy.deployment(name)
    return deployment
  },
  downloadProxies: async (config, list = []) => {
    const apigee = new Apigee(config)
    if (list.length === 0) {
      list = await apigee.proxy.list()
    }
    list.forEach(async (proxy) => {
      const proxyZip = await apigee.proxy.detail(proxy)
      await fs.ensureDir(proxy)
      let writeStream = fs.createWriteStream(`${proxy}/apiproxy.zip`)
      proxyZip.pipe(writeStream)
      writeStream.on('finish', () => {
        writeStream.end()
        fs.createReadStream(`${proxy}/apiproxy.zip`)
          .pipe(unzipper.Extract({ path: `${proxy}` }))
      })
    })
  },
  deployProxies: async (config, manifest) => {
    let yml = yaml.safeLoad(fs.readFileSync(manifest, 'utf8'))
    if (!yml) {
      return false
    }
    const proxyConfig = yml.proxies
    if (!proxyConfig) {
      return false
    }
    for (let proxyName of Object.keys(proxyConfig)) {
      await Proxy.deployProxy(config, proxyName, proxyConfig[proxyName].directory, proxyConfig[proxyName].serviceAccount)
    }
  }
}
module.exports = Proxy
