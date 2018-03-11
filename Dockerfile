FROM node:8

ENV APP_HOME /opt/bizumie-oauth
ENV NPM_CONFIG_LOGLEVEL warn
ENV PORT 80

WORKDIR $APP_HOME

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE $PORT

CMD npm start
