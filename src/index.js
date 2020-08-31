#!/usr/bin/env node
const program = require('commander')
const {version, name, description} = require('../package.json')
const updateProducts = require('./apiproduct')
const updateKvms = require('./kvms')
const targetserver = require('./targetserver')
const updateCache = require('./cache')

function handleError (e) {
  console.error('ERROR:')
  console.error(e.message)
  process.exit(1)
}

const build = () => {
  return {
    organization: program.org,
    environment: program.env,
    username: process.env.APIGEE_USERNAME || process.env.APIGEE_USER,
    password: process.env.APIGEE_PASSWORD
  }
}

program.name(name)
  .version(version, '-v, --version')
  .description(description)
  .option('-o, --org <org>', 'apigee org')
  .option('-e, --env <env>', 'apigee env')

program.command('products <manifest>')
  .description('creates or updates a list of products based on the given manifest')
  .action((manifest) => updateProducts(build(), manifest).catch(handleError))

program.command('kvms <manifest>')
  .option('--purgeDeleted', 'Deletes all entries in the KVM that are not in the Manifest.', false)
  .action((manifest, command) => updateKvms(build(), manifest).catch(handleError))

program.command('targetservers <manifest>')
  .action((manifest, command) => targetserver(build(), manifest).catch(handleError))

program.command('caches <manifest>')
  .description('creates or updates a list of caches based on the given manifest')
  .action((manifest) => updateCache(build(), manifest).catch(handleError))
// .action(console.log(createCache()))

program.parse(process.argv)