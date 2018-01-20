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
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
    let userSession = req.session;
  if (!userSession.user) {
    res.redirect('/login');
  } else {
     res.redirect('/home');
  }
})

server.get('/login', function(req, res) {
   var cookie = req.cookies;
  if (cookie.loggedIn == 'true') {
    console.log('User was logged off. Deleting cookie')
    res.cookie('loggedIn', false, {
      maxAge: new Date(0)
    });
    res.render('login', {
      wasLoggedOff: true
    })
  } else if (cookie.loggedIn == undefined) {
    console.log('No cookie found. First time visitor.')
    res.render('login')
  }
})

server.get('/register', function(req, res) {
  res.render('register')
})

server.post('/login', function(req,res){
  let userSession = req.session;
    mongoClient.connect("mongodb://admin:"+keys.mongoPassword+"@localhost/?authSource=admin", function(error, client) {
        if (!error) {
            console.log("Connected successfully to MongoDB server");
            let db = client.db('users');
            let collection = db.collection('logins');
            collection.findOne({
                username: req.body.username.toLowerCase().trim() 
            }, function(error, user) {
                if (user !== null) {
                    if (bcrypt.compareSync(req.body.password, user.password)) {
                        userSession.user = user.username;
                        collection = db.collection('info');
                        collection.findOne({
                            _id: user._id
                        }, function(err, result) {
                            userSession.firstname = result.firstName
                            userSession.lastname = result.lastName
                            client.close();
                            res.redirect('/home')
                        })
                    }
                    else {
                        res.render('login', {
                        errorMsg: 'Login failed! Bad Password.'
                    })
                    }
                }
                else {
                    res.render('login', {
                        errorMsg: 'Login failed! Bad Username.'
                    })
                }
            });
        }
        else {
            console.dir(error);
            res.send(error);
        }
    });
})

server.post('/register', function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if (!err) {
            mongoClient.connect("mongodb://admin:"+keys.mongoPassword+"@localhost/?authSource=admin", function(error, client) {
                if (!error) {
                    console.log("Connected successfully to MongoDB server");
                    let db = client.db('users');
                    console.log("Creating default avatar")
                    const randNum = Math.floor((Math.random() * 1000000) + 123456789);
                    const avatarName = toTitleCase(req.body.firstname) + "-" + toTitleCase(req.body.lastname) + "-" + randNum + ".jpg"
                    fs.writeFile("public/resources/userPictures/" + avatarName, new Buffer(keys.fileContent, "base64"), (err) => {
                        if (err) throw err;
                        console.log("The avatar was succesfully saved!");
                    });
                    let collection = db.collection('logins')
                    collection.insert({
                        username: req.body.username.toLowerCase().trim(),
                        password: hash
                    }, function(err, newuser) {
                        var uniqueID = newuser.ops[0]._id;
                        collection = db.collection('info');
                        collection.insert({
                            _id: uniqueID,
                            firstName: toTitleCase(req.body.firstname),
                            lastName: toTitleCase(req.body.lastname),
                            email: req.body.email.toLowerCase()
                        }, function(error, result) {
                            client.close();
                        });
                    });
                }
                else {
                    console.dir(error);
                    res.send(error);
                }
            });
        }
        else console.log(err)
    });
    res.redirect('/login');
})

server.get('/home', function(req, res) {
  let userSession = req.session;
  if (!userSession.user) {
    res.redirect('/login');
  } else {
      res.render('feed',{
          fname: userSession.firstname,
          lname: userSession.lastname,
          uname: userSession.user,
          allposts: []
      })
  }
})

server.get('/logout', function(req, res) {
  let cookie = req.cookies;
  console.log('Deleting cookie')
  res.cookie('loggedIn', false, {
    maxAge: new Date(0)
  });
  req.session.destroy();
  console.log("session destroyed")
  res.redirect('/')
})

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}