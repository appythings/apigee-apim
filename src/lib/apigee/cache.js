const {expect} = require('chai')

class Cache {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/caches`)
    return response.data
  }

  async detail (name) {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/caches/${name}`)
    return response.data
  }

  async add (Cache) {
    try {
      await this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/caches`, Cache)
    } catch (e) {
      console.log('Cache already exists. Skipping.')
    }
  }

  async update (Cache) {
    try {
      await this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/caches/${Cache.name}`, Cache)
    } catch (e) {
      console.log(e)
    }
  }

  async delete (organization, environment, name) {
    try {
      await this.request.delete(`/organizations/${organization}/environments/${environment}/caches/${name}`)
    } catch (e) {
      console.log('Cache error: ' + e.message)
    }
  }

  async migrate () {
    const names = await this.list(this.config.oldOrg, this.config.environment)
    const details = await Promise.all(names.map((name) => this.detail(this.config.oldOrg, this.config.environment, name)))
    console.log(`migrating ${details.length} caches`)
    for (const detail of details) {
      process.stdout.write('.')
      await this.add(this.config.newOrg, this.config.environment, detail)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(names.length)
  }

  async cleanup () {
    const names = await this.list(this.config.oldOrg, this.config.environment)
    console.log(`Cleaning up ${names.length} caches`)
    for (const name of names) {
      process.stdout.write('.')
      await this.delete(this.config.newOrg, this.config.environment, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(0)
  }
}
module.exports = Cache
