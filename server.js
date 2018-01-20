const express = require('express')
const server = express();
const port = 8080;
const environment = server.get('env')
const bodyParser = require('body-parser');
const logger = require('morgan');
const fs = require('fs');
const session = require('express-session');
const mongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const MongoStore = require('connect-mongo')(session);
const keys = require("./keys.json")
const cookieParser = require('cookie-parser')
server.set('view engine', 'pug')

server.use(express.static('public'))
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
  extended: true
}));
server.use(cookieParser())
server.use(logger('dev'));
server.use(session({
  secret: keys.session,
  resave: false,
  rolling: true,
  cookie: { maxAge: 900000 },
  store: new MongoStore({
    url: 'mongodb://admin:'+keys.mongoPassword+'@localhost/session?authSource=admin'
  }),
  saveUninitialized: false
}))

server.listen(port, function() {
  console.log('Server is running! on port ' + port + ' and is running with a ' + environment + ' environment.');
})

server.get('/', function(req, res) {
  res.render('index')
})
