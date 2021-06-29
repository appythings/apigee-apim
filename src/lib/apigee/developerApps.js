class DeveloperApps {
  constructor (request, config) {
    this.request = request
    this.config = config
  }

  setRequest (request) {
    this.request = request
  }

  async getCustomAttributes(developer, app) {
    try {
      const customAttributes =  this.request.get(`/organizations/${this.config.organization}/developers/${developer}/apps/${app}/attributes`)
      return customAttributes
    } catch (e) {
      console.log('Something went wrong while getting custom attributes.')
      console.log(e)
    }
  }

  async getCustomAttribute(developer, app, attributeName) {
    console.log(`/organizations/${this.config.organization}/developers/${developer}/apps/${app}/attributes/${attributeName}`);
    try {
      const customAttributes = await this.request.get(`/organizations/${this.config.organization}/developers/${developer}/apps/${app}/attributes/${attributeName}`)
      console.log(customAttributes.data.value)
    } catch (e) {
      if (e.response.status = '404') {
        console.log('Custom attribute does not exist')
      } else{
        console.log(e)
      }
    }
  }

  async updateCustomAttribute(developer, app, attributeName, attributeValue) {
    const customAttributesRequest = await this.getCustomAttributes(developer, app)
    const customAttributes = customAttributesRequest.data

    // update attribute value if exists
    var updated = false;
    for( var k = 0; k < customAttributes.attribute.length; ++k ) {
      if (customAttributes.attribute[k].name == attributeName) {
        console.log('Changed attribute "'+attributeName+'" value from "'+customAttributes.attribute[k].value+ '" to "' + attributeValue+'"')
        customAttributes.attribute[k].value = attributeValue
        updated = true
      }
    }

    // update attribute value if attribute is new
    if(!updated) {
      console.log('Add attribute "'+attributeName+'" with value "'+attributeValue+'"')
      customAttributes.attribute.push({name:attributeName,value:attributeValue});
    }

    try {
      await this.request.post(`/organizations/${this.config.organization}/developers/${developer}/apps/${app}/attributes`,customAttributes)
      console.log('Successfully updated custom attribute of app '+ app)
    } catch (e) {
      console.log('Something went wrong while setting custom attribute.')
      console.log(e)
    }
  }

}
module.exports = DeveloperApps
