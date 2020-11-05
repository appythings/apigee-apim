const axios = require('axios')
const qs = require('qs')
const fs = require('fs-extra')
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
      baseURL: config.url,
      timeout: 60000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: config.hybrid ? `Bearer ${config.hybrid}` : undefined
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

  async login () {
    if (this.config.hybrid) {
      return
    }
    const data = { 'username': this.config.username, 'password': this.config.password, 'grant_type': 'password' }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ZWRnZWNsaTplZGdlY2xpc2VjcmV0'
      },
      data: qs.stringify(data),
      url: 'https://login.apigee.com/oauth/token'
    }
    const response = await axios(options)
    this.request.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token
    this.spec.setRequest(this.request)
    this.portal.setRequest(this.request)
  }
}

module.exports = Apigee
