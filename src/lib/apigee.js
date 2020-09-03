const axios = require('axios')
const Cache = require('./apigee/cache')
const Kvm = require('./apigee/kvm')
const Targetserver = require('./apigee/targetserver')
const Keystore = require('./apigee/keystore')
const Proxy = require('./apigee/proxy')
const SharedFlow = require('./apigee/sharedFlow')
const Resource = require('./apigee/resource')
const Apiproduct = require('./apigee/apiproduct')

class Apigee {
  constructor (config) {
    this.config = config
    this.request = axios.create({
      baseURL: 'https://api.enterprise.apigee.com/v1',
      timeout: 60000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
      }
    })
    this.cache = new Cache(this.request, config)
    this.kvm = new Kvm(this.request, config)
    this.targetserver = new Targetserver(this.request, config)
    this.proxy = new Proxy(this.request, config)
    this.keystore = new Keystore(this.request, config)
    this.sharedFlow = new SharedFlow(this.request, config)
    this.resource = new Resource(this.request, config)
    this.apiproduct = new Apiproduct(this.request, config)
  }
}

module.exports = Apigee
