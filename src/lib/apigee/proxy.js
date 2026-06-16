class Proxy {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async list () {
    const response = await this.request(`/organizations/${this.config.organization}/apis`)
    return response.data
  }

  async detail (name) {
    try {
      const deployment = await this.request(`/organizations/${this.config.organization}/apis/${name}/deployments`)
      const revision = deployment.data.environment[1].revision.find((rev) => rev.state === 'deployed')
      const response = await this.request(
        {
          url: `/organizations/${this.config.organization}/apis/${name}/revisions/${revision.name}?format=bundle`,
          responseType: 'stream'
        })
      return response.data
    } catch (e) {
      console.log(`Proxy ${name} is not deployed in ${this.config.environment}`)
      return null
    }
  }

  async deployment (name) {
    try  {
      const deployment = await this.request(`/organizations/${this.config.organization}/environments/${this.config.environment}/apis/${name}/deployments`)

      return deployment.data.revision ? deployment.data.revision.find((rev) => rev.state === 'deployed')?.name : deployment.data.deployments ? deployment.data.deployments[0].revision : null
    } catch (e) {
      if(e.response.status !== 404){
        throw e
      }
      return null
    }
  }

  async getMetadata (name) {
    try {
      const response = await this.request(`/organizations/${this.config.organization}/apis/${name}`)
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
      `/organizations/${this.config.organization}/apis/${name}:move`,
      space ? { space } : {}
    )
  }

  async add (Proxy, name, serviceAccount, space) {
    const spaceParam = space ? `&space=${space}` : ''
    const response = await this.request({
      url: `/organizations/${this.config.organization}/apis?action=import&name=${name}${spaceParam}`,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      method: 'POST',
      data: Proxy
    })
    return this.deploy(name, response.data.revision, serviceAccount)
  }

  async ensureSpace (name, targetSpace) {
    const metadata = await this.getMetadata(name)
    if(!metadata) {
      return
    }
    const currentSpace = (metadata && metadata.space) || null
    const desired = targetSpace || null
    if (currentSpace !== desired) {
      await this.move(name, desired)
      console.log(`Moved proxy "${name}" to space: ${desired || '(org level)'}`)
    }
  }

  async deploy (name, revision, serviceAccount) {
    return this.request.post(`/organizations/${this.config.organization}/environments/${this.config.environment}/apis/${name}/revisions/${revision}/deployments?override=true${serviceAccount && serviceAccount !== '' ? `&serviceAccount=${serviceAccount}` : ''}`, {})
  }

  async undeploy (name, revision, serviceAccount) {
    return this.request.delete(`/organizations/${this.config.organization}/environments/${this.config.environment}/apis/${name}/revisions/${revision}/deployments${serviceAccount && serviceAccount !== '' ? `&serviceAccount=${serviceAccount}` : ''}`)
  }

  async delete (name) {
    try {
      await this.request.delete(`/organizations/${this.config.organization}/apis/${name}`)
    } catch (e) {
      console.log(e)
      console.log('Proxy not found. Skipping. ')
    }
  }
}

module.exports = Proxy
