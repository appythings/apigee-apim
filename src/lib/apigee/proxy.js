const {expect} = require('chai')

class Proxy {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  async list (organization, environment) {
    const response = await this.request(`/organizations/${organization}/apis`)
    return response.data
  }

  async detail (organization, environment, name) {
    try {
      const deployment = await this.request(`/organizations/${organization}/environments/${environment}/apis/${name}/deployments`)
      const revision = deployment.data.revision.find((rev) => rev.state === 'deployed')
      const response = await this.request(
        {
          url: `/organizations/${organization}/apis/${name}/revisions/${revision.name}?format=bundle`,
          responseType: 'stream'
        })
      return response.data
    } catch (e) {
      console.log(`Proxy ${name} is not deployed in ${environment}`)
      return null
    }
  }

  async add (organization, environment, Proxy, name) {
    if (Proxy !== null) {
      try {
        const response = await this.request({
          url: `/organizations/${organization}/apis?action=import&name=${name}`,
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          method: 'POST',
          data: Proxy
        })
        await this.request.post(`/organizations/${organization}/environments/${environment}/apis/${name}/revisions/${response.data.revision}/deployments?override=true`, {})
      } catch (e) {
        console.log(e)
      }
    }
  }

  async delete (organization, environment, name) {
    try {
      // await this.request.delete(`/organizations/${organization}/environments/${environment}/apis/${name}/revisions/3/deployments`)
      await this.request.delete(`/organizations/${organization}/apis/${name}`)
    } catch (e) {
      console.log(e)
      console.log('Proxy not found. Skipping. ')
    }
  }

  async migrate () {
    const names = await this.list(this.config.oldOrg, this.config.environment)
    console.log(`migrating ${names.length} proxies`)
    for (const name of names) {
      process.stdout.write('.')
      const detail = await this.detail(this.config.oldOrg, this.config.environment, name)
      await this.add(this.config.newOrg, this.config.environment, detail, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(names.length)
  }

  async cleanup () {
    const names = await this.list(this.config.oldOrg, this.config.environment)
    console.log(`Cleaning up ${names.length} proxies`)
    for (const name of names) {
      process.stdout.write('.')
      await this.delete(this.config.newOrg, this.config.environment, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(0)
  }
}
module.exports = Proxy
