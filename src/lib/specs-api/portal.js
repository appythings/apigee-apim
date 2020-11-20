class Portal {
  constructor (request, config) {
    this.organization = config.organization
    this.environment = config.environment
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
    this.request.defaults.baseURL = 'https://apigee.com'
  }

  async checkIfSpecExists (swagger, product, portal) {
    const apidocs = await this.request(`/portals/api/sites/${this.organization}-${portal}/apidocs`)
    const doc = apidocs.data.data.find(content => content.edgeAPIProductName === product)
    if (!doc) {
      return undefined
    }
    return this.request(`/portals/api/sites/${this.organization}-${portal}/apidocs/${doc.id}`)
  }

  async publishSpecToPortal (swagger, spec, product, portal) {
    let exists = await this.checkIfSpecExists(swagger, product, portal)
    if (!exists) {
      const newSpec = await this.request.post(`/portals/api/sites/${this.organization}-${portal}/apidocs`, {
        'title': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}`,
        'description': swagger.info.description,
        'edgeAPIProductName': product,
        'visibility': true,
        'anonAllowed': this.config.anonymous,
        'specId': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.environment}`,
        'specContent': spec.content
      })
      const id = newSpec.data.data.id
      await this.request.post(`/portals/api/sites/${this.organization}-${portal}/resource-entitlements/apis/${id}`, {
        'isPublic': false,
        'authEntitled': true,
        'explicitAudiences': [],
        'orgname': this.organization
      })
      await this.request.put(`/portals/api/sites/${this.organization}-${portal}/apidocs/${id}/snapshot`, {})
    } else {
      await this.request.put(`/portals/api/sites/${this.organization}-${portal}/apidocs/${exists.data.data.id}/snapshot`, {})
    }
  }
}

module.exports = Portal
