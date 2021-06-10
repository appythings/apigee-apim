FROM node:11.4.0

RUN npm install -g apigeetool apigee-apim apigeelint

CMD bin/sh
