FROM node:24.13.1

RUN npm install -g apigeetool apigee-apim@0.1.48 apigeelint @appythings/apidex-cli

CMD bin/sh
