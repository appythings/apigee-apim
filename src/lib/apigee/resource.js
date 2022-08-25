const {expect} = require('chai')

class Resource {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/resourcefiles`)
    return response.data.resourceFile
  }

  async detail (resourceFile) {
    return this.request(
      {
        url: `/organizations/${this.config.organization}/environments/${this.config.environment}/resourcefiles/${resourceFile.type}/${resourceFile.name}`,
        responseType: 'stream'
      }).then(response => response.data).catch(e => false)
  }

  async add (Resource, resourceFile) {
    await this.request({
      url: `/organizations/${this.config.organization}/environments/${this.config.environment}/resourcefiles?type=${resourceFile.type}&name=${resourceFile.name}`,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      method: 'POST',
      data: Resource
    }).catch(e => console.log(e.response))
  }

  async update (Resource, resourceFile) {
    await this.request({
      url: `/organizations/${this.config.organization}/environments/${this.config.environment}/resourcefiles/${resourceFile.type}/${resourceFile.name}`,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      method: 'PUT',
      data: Resource
    }).catch(e => console.log(e.response))
  }

  async delete (resourceFile) {
    try {
      await this.request.delete(`/organizations/${this.config.organization}/environments/${this.config.environment}/resourcefiles/${resourceFile.type}/${resourceFile.name}`)
    } catch (e) {
      console.log('Resource not found. Skipping.')
    }
  }
}
module.exports = Resource
