# Overview
Apigee-apim is a NPM tool can be used to integrate CICD development for all Apigee implementations:
* Apigee Edge
* Apigee X
* Apigee Hybrid

> :info: **Apigee X/Hybrid users**: keep an eye out for small differences in implementation when using these forms of Apigee.

# Setup
Run the following commands to install:
```
npm install apigee-apim -g
```

Set environment variables (powershell)
```
$env:APIGEE_USERNAME=""
$env:APIGEE_PASSWORD=""
```

## Repository
The following repository setup is recommended:
```bash
- apiproxy
- config.yaml
```

In order to extend for different environments:
```bash
- apiproxy
- config
  - env1.yaml
  - env2.yaml
  - env3.yaml

```

## Parameters
There is a list of parameters that can be added as options to the commands that are implemented by this tool.

| Flag | Argument | Shorthand | Required | Description |
|-|-|-|-|-|
| `--org`             | `<organization` (string) | `-o` | :heavy_check_mark: | The Apigee target organization |
| `--environment`           | `<env>` (string) | `-e` | | The Apigee target environment |
| `--version`               | `<version>` (string) | `-v` | |  |
| `--hybrid`  | `<accessToken>` (string) | `-h` | | Option to change format for Hybrid. Expects valid GCP auth token |
| `--baseuri <baseuri>`     | `<baseure>` (string) | `-L` | | Option to overwrite baseUri | 
| `--token <accessToken>`   | | `-t` | |  | 


# Apigee Components
The main reason to use the tool is to manipulate the contents of the Apigee management plane. This management plane is either self-managed or managed by Apigee/Google depending on the version of Apigee.

## Configuration
This tool uses a configuration file (.yaml) to pass the additional information to the Apigee API. You can extend the usage of the config file to hold variables used by development process of your choice (e.g.: Extend yaml with variables to be read by CICD)

Default components needed by this tool are:

```yaml
# template of supported configuration
# indentation using spaces

# product configuration
products:
  - name: product1
    description: |
      this is an apigee product named product1
    environments:
      - dev
    proxies:
      - proxy-A
      - proxy-B

# key value map configuration
kvms:
  kvm1:
    encrypted: true
    key1: "{env-variable}"
    key2: "{env-variable2}"
    key3: "plain-variable"

# target server configuration    
targetServers:
  - name: target1
    host: target1.com
  - name: target2
    host: target2.com
    port: 8080
  - name: target3
    host: target3.com
    sSLInfo:
      clientAuthEnabled: true
      keyStore: target3-keystore
      trustStore: target3-truststore
      keyAlias: target3-key

```

## Products
Product are defined on the organization level

### Deploy products: `products` 

```
apigee-apim products products.yaml --org <org>
```

### List all products in organization: `listAPIProducts`

```
apigee-apim listAPIProducts --org <org>
```

## Key Value Maps (KVMs)

KVMs can be deployed on the organization and environment level.

> :warning: **If you are using Hybrid/X**: It is no longer possible to add entries to KVMs outside of the message processor. Meaning that a KVM Admin Proxy has to be implemented to add values to a KVM.

### Deploy Key Value Map: `kvms`

```
apigee-apim kvms kvms.yaml --org <org> --env test 
```
KVM configuration:
```yaml
kvms:
  test1:
    key2: "{environmentvariable}"
    key3: "{environmentvariable2}"
    key4: "plain-variable"
```
Encrypted KVM configuration:
```yaml
kvms:
  test1:
    encrypted: true
    key2: "{environmentvariable}"
    key3: "{environmentvariable2}"
    key4: "plain-variable"
```
## Target Servers

### Deploy Target Servers: `targetservers`
```
apigee-apim targetservers targetServers.yaml --org <org> --env test
```
targetServers.yaml
```yaml
targetServers:
  - name: google
    host: google2.com
  - name: google1
    host: google1.com
    port: 8080
  - name: google2
    host: google2.com
    sSLInfo:
      clientAuthEnabled: true
      keyStore: google-keystore
      trustStore: google-truststore
      keyAlias: google-key
```

## Caches

### Deploy caches: `caches`
```
apigee-apim caches caches.yaml --org <org> --env test
```
caches.yaml
```yaml
caches:
  - name: cache-1
    description: cache-1
    expirySettings:
        valuesNull: true/false
    timeoutInSec: {sec}
    timeOfDay: {hh:mm:ss:}
    expiryDate: {mm-dd-yyy}
    overflowToDisk: true/false
    skipCacheIfElementSizeInKBExceeds: {num_elements}
```

## Resource files

### Deploy resource files: `resourcefiles`
```
apigee-apim resourcefiles resourcefiles.yaml --org <org> --env test
```
resourcefiles.yaml
```yaml
resourcefiles:
  test:
    type: "properties"
    filename: "test.properties"
```
## Proxies
Call this from the directory above 'apiproxy' or specify a different directory using `--directory -d`


### Deploying a proxy: `deploy`

```
apigee-apim deploy -n <apiName> --org <org> --env <env>
```
### Deploying an existing revision: `deployExistingRevision`
```
apigee-apim deployExistingRevision -n <apiName> -r <rev> --org <org> --env <env>
```
### List currently deployed revision: `listDeployedRevision`
```
apigee-apim listDeployedRevision -n <apiName> --org <org> --env <env>
```

# Spec API
This functionality is in alpha release and is only available for orgs that have this enabled.
```
apigee-apim deploySpec -s <spec> -a <apiproduct> -p <portal> --org <org> --env <env>
```

# Developer Apps 

## Custom attributes
Call this from command line when globally installed to upsert a custom attribute
```
 apigee-apim updateCustomAttribute --org <org> --dev <developer> --app <appName> --attributeName <attributeName> --attributeValue <attributeValue>
```
