class SharedFlow {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
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

  async getMetadata (name) {
    try {
      const response = await this.request(`/organizations/${this.config.organization}/sharedflows/${name}`)
      return response.data
    } catch (e) {
      if (e.response && e.response.status === 404) {
        return null
      }
      throw e
    }
  }

  async move (name, space) {
    return this.request.post(
      `/organizations/${this.config.organization}/sharedflows/${name}:move`,
      space ? { space } : {}
    )
  }

  async ensureSpace (name, targetSpace) {
    const metadata = await this.getMetadata(name)
    const currentSpace = (metadata && metadata.space) || null
    const desired = targetSpace || null
    if (currentSpace !== desired) {
      await this.move(name, desired)
      console.log(`Moved shared flow "${name}" to space: ${desired || '(org level)'}`)
    }
  }

  async add (SharedFlow, name, serviceAccount, space) {
    if (SharedFlow !== null) {
      const spaceParam = space ? `&space=${space}` : ''
      const response = await this.request({
        url: `/organizations/${this.config.organization}/sharedflows?action=import&name=${name}${spaceParam}`,
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        method: 'POST',
        data: SharedFlow
      })
      await this.request({
        url: `/organizations/${this.config.organization}/environments/${this.config.environment}/sharedflows/${name}/revisions/${response.data.revision}/deployments?override=true${serviceAccount && serviceAccount !== '' ? `&serviceAccount=${serviceAccount}` : ''}`,
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
