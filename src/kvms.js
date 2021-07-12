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

    const newkvm = {
      'name': kvmName,
      'encrypted': false,
      // 'scope': 'ENV',
      'entry': Object.keys(kvm).map(key => ({'name': key, 'value': kvm[key]}))
    }

    try {
      await apigee.kvm.detail(kvmName)
      await apigee.kvm.update(newkvm, purgeDeleted)
      console.log('Updated kvm: ' + newkvm.name)
    } catch (e) {
      if (e.message.includes('404')) {
        try{
          await apigee.kvm.add(newkvm)
        } catch (e) {
          console.log(e.response.data)
        }
        console.log('Created kvm: ' + newkvm.name)
      } else {
        console.log(e)
        process.exitCode = 1
      }
    }
  })
}
