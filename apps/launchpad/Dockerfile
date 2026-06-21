FROM node:lts-alpine AS builder

RUN apk add --no-cache git bash curl jq

WORKDIR /app

RUN git clone https://github.com/Danish-Spots/launchpad.git

WORKDIR /app/launchpad

RUN npm install

RUN npm build
