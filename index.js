const server = require('./src/server.js');

server.start( (err) => {
  if(err) throw err;
  console.log(`server is running on ${server.info.uri}`);
})
