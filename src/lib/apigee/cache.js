const {expect} = require('chai')

class Cache {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/caches`)
    return response.data
  }

  async detail (Cache) {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/caches/${Cache.name}`)
    return response.data
  }

  // async add (organization, environment, cache) {
  //   console.log(organization)
  //   console.log(environment)
  //   console.log('??',cache)
  //   try {
  //     await this.request.post(`/organizations/${organization}/environments/${environment}/caches?name=${cache.name}`, cache)
  //   } catch (e) {
  //     console.log('Cache already exists. Skipping.')
  //   }
  // }
  async add (Cache) {
    console.log('Ehh?', Cache.name)
    try {
      await this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/caches`, Cache)
    } catch (e) {
      console.log('Cache already exists. Skipping.')
    }
  }

  async update (Kvm) {
  //   const current = await this.detail(Kvm.name)
  //   const updatePromises = current.entry.map(entry => {
  //     const updatedEntry = Kvm.entry.find(newEntry => newEntry.name === entry.name)
  //     if (!updatedEntry) {
  //       return this.removeEntry(Kvm, entry)
  //     }
  //     if (updatedEntry.value !== entry.value) {
  //       return this.updateEntry(Kvm, updatedEntry)
  //     }
  //   })
  //   const addPromises = Kvm.entry.map(entry => {
  //     const updatedEntry = current.entry.find(newEntry => newEntry.name === entry.name)
  //     if (!updatedEntry) {
  //       return this.addEntry(Kvm, entry)
  //     }
  //   })
  //   return Promise.all([...updatePromises, ...addPromises])
  // }

  // async addEntry (Kvm, entry) {
  //   return this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${Kvm.name}/entries`, entry)
  // }
  //
  // async updateEntry (Kvm, entry) {
  //   return this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${Kvm.name}/entries/${entry.name}`, entry)
  // }
  //
  // async delete (organization, environment, name) {
  //   try {
  //     await this.request.delete(`/organizations/${organization}/environments/${environment}/caches/${name}`)
  //   } catch (e) {
  //     console.log('Cache error: ' + e.message)
  //   }
  // }

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
