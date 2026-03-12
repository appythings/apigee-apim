FROM node:24.13.1

RUN npm install -g apigeetool apigee-apim@0.1.43 apigeelint

CMD bin/sh
