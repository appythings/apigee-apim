const {expect} = require('chai')

class SharedFlow {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  async list (organization, environment) {
    const response = await this.request(`/organizations/${organization}/sharedflows`)
    return response.data
  }

  async detail (organization, environment, name) {
    try {
      const details = await this.request(`/organizations/${organization}/sharedflows/${name}`)
      const revision = details.data.revision[details.data.revision.length - 1] // get last revision
      const response = await this.request(
        {
          url: `/organizations/${organization}/sharedflows/${name}/revisions/${revision}?format=bundle`,
          responseType: 'stream'
        })
      return response.data
    } catch (e) {
      return null
    }
  }

  async add (organization, environment, SharedFlow, name) {
    if (SharedFlow !== null) {
      try {
        const response = await this.request({
          url: `/organizations/${organization}/sharedflows?action=import&name=${name}`,
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          method: 'POST',
          data: SharedFlow
        })
        await this.request({
          url: `/organizations/${organization}/environments/${environment}/sharedflows/${name}/revisions/${response.data.revision}/deployments`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          method: 'post'
        })
      } catch (e) {
        console.log(e)
      }
    }
  }

  async delete (organization, name) {
    try {
      await this.request.delete(`/organizations/${organization}/sharedflows/${name}`)
    } catch (e) {
      console.log('SharedFlow not found. Skipping.')
    }
  }

  async migrate () {
    const names = await this.list(this.config.oldOrg, this.config.environment)
    console.log(`migrating ${names.length} sharedFlows`)
    for (const name of names) {
      process.stdout.write('.')
      const detail = await this.detail(this.config.oldOrg, this.config.environment, name)
      await this.add(this.config.newOrg, this.config.environment, detail, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(names.length)
  }

  async cleanup () {
    const names = await this.list(this.config.oldOrg, this.config.environment)
    console.log(`Cleaning up ${names.length} sharedFlows`)
    for (const name of names) {
      process.stdout.write('.')
      await this.delete(this.config.newOrg, name)
    }
    return expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(0)
  }
}
module.exports = SharedFlow
