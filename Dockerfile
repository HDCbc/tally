LABEL maintainer "jonathan.zacharuk@ascentech.ca"

FROM node:7.4

# Create app directory
RUN mkdir -p /srv/app/
WORKDIR /srv/app/

# Install app dependencies
COPY package.json /srv/app/
RUN npm install

# Bundle app source
COPY . /srv/app/

CMD [ "npm", "start"]
