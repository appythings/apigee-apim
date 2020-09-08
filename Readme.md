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