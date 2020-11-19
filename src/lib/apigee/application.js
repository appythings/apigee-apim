const Developer = require('./developer')
const {expect} = require('chai')

class Application {
  constructor (request, config) {
    this.request = request
    this.config = config
    this.developer = new Developer(request, config)
  }

  setRequest (request) {
    this.request = request
  }

  async list (organization, products) {
    const response = await this.request(`/organizations/${organization}/apps?expand=true&includeCred=true`)
    return response.data.app.filter(
      app => {
        // Check if credential has any apiproducts that are fetched from dev
        return app.credentials.findIndex(
          credential => {
            credential.apiProducts = credential.apiProducts.filter(apiProduct => products.findIndex(
              product => {
                return product.name === apiProduct.apiproduct
              }
            ) > -1)
            return credential.apiProducts.length > 0
          }
        ) > -1
      }
    )
  }

  async detail (organization, developer, appName) {
    try {
      const response = await this.request.get(`/organizations/${organization}/developers/${developer.email}/apps/${appName}`)
      return response.data
    } catch (e) {
      // console.log(e)
    }
    return false
  }

  async add (oldOrganization, organization, Application) {
    try {
      const developer = await this.developer.detail(oldOrganization, Application.developerId)

      const detail = await this.detail(organization, developer, Application.name)
      if (detail) {
        for (const credential of detail.credentials) {
          const productsToAdd = {apiProducts: credential.apiProducts.map(product => product.apiproduct)}
          await this.request.post(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}/keys/${credential.consumerKey}`, productsToAdd)
          for (const product of credential.apiProducts) {
            await this.request(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}/keys/${credential.consumerKey}/apiproducts/${product.apiproduct}?action=approve`, {}, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            })
          }
        }
      } else {
        const createdApp = await this.request.post(`/organizations/${organization}/developers/${developer.email}/apps`, Application)
        await this.request.delete(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}/keys/${createdApp.data.credentials[0].consumerKey}`)
        await Promise.all(Application.credentials.map(async (credential) => {
          try {
            await this.request.delete(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}/keys/${credential.consumerKey}`)
          } catch (e) {
            console.log(`key not found`)
          }
          await this.request.post(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}/keys/create`, {
            consumerKey: credential.consumerKey, consumerSecret: credential.consumerSecret
          })
          await this.request.post(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}/keys/${credential.consumerKey}`, {
            apiProducts: credential.apiProducts.map(product => product.apiproduct)
          })
          for (const product of credential.apiProducts) {
            await this.request(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}/keys/${credential.consumerKey}/apiproducts/${product.apiproduct}?action=approve`, {}, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            })
          }
        }))
      }
    } catch (e) {
      console.log(e, e.message, Application.name)
    }
  }

  async delete (oldOrganization, organization, Application) {
    try {
      const developer = await this.developer.detail(oldOrganization, Application.developerId)
      await this.request.delete(`/organizations/${organization}/developers/${developer.email}/apps/${Application.name}`)
    } catch (e) {
      console.log('Application not found. Skipping.')
    }
  }

  async migrate (products) {
    const details = await this.list(this.config.oldOrg, products)
    await this.developer.migrate(details)
    console.log(`Migrating ${details.length} applications`)
    for (const detail of details) {
      process.stdout.write('.')
      await this.add(this.config.oldOrg, this.config.newOrg, detail)
    }
    return expect(await this.list(this.config.newOrg, products)).to.have.length(details.length)
  }

  async cleanup (products) {
    const details = await this.list(this.config.oldOrg, products)
    console.log(`Cleaning up ${details.length} applications`)
    for (const detail of details) {
      process.stdout.write('.')
      await this.delete(this.config.oldOrg, this.config.newOrg, detail)
    }
    expect(await this.list(this.config.newOrg, this.config.environment)).to.have.length(0)
    return this.developer.cleanup(details)
  }
}
module.exports = Application
