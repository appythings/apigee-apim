const {expect} = require('chai')

class Keystore {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async list (organization, environment) {
    const response = await this.request(`/organizations/${organization}/environments/${environment}/keystores`)
    return response.data
  }

  async detail (organization, environment, name) {
    const response = await this.request(`/organizations/${organization}/environments/${environment}/keystores/${name}`)
    return response.data
  }

  async add (organization, environment, Keystore) {
    try {
      await this.request.post(`/organizations/${organization}/environments/${environment}/keystores`,
        {
          name: Keystore.name
        })
    } catch (e) {
      console.log('Keystore already exists. Skipping.')
    }
  }

  async delete (organization, environment, name) {
    try {
      await this.request.delete(`/organizations/${organization}/environments/${environment}/keystores/${name}`)
    } catch (e) {
      console.log('Keystore not found. Skipping.')
    }
  }

  async migrate () {
    const names = await this.list(this.config.oldOrg, this.config.environment)
    const details = await Promise.all(names.map((name) => this.detail(this.config.oldOrg, this.config.environment, name)))
    console.log(`migrating ${details.length} keystores`)
    for (const detail of details) {
      process.stdout.write('.')
      await this.add(this.config.newOrg, this.config.environment, detail)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(names.length)
  }

  async cleanup () {
    let names = await this.list(this.config.oldOrg, this.config.environment)
    names = names.filter(name => name !== 'freetrial')
    console.log(`Cleaning up ${names.length} targetServers`)
    for (const name of names) {
      process.stdout.write('.')
      await this.delete(this.config.newOrg, this.config.environment, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(1)
  }
}
module.exports = Keystore
