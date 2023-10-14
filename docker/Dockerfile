FROM node:20.7-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

#RUN npm ci --omit=dev
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8080
CMD [ "node", "dist/app.js" ]

