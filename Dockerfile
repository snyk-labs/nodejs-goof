# FROM node:6-stretch 
FROM node:18.13.0

RUN mkdir /testing
RUN mkdir /usr/src/goof
RUN mkdir /tmp/extracted_files
COPY . /usr/src/goof
WORKDIR /usr/src/goof

RUN npm update
RUN npm install
EXPOSE 3001
EXPOSE 9229
EXPOSE 8443
EXPOSE 443
ENV API_TOKEN=mytestapitoken
ENTRYPOINT ["npm", "start"]
