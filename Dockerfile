FROM node:11.4.0

RUN npm install -g apigeetool apigee-apim@0.1.32 apigeelint

CMD bin/sh
