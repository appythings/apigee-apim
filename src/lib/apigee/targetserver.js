const {expect} = require('chai')

class TargetServer {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/targetservers`)
    return response.data
  }

  async detail (name) {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/targetservers/${name}`)
    return response.data
  }

  async add (TargetServer) {
    try {
      await this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/targetservers`, TargetServer)
    } catch (e) {
      console.log(e)
    }
  }

  async update (TargetServer) {
    try {
      await this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/targetservers/${TargetServer.name}`, TargetServer)
    } catch (e) {
      console.log(e)
    }
  }

  async delete (name) {
    try {
      await this.request.delete(`/organizations/${this.config.organization}/environments/${this.config.environment}/targetservers/${name}`)
    } catch (e) {
      console.log('TargetServer error: ' + e.message)
    }
  }

}
module.exports = TargetServer
