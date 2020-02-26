FROM node:8-slim

RUN mkdir /usr/src/goof
RUN mkdir /tmp/extracted_files
COPY . /usr/src/goof
WORKDIR /usr/src/goof

RUN apt-get update && apt-get upgrade -y libsasl2-2=2.1.27~101-g0780600+dfsg-3+deb9u1

RUN apt-get remove -y curl
RUN apt-get remove -y libcurl3

FROM node:lts-buster-slim

RUN npm update
RUN npm install
EXPOSE 3001
EXPOSE 9229
ENTRYPOINT ["npm", "start"]
