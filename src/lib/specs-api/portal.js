class Portal {
  constructor (request, config) {
    this.organization = config.organization
    this.portal = config.portal
    this.environment = config.environment
    this.request = request
  }

  setRequest (request) {
    this.request = request
  }

  async publishSpecToPortal (swagger, spec) {
    const newSpec = await this.request.post(`/portals/api/sites/${this.organization}-${this.portal}/apidocs`, {
      'title': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}`,
      'description': swagger.info.description,
      'edgeAPIProductName': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.environment}`,
      'visibility': true,
      'anonAllowed': false,
      'specId': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.environment}`,
      'specContent': spec.content
    })
    const id = newSpec.data.data.id
    await this.request.post(`/portals/api/sites/${this.organization}-${this.portal}/resource-entitlements/apis/${id}`, {
      'isPublic': false,
      'authEntitled': true,
      'explicitAudiences': [],
      'orgname': this.organization
    })
    await this.request.put(`/portals/api/sites/${this.organization}-${this.portal}/apidocs/${id}/snapshot`, {})
  }
}
module.exports = Portal
