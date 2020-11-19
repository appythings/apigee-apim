class Spec {
  constructor (request, config) {
    this.environment = config.environment
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
    this.request.defaults.baseURL = 'https://apigee.com'
  }

  async getAutoFolder () {
    const homeFolder = await this.request(`/organizations/${this.config.organization}/specs/folder/home`)
    const autoFolder = homeFolder.data.contents.find(content => content.name === 'auto' && content.kind === 'Folder')
    if (!autoFolder) {
      await this.createAutoFolder()
      return this.getAutoFolder()
    }
    return autoFolder
  }

  getFolderContent (id) {
    return this.request(`/organizations/${this.config.organization}/specs/folder/${id}`)
  }

  async createAutoFolder () {
    const homeFolder = await this.request(`/organizations/${this.config.organization}/specs/folder/home`)
    const response = await this.request.post(`/organizations/${this.config.organization}/specs/folder`, {
      'name': 'auto',
      'folder': homeFolder.data.id
    })
    return response.data
  }

  async checkIfSwaggerExists (swagger) {
    const autoFolder = await this.getAutoFolder()
    const autoFolderContent = await this.getFolderContent(autoFolder.id)
    return autoFolderContent.data.contents.find(content => content.name === `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.environment}`)
  }

  async createOrUpdateSwagger (swagger) {
    let swaggerSpec = await this.checkIfSwaggerExists(swagger)
    let id = null
    let url = null
    let self = null
    if (!swaggerSpec) {
      const autoFolder = await this.getAutoFolder()
      const newSpec = await this.request.post(`/organizations/${this.config.organization}/specs/doc`, {
        'name': `${swagger.info.title}-v${swagger.info.version.split('.')[0]}-${this.environment}`,
        'kind': 'Doc',
        'folder': autoFolder.id
      })
      id = newSpec.data.id
      url = newSpec.data.content
      self = newSpec.data.self
    } else {
      id = swaggerSpec.id
      url = swaggerSpec.content
      self = swaggerSpec.self
    }

    await this.request({
      method: 'PUT',
      url: url,
      data: swagger,
      headers: { 'Content-Type': 'text/plain' }
    })
    return { self: self, content: id }
  }
}

module.exports = Spec
