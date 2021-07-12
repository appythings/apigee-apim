#!/usr/bin/env node
const program = require('commander')
const { version, name, description } = require('../package.json')
const updateProducts = require('./apiproduct')
const updateKvms = require('./kvms')
const targetserver = require('./targetserver')
const updateCache = require('./cache')
const { deployProxy, deployExistingRevision, listDeployedRevision } = require('./proxy')
const deploySharedFlow = require('./sharedFlow')
const deploySpec = require('./portal')
const listAPIProducts = require('./listapiproducts')
const developerApps = require('./developerApps')

function handleError (e) {
  console.error('ERROR:')
  console.error(e.message)
  if (e.response) {
    console.error(e.response.data)
  }
  process.exit(1)
}

const build = () => {
  return {
    hybrid: program.hybrid,
    organization: program.org,
    environment: program.env,
    username: process.env.APIGEE_USERNAME || process.env.APIGEE_USER,
    password: process.env.APIGEE_PASSWORD,
    url: program.baseuri ? program.baseuri
      : program.hybrid ? 'https://apigee.googleapis.com/v1' : 'https://api.enterprise.apigee.com/v1',
    token: program.token
  }
}

program.name(name)
  .version(version, '-v, --version')
  .description(description)
  .requiredOption('-o, --org <org>', 'apigee org')
  .option('-e, --env <env>', 'apigee env')
  .option('-h, --hybrid <accessToken>', 'specify if you wish to deploy to Apigee hybrid')
  .option('-L, --baseuri <baseuri>', ' The base URI for you organization on Apigee Edge. The default is the base URI for Apigee cloud deployments is api.enterprise.apigee.com. For on-premise deployments, the base URL may be different.')
  .option('-t, --token <accessToken>', ' Your Apigee access token. Use this in lieu of -u / -p')

program.command('products <manifest>')
  .description('Creates or updates a list of products based on the given manifest')
  .action((manifest) => updateProducts(build(), manifest).catch(handleError))

program.command('kvms <manifest>')
  .description( 'Create or updates KVMs')
  .option('--purgeDeleted', 'Deletes all entries in the KVM that are not in the Manifest.', false)
  .action((manifest, command,options) => updateKvms(build(), manifest,options.purgeDeleted).catch(handleError))

program.command('targetservers <manifest>')
    .description('Creates or updates target servers')
    .action((manifest, command) => targetserver(build(), manifest).catch(handleError))

program.command('caches <manifest>')
  .description('Creates or updates a list of caches based on the given manifest')
  .action((manifest) => updateCache(build(), manifest).catch(handleError))

program.command('deploy')
  .requiredOption('-n, --api <name>', 'The name of the API proxy. Note: The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: A-Z0-9._\\-$ %.')
  .option('-d, --directory <directory>', 'The path to the root directory of the API proxy on your local system. Will attempt to use current directory is none is specified.', 'apiproxy')
  .description('Deploy a proxy based on a folder')
  .action((options) => deployProxy(build(), options.api, options.directory).catch(handleError))

program.command('deployExistingRevision')
  .requiredOption('-n, --api <name>', 'The name of the API proxy. Note: The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: A-Z0-9._\\-$ %.')
  .requiredOption('-r, --revision <revision>', 'The existing revision of the proxy to be deployed.')
  .description('Deploy a proxy based on a folder')
  .action((options) => deployExistingRevision(build(), options.api, options.revision).catch(handleError))

program.command('deploySharedFlow')
  .requiredOption('-n, --sf <name>', 'The name of the SharedFlow. Note: The name of the SharedFlow must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: A-Z0-9._\\-$ %.')
  .option('-d, --directory <directory>', 'The path to the root directory of the sharedflow on your local system. Will attempt to use current directory is none is specified.', 'sharedflowbundle')
  .description('Deploys a sharedFlow to Apigee Edge. If the sharedFlow is currently deployed, it will be undeployed first, and the newly deployed sharedflow\'s revision number is incremented.')
  .action((options) => deploySharedFlow(build(), options.sf, options.directory).catch(handleError))

program.command('deploySpec')
  .requiredOption('-a, --apiproduct <apiproduct>', 'Name of the apiproduct')
  .requiredOption('-p, --portal <portal>', 'Name of the portal')
  .option('-s, --spec <spec>', 'The path to the root spec', 'swagger.json')
  .description('Deploys a spec to a portal')
  .action((options) => deploySpec(build(), options.spec, options.apiproduct, options.portal).catch(handleError))

program.command('listDeployedRevision')
  .requiredOption('-n, --api <name>', 'The name of the API proxy. Note: The name of the API proxy must be unique within an organization. The characters you are allowed to use in the name are restricted to the following: A-Z0-9._\\-$ %.')
  .description('Lists the currently deployed revision for an API on an environment')
  .action((options) => listDeployedRevision(build(), options.api).catch(handleError))

program.command('listAPIProducts')
  .description('Lists the products in the Apigee organization')
  .action((options) => listAPIProducts(build(), options.api).catch(handleError))

program.command('updateCustomAttribute')
    .description('Update a custom attribute by developer and app name.')
    .requiredOption('--dev <dev>', 'Name of the developer')
    .requiredOption('--app <app>', 'Name of the app')
    .requiredOption('-an, --attributeName <attributeName>', 'Name of the attribute')
    .requiredOption('-av, --attributeValue <attributeValue>', 'Value of the attribute')
    .action((options) => developerApps.updateCustomAttribute(build(), options.dev, options.app, options.attributeName, options.attributeValue).catch(handleError))

program.parse(process.argv)
