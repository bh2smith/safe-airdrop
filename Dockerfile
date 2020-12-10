FROM node:alpine

WORKDIR /app

COPY package.json /app

RUN yarn install --silent

COPY . /app

CMD ["yarn", "run", "start"]
