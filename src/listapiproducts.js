#!/usr/bin/env node
const Apigee = require('./lib/apigee')

module.exports = async (config) => {
  const apigee = new Apigee(config)
  const products = await apigee.apiproduct.list()
  console.log(JSON.stringify(products));
}
