#!/usr/bin/env node
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

const getValue = (val) => {
  const envVar = val.match(/{(.*)}/)
  if (envVar) {
    return process.env[envVar[1]]
  }
  return val
}

module.exports = async (config, manifest, purgeDeleted) => {
  const apigee = new Apigee(config)
  let yml = yaml.safeLoad(fs.readFileSync(manifest, 'utf8'))
  if (!yml) {
    return false
  }
  const kvmConfig = yml.kvms
  if (!kvmConfig) {
    return false
  }
  expect(kvmConfig, 'The KVM config is not an object').to.be.an('object')
  Object.keys(kvmConfig).map(async (kvmName) => {
    const kvm = kvmConfig[kvmName]
    expect(kvm, 'The KVM value is not an object').to.be.an('object')
    const encrypted = kvm.encrypted === 'true' || kvm.encrypted === true
    delete kvm.encrypted

    const newkvm = {
      'name': kvmName,
      'encrypted': encrypted,
      'entry': Object.keys(kvm).map(key => ({ 'name': key, 'value': getValue(kvm[key]) }))
    }

    try {
      if (config.hybrid) {
        const list = await apigee.kvm.list()
        if (!list.includes(kvmName)) {
          await apigee.kvm.add({
            'name': kvmName,
            'encrypted': encrypted
          })
          console.log('Created kvm: ' + kvmName)
        }
        await apigee.kvm.updateHybrid(newkvm, purgeDeleted)
      } else {
        await apigee.kvm.detail(kvmName)
        await apigee.kvm.update(newkvm, purgeDeleted)
      }
      console.log('Updated kvm: ' + newkvm.name)
    } catch (e) {
      if (e.message.includes('404') && !config.hybrid) {
        try {
          await apigee.kvm.add(newkvm)
        } catch (e) {
          console.log(e.response.data)
        }
        console.log('Created kvm: ' + newkvm.name)
      } else {
        console.log(JSON.stringify(e.response.data))
        process.exitCode = 1
      }
    }
  })
}
