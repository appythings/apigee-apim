class Portal {
  constructor (request, config) {
    this.organization = config.organization
    this.environment = config.environment
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async publishSpecToPortal (swagger, spec, product, portal) {
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
      'orgname': this.organization``
    })
    await this.request.put(`/portals/api/sites/${this.organization}-${portal}/apidocs/${id}/snapshot`, {})
  }
}
module.exports = Portal
