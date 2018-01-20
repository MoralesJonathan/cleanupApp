const express = require('express')
const server = express();
const port = 8080;
const environment = server.get('env')
const keys = require("keys.json")

server.listen(port, function() {
  console.log('Server is running! on port ' + port + ' and is running with a ' + environment + ' environment.');
})

