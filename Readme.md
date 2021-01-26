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

# Products
```
apigee-apim products products.yaml --org <org>
```

```
products:
  - name: test-cmd-tool
    description: |
      test-cmd-tool2
    environments:
      - test
    proxies:
      - apigee-account-proxy-v1
```
List all products in an org:
```
apigee-apim listAPIProducts --org <org>
```

# KVMS
```
apigee-apim kvms kvms.yaml --org <org> --env test 
```
kvms.yaml
```
kvms:
  test1:
    key2: value1
    key3: value9
```
# Target Servers
```
apigee-apim targetservers targetServers.yaml --org <org> --env test
```
targetServers.yaml
```
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

# Caches
```
apigee-apim caches caches.yaml --org <org> --env test
```
caches.yaml
```
caches:
  - description: cache-1
    expirySettings:
        valuesNull: true/false
    timeoutInSec: {sec}
    timeOfDay: {hh:mm:ss:}
    expiryDate: {mm-dd-yyy}
    overflowToDisk: true/false
    skipCacheIfElementSizeInKBExceeds: {num_elements}
```
# Proxies

## deploy
Call this from the directory above 'apiproxy' or specify a different directory using -d
```
apigee-apim deploy -n <apiName> --org <org> --env <env>
```
## deploy existing revision
```
apigee-apim deployExistingRevision -n <apiName> -r <rev> --org <org> --env <env>
```
## list currently deployed revision
```
apigee-apim listDeployedRevision -n <apiName> --org <org> --env <env>
```

# Spec API
This functionality is in alpha release and is only available for orgs that have this enabled.
```
apigee-apim deploySpec -s <spec> -a <apiproduct> -p <portal> --org <org> --env <env>
```
