FROM node:6.1.0-wheezy 

RUN mkdir /usr/src/goof
COPY . /usr/src/goof
WORKDIR /usr/src/goof

RUN npm install
EXPOSE 3112
EXPOSE 31337
CMD ["npm", "start"]
