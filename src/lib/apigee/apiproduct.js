const Application = require('./application')

class Apiproduct {
  constructor (request, config) {
    this.request = request
    this.config = config
    this.applications = new Application(request, config)
  }

  setRequest (request) {
    this.request = request
  }

  async listAPIProducts () {
    const response = await this.request(`/organizations/${this.config.organization}/apiproducts`)
    return response.data;
  }

  async detail (name) {
    try {
      const response = await this.request(`/organizations/${this.config.organization}/apiproducts/${name}`)
      return response.data
    } catch (e) {
      console.log(`apiproduct ${name} does not exist. Will now try to create it.`)
    }
    return false
  }

  async createIfNotExists (Apiproduct) {
    try {
      const detail = await this.detail(Apiproduct.name)
      if (!detail) {
        await this.request.post(`/organizations/${this.config.organization}/apiproducts`, Apiproduct)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async add (Apiproduct) {
    const detail = await this.detail(Apiproduct.name)
    if (detail) {
      await this.request.put(`/organizations/${this.config.organization}/apiproducts/${Apiproduct.name}`, Apiproduct)
    } else {
      await this.request.post(`/organizations/${this.config.organization}/apiproducts`, Apiproduct)
    }
  }

  async delete (name) {
    try {
      await this.request.delete(`/organizations/${this.config.organization}/apiproducts/${name}`)
    } catch (e) {
      console.log('Apiproduct not found. Skipping.')
    }
  }
}
module.exports = Apiproduct
