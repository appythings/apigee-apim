const {expect} = require('chai')

class SharedFlow {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/sharedflows`)
    return response.data
  }

  async detail (name) {
    try {
      const details = await this.request(`/organizations/${this.config.organization}/sharedflows/${name}`)
      const revision = details.data.revision[details.data.revision.length - 1] // get last revision
      const response = await this.request(
        {
          url: `/organizations/${this.config.organization}/sharedflows/${name}/revisions/${revision}?format=bundle`,
          responseType: 'stream'
        })
      return response.data
    } catch (e) {
      return null
    }
  }

  async add (SharedFlow, name) {
    if (SharedFlow !== null) {
      const response = await this.request({
        url: `/organizations/${this.config.organization}/sharedflows?action=import&name=${name}`,
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        method: 'POST',
        data: SharedFlow
      })
      await this.request({
        url: `/organizations/${this.config.organization}/environments/${this.config.environment}/sharedflows/${name}/revisions/${response.data.revision}/deployments`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'post'
      })
    }
  }

  async delete (name) {
    try {
      await this.request.delete(`/organizations/${this.config.organization}/sharedflows/${name}`)
    } catch (e) {
      console.log('SharedFlow not found. Skipping.')
    }
  }
}
module.exports = SharedFlow
