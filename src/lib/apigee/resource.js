const {expect} = require('chai')

class Resource {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  async list (organization) {
    const response = await this.request(`/organizations/${organization}/resourcefiles`)
    return response.data.resourceFile
  }

  async detail (organization, environment, resourceFile) {
    const response = await this.request(
      {
        url: `/organizations/${organization}/resourcefiles/${resourceFile.type}/${resourceFile.name}`,
        responseType: 'stream'
      })
    return response.data
  }

  async add (organization, environment, Resource, resourceFile) {
    try {
      await this.request({
        url: `/organizations/${organization}/resourcefiles?type=${resourceFile.type}&name=${resourceFile.name}`,
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        method: 'POST',
        data: Resource
      })
    } catch (e) {
      console.log('Resource already exists. Skipping.')
    }
  }

  async delete (organization, environment, resourceFile) {
    console.log(`/organizations/${organization}/resourcefiles/${resourceFile.type}/${resourceFile.name}`)
    try {
      await this.request.delete(`/organizations/${organization}/resourcefiles/${resourceFile.type}/${resourceFile.name}`)
    } catch (e) {
      console.log('Resource not found. Skipping.')
    }
  }
  async migrate () {
    const names = await this.list(this.config.oldOrg)
    console.log(`migrating ${names.length} resourceFiles`)
    for (const name of names) {
      const detail = await this.detail(this.config.oldOrg, this.config.environment, name)
      process.stdout.write('.')
      await this.add(this.config.newOrg, this.config.environment, detail, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(names.length)
  }

  async cleanup () {
    const names = await this.list(this.config.oldOrg)
    console.log(`Cleaning up ${names.length} resourceFiles`)
    for (const name of names) {
      process.stdout.write('.')
      await this.delete(this.config.newOrg, this.config.environment, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(0)
  }
}
module.exports = Resource
