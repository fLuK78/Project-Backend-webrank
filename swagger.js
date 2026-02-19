const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Competition API',
    description: 'API สำหรับจัดการสมาชิกและการแข่งขัน',
  },
  host: 'localhost:4000',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'authorization',
      description: 'กรุณาใส่ Token ในรูปแบบ: Bearer <your_token>'
    }
  },
  definitions: {
    RegisterModel: {
      username: "user123",
      name: "John Doe",
      email: "john@example.com",
      password: "password123"
    },
    LoginModel: {
      email: "john@example.com",
      password: "password123"
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/index.js']; 

swaggerAutogen(outputFile, endpointsFiles, doc);