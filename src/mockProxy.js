const readSwaggerFile = require('./helper/readSwaggerFileHelper')
const Apigee = require('./lib/apigee')
const fs = require('fs-extra')
const { json2xml } = require('xml-js');
const { JSONSchemaFaker} = require('json-schema-faker')
const SwaggerParser = require("@apidevtools/swagger-parser");

//variables used for functions below
const options = {compact: true, spaces: 4}
const folderName = './apiproxy';

function createMockProxy (spec) {
  return {
    APIProxy: {
      "_attributes": {
        "revision": "1",
        "name": 'mockProxy'
      },
      DisplayName: '',
      Description: 'description 1',
      BasePaths: spec.servers[0].url,
      ProxyEndpoints: {
        ProxyEndpoint: "default"
      }
    }
  }
}

function createManifests() {
  return {
    "_declaration": {
      "_attributes": {
        "version": "1.0",
        "encoding": "UTF-8",
        "standalone": "yes"
      }
    },
    Manifest: {
      "_attributes": {
        "name": "manifest"
      },
      Policies: '',
      ProxyEndpoints: {
        VersionInfo: {
          "_attributes" : {
            "resourceName": "default",
            version: "some SHA-512 key"
          }
        }
      },
      Resources: '',
      SharedFlows: '',
      TargetEndpoints: ''
    }
  }
}

function createResponse (specPaths, path, verb) {
  if (specPaths[verb].responses['200'] || specPaths[verb].responses['201'] || specPaths[verb].responses['203']) {
    createPolicies(specPaths[verb])
    return { Step: {
        Name: `AM-${specPaths[verb].operationId}`
      }
    }
  } else {
    return ''
  }
}

function createFlow (spec) {
  let flows = Object.keys(spec.paths).map(path => {
    return Object.keys(spec.paths[path]).map(verb => {
      return {
        "_attributes": {
          "name": `${spec.paths[path][verb].operationId}`
        },
        Description: spec.paths[path][verb].operationId,
        Request: "",
        Response: createResponse(spec.paths[path], path, verb),
        Condition: `(proxy.pathsuffix MatchesPath "${path}") and (request.verb = "${verb.toUpperCase()}")`
      }
    })
  })

  const copyItems = [];
  flows.forEach(flow => {
    flow.forEach(f => {
      copyItems.push(f)
    })
  })
  return copyItems.map(item => item)
}

function createDefaultXml (spec) {
  let defaultObj = {
    "_declaration": {
      "_attributes": {
        "version": "1.0",
        "encoding": "UTF-8",
        "standalone": "yes"
      }
    },
    ProxyEndpoint: {
      "_attributes": {
        "name": "default"
      },
      PreFlow: {
        "_attributes": {
          "name": "PreFlow"
        },
        Request: '',
        Response: '',
      },
      Flows: {
        Flow: createFlow(spec)
      },
      PostFlow: {
        "_attributes": {
          "name": "PostFlow"
        },
        Request: "",
        Response: ""
      },
      HTTPProxyConnection: {
        BasePath: spec.servers[0].url
      },
      RouteRule: {
        "_attributes": {
          "name": "noroute"
        }
      }
    }
  }
  defaultObj = json2xml(defaultObj, options)
  return defaultObj
}

function createPolicies(specPaths) {
  let assignMessage = {
    "_declaration": {
    "_attributes": {
      "version": "1.0",
        "encoding": "UTF-8",
        "standalone": "yes"
    }
  },
    AssignMessage: {
      "_attributes": {
        "continueOnError": "false",
          "enabled": "true",
          "name": `AM-${specPaths.operationId}`
      },
      DisplayName: `AM-${specPaths.operationId}`,
      Properties: '',
      Set: {
        Payload: ''
      },
      IgnoreUnresolvedVariables: true,
      AssignTo: {
        "_attributes": {
          "type": "request",
          "transport": "http",
          "createNew": "false"
        }
      }
    }
  }

  try {
    assignMessage = json2xml(assignMessage, options)
    let payload = ''
    if (specPaths.responses['200']) {
      payload = ((!specPaths.responses['200'].content['application/json']) ? '' : specPaths.responses['200'].content['application/json'].schema)
      payload = JSONSchemaFaker.generate(payload)
      assignMessage = assignMessage.replace('<Payload/>', `<Payload contentType="application/json">${JSON.stringify(payload)}</Payload>`)
    }
    if (specPaths.responses['201']) {
      payload = ((!specPaths.responses['201'].content['application/json']) ? '' : specPaths.responses['201'].content['application/json'].schema)
      assignMessage = assignMessage.replace('<Payload/>', `<Payload>${JSON.stringify(payload)}</Payload>`)
    }
    if (specPaths.responses['203']) {
      payload = ((!specPaths.responses['203'].content['application/json']) ? '' : specPaths.responses['203'].content['application/json'].schema)
      assignMessage = assignMessage.replace('<Payload/>', `<Payload>${JSON.stringify(payload)}</Payload>`)
    }

    try {
      if (fs.existsSync(folderName)) {
        fs.writeFile(`./apiproxy/policies/AM-${specPaths.operationId}.xml`, assignMessage)
      }
    } catch (err) {
      console.error(err)
    }
  } catch (err) {
    console.error("Wrong Content-Type.")
  }

}

async function mockProxy (config, file) {
  try {
    const spec = readSwaggerFile(file)
    // const spec = file
    let parser = new SwaggerParser();
    await parser.dereference(spec)
    // creer variabelen voor elke .xml file
    const mockProxyXml = json2xml(createMockProxy(spec), options)
    const manifestsXml = json2xml(createManifests(spec), options)
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
      fs.mkdirSync('./apiproxy/policies');
      fs.mkdirSync('./apiproxy/manifests');
      fs.mkdirSync('./apiproxy/proxies');
      if (fs.existsSync(folderName)) {
        fs.writeFile('./apiproxy/mockProxy.xml', mockProxyXml);
        fs.writeFile('./apiproxy/manifests/manifests.xml', manifestsXml);
        fs.writeFile('./apiproxy/proxies/default.xml', createDefaultXml(spec));
      }
    }
    console.log('APIProxy created')
  } catch (err) {
    console.error(err);
  }
}

module.exports = mockProxy;
