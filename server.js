var express = require("express"),
Yo = require("yo-api"),
nconf = require("nconf"),
GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
passport = require("passport"),
session = require("express-session"),
bodyParser = require('body-parser'),
ejs = require('ejs'),
app = express(),
Gmail = require("node-gmail-api"),
Hue = require('philips-hue'),
hue = new Hue();
var path = require('path')


function initalLoad() {
  hue.getBridges(function(err, bridges){
    if(err) return console.error(err);
    console.log(bridges);

    var bridge = bridges[0]; // use 1st bridge

    console.log("You have 10 seconds to hit the bridge!  Run!!!");
    setTimeout(function() {
      hue.auth(bridge, function(err, username){
        if(err) return console.error(err);
        console.log("bridge: "+bridge);
        console.log("username: "+username);
      });
    }, 10000);

  });
}

var conf_file = process.env.HOME + '/.hue.json';
hue.loadConfigFile(conf_file, function(err, conf){
  if (err) {
    initialLoad();
    return;
  }          
  blinkLight({bri:254, xy:[.530,0.420]}, 1.0);

});

function blinkLight(state, seconds) {
  hue.light(7).setState(state);
  setTimeout(function() {
    hue.light(7).setState({bri:254, hue: 14910, sat: 144});
  }, seconds * 1000);
}

var emails = [];

nconf.argv()
  .env()
  .file({ file: "config.json" });

var yo = new Yo(nconf.get("yo"));
var lastYoName = "";

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false }))

function User(username, email) {
  this.username = username;
  this.email = email;
  this.hasNotified = false;
}

app.use(session({secret: nconf.get("session-secret"), resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: nconf.get("gmail-client"),
    clientSecret: nconf.get("gmail-secret"),
    callbackURL: "http://127.0.0.1:8080/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // https://www.youtube.com/watch?v=jG2KMkQLZmI
    var newUser = new User(lastYoName, new Gmail(accessToken));
    emails.push(newUser);
    yo.yo(newUser.username, function (err, res, body) {
      console.log("Just sent a signup Yo to " + newUser.username);
    })
    return done(null, null);
  }
));

app.get("/", function(req, res) {
 res.locals.signed = req.query.success != null;
 res.render("index.ejs")
});

app.post("/submit", function(req, res) {
  lastYoName = req.body.username;
  res.redirect("/auth/google");
});

app.get('/auth/google', 
  passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile' }),
  function(req, res) {
    res.redirect('/?success');
});

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/?success' }),
  function(req, res) {
    res.redirect('/?success');
});

setInterval(function() {
  for (var i = 0; i < emails.length; i++) {
    if (emails[i].hasNotified) {
      continue;
    }
    var user = emails[i];
    var email = emails[i].email;
    var yoName = emails[i].username;
    var s = email.messages("label:inbox", {max: 1});
    s.on("data", function(d) {

      var shouldSendYo = true
      var subjectHeader;
      for (var j = 0; j < d.payload.headers.length; j++) {
        var header = d.payload.headers[j];

        if (header.name == "From" && header.value.indexOf("@gmail.com") == -1) {
          shouldSendYo = false
        }
        if (header.name == "Subject" && header.value.indexOf("WWDC") == -1) {
          shouldSendYo = false
        }
        if (header.name == "Subject") {
          subjectHeader = header;
        }
      }
      if (shouldSendYo) {
        yo.yo(yoName, function (err, res, body) {
          console.log("HEY, WE JUST YO'D " + yoName);
        })

        // more parsing for hue lights
        if (header.value.indexOf("won") > -1) {
          blinkLight({bri:254, xy:[0.37,0.51721]}, 2.0);
        } else {
          blinkLight({bri:254, xy:[0.6679, 0.6679]}, 2.0);
        }
        user.hasNotified = true;
      }
    })
  }
}, 3000);

app.listen(8080, function(){
  console.log("Listening on port 8080");
});