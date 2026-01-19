const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Member API',
    description: 'API สำหรับจัดการสมาชิก'
  },
  host: 'localhost:4000',
  schemes: ['http']
};

const outputFile = './swagger-output.json';
const routes = ['./src/index.js'];

swaggerAutogen(outputFile, routes, doc);