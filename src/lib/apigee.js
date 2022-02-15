const axios = require('axios')
const HttpsProxyAgent = require("https-proxy-agent")
const http = require('http');
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
const Spec = require('./specs-api/spec')
const Portal = require('./specs-api/portal')
const DeveloperApps = require('./apigee/developerApps')



class Apigee {
  constructor (config) {
    this.config = config
    const httpsAgent = new HttpsProxyAgent(config.proxy)
    this.request = axios.create({
      /*httpAgent: new http.Agent({ proxy:true,url:config.proxy, keepAlive: true }),*/
      agent: httpsAgent,
      baseURL: config.url,
      timeout: 60000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Org-Name': config.organization,
        Authorization: config.token ? `Bearer ${config.token}`
          : config.hybrid ? `Bearer ${config.hybrid}` : 'Basic ' + Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
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
    this.spec = new Spec(this.request, config)
    this.portal = new Portal(this.request, config)
    this.developerApps = new DeveloperApps(this.request, config)
  }

  async login () {
    if (this.config.token || this.config.hybrid) {
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
    this.request.defaults.headers['Authorization'] = 'Bearer ' + response.data.access_token
    this.cache.setRequest(this.request)
    this.kvm.setRequest(this.request)
    this.targetserver.setRequest(this.request)
    this.proxy.setRequest(this.request)
    this.keystore.setRequest(this.request)
    this.sharedFlow.setRequest(this.request)
    this.resource.setRequest(this.request)
    this.apiproduct.setRequest(this.request)
    this.spec.setRequest(this.request)
    this.portal.setRequest(this.request)
    this.developerApps.setRequest(this.request)
  }
}

module.exports = Apigee
