class Space {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/spaces`)
    return response.data
  }

  async get (name) {
    try {
      const response = await this.request(`/organizations/${this.config.organization}/spaces/${name}`)
      return response.data
    } catch (e) {
      if (e.response && e.response.status === 404) {
        return null
      }
      throw e
    }
  }

  async create ({ name, displayName }) {
    const response = await this.request.post(`/organizations/${this.config.organization}/spaces`, { name, displayName })
    return response.data
  }

  async update (name, displayName) {
    const response = await this.request({
      method: 'PATCH',
      url: `/organizations/${this.config.organization}/spaces/${name}`,
      data: { displayName }
    })
    return response.data
  }

  async delete (name) {
    await this.request.delete(`/organizations/${this.config.organization}/spaces/${name}`)
  }

  async getIamPolicy (name) {
    const response = await this.request(`/organizations/${this.config.organization}/spaces/${name}:getIamPolicy`)
    return response.data
  }

  async setIamPolicy (name, bindings) {
    const response = await this.request.post(
      `/organizations/${this.config.organization}/spaces/${name}:setIamPolicy`,
      { policy: { bindings } }
    )
    return response.data
  }

  async syncIamPolicy (name, members) {
    const bindingsMap = {}
    for (const { member, role } of members) {
      if (!bindingsMap[role]) {
        bindingsMap[role] = []
      }
      bindingsMap[role].push(member)
    }
    const bindings = Object.entries(bindingsMap).map(([role, members]) => ({ role, members }))
    return this.setIamPolicy(name, bindings)
  }
}

module.exports = Space
