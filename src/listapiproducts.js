#!/usr/bin/env node
const Apigee = require('./lib/apigee')
const yaml = require('js-yaml')
const fs = require('fs')

module.exports = async (config, manifest) => {
  const apigee = new Apigee(config)
  const products = await apigee.apiproduct.list()
  console.log(JSON.stringify(products));
}
