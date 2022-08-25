const { expect } = require('chai')

class Kvm {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps`)
    return response.data
  }

  async detail (name) {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${name}`)
    return response.data
  }

  async entries (name) {
    const response = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${name}/entries`)
    return response.data
  }

  async add (Kvm) {
    return this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps`, Kvm)
  }

  async updateHybrid (Kvm, purgeDeleted) {
    const current = await this.entries(Kvm.name)
    const updatePromises = current.keyValueEntries.map(entry => {
      const updatedEntry = Kvm.entry.find(newEntry => newEntry.name === entry.name)
      if (!updatedEntry) {
        if (purgeDeleted) {
          return this.removeEntry(Kvm, entry)
        }
        return
      }
      if (updatedEntry.value !== entry.value) {
        return this.removeAndAddEntry(Kvm, updatedEntry)
      }
    })
    const addPromises = Kvm.entry.map(entry => {
      const updatedEntry = current.keyValueEntries.find(newEntry => newEntry.name === entry.name)
      if (!updatedEntry) {
        return this.addEntry(Kvm, entry)
      }
    })
    return Promise.all([...updatePromises, ...addPromises])
  }

  async update (Kvm, purgeDeleted) {
    const current = await this.detail(Kvm.name)
    const updatePromises = current.entry.map(entry => {
      const updatedEntry = Kvm.entry.find(newEntry => newEntry.name === entry.name)
      if (!updatedEntry) {
        if (purgeDeleted) {
          return this.removeEntry(Kvm, entry)
        }
        return
      }
      if (updatedEntry.value !== entry.value) {
        return this.updateEntry(Kvm, updatedEntry)
      }
    })
    const addPromises = Kvm.entry.map(entry => {
      const updatedEntry = current.entry.find(newEntry => newEntry.name === entry.name)
      if (!updatedEntry) {
        return this.addEntry(Kvm, entry)
      }
    })
    return Promise.all([...updatePromises, ...addPromises])
  }

  async removeEntry (Kvm, entry) {
    return this.request.delete(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${Kvm.name}/entries/${entry.name}`)
  }

  async addEntry (Kvm, entry) {
    return this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${Kvm.name}/entries`, entry)
  }

  async updateEntry (Kvm, entry) {
    return this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${Kvm.name}/entries/${entry.name}`, entry)
  }

  async removeAndAddEntry (Kvm, entry) {
    await this.removeEntry(Kvm, entry)
    return this.addEntry(Kvm, entry)
  }

  async delete (name) {
    try {
      await this.request.delete(`/organizations/${this.config.organization}/environments/${this.config.environment}/keyvaluemaps/${name}`)
    } catch (e) {
      console.log('Kvm not found. Skipping.')
    }
  }

}

module.exports = Kvm
