const {expect} = require('chai')

class Developer {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async list (organization, environment) {
    const response = await this.request(`/organizations/${organization}/developers`)
    return response.data
  }

  async detail (organization, name) {
    try {
      const response = await this.request(`/organizations/${organization}/developers/${name}`)
      return response.data
    } catch (e) {
      console.log(e)
    }
  }

  async add (organization, Developer) {
    try {
      await this.request.post(`/organizations/${organization}/developers`, Developer)
    } catch (e) {
      console.log(e.response.data.message)
      console.log('Developer already exists. Skipping.')
    }
  }

  async delete (organization, name) {
    try {
      await this.request.delete(`/organizations/${organization}/developers/${name}`)
    } catch (e) {
      console.log('Developer not found. Skipping.')
    }
  }

  async migrate (apps) {
    const details = await Promise.all(apps.map((app) => this.detail(this.config.oldOrg, app.developerId)))
    console.log(`Migrating ${details.length} developers`)
    for (const detail of details) {
      process.stdout.write('.')
      await this.add(this.config.newOrg, detail)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(details.length)
  }

  async cleanup (apps) {
    const details = await Promise.all(apps.map((app) => this.detail(this.config.oldOrg, app.developerId)))
    console.log(`Cleaning up ${details.length} developers`)
    for (const detail of details) {
      process.stdout.write('.')
      await this.delete(this.config.newOrg, detail.email)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(0)
  }
}
module.exports = Developer
