const axios = require('axios')
const qs = require('qs')
const Portal = require('./portal')
const Spec = require('./spec')
const Apiproduct = require('../apigee/apiproduct')

class Apigee {
  constructor (config) {
    this.config = config
    this.request = axios.create({
      baseURL: 'https://api.enterprise.apigee.com/v1',
      timeout: 60000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Org-Name': config.organization
      }
    })
    this.spec = new Spec(this.request, this.config)
    this.portal = new Portal(this.request, this.config)
    this.apiproduct = new Apiproduct(this.request, this.config)
  }

  async login () {
    const data = {'username': this.config.username, 'password': this.config.password, 'grant_type': 'password'}
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

  async createSwaggerIfProductExists (swagger) {
    await this.login()
    const isProductAllowed = this.apiproduct.isProductAllowed(this.config.organization, `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.config.environment}`)
    if (!isProductAllowed) {
      return false
    }
    const product = this.apiproduct.detail(this.config.organization, `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.config.environment}`)
    if (!product) {
      return false
    }
    const specification = await this.spec.createOrUpdateSwagger(swagger)
    return this.portal.publishSpecToPortal(swagger, specification)
  }

  async createOrUpdateSwagger (swagger, quotaConfig) {
    await this.login()
    const quota = quotaConfig[this.config.environment] ? quotaConfig[this.config.environment].quota : quotaConfig.default.quota
    this.apiproduct.createIfNotExists(this.config.organization, {
      'apiResources': [
        '/'
      ],
      'approvalType': 'manual',
      'attributes': [
        {
          'name': 'access',
          'value': 'internal'
        }
      ],
      'description': '',
      'displayName': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.config.environment}`,
      'environments': [
        `${this.config.environment}`
      ],
      'name': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.config.environment}`,
      'proxies': [
        `${swagger.info.title}-v${swagger.info.version.split('.')[0]}`
      ],
      'quota': quota,
      'quotaInterval': '1',
      'quotaTimeUnit': 'day'
    })
    if (!this.apiproduct.isProductAllowed(`${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.config.environment}`)) {
      return false
    }
    const specification = await this.spec.createOrUpdateSwagger(swagger)
    return this.portal.publishSpecToPortal(swagger, specification)
  }
}
module.exports = Apigee
