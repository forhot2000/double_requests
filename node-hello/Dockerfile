FROM node

WORKDIR /src/

RUN npm install pm2 -g

ADD package.json /src/

RUN npm install

ADD . /src/

CMD pm2 start ./process.json --no-daemon
