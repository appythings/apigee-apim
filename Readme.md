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
apigee-apim kvms kvms.yaml --org euw1-partner07 --env test 
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
apigee-apim targetservers targetServers.yaml --org euw1-partner07 --env test
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