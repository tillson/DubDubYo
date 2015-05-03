var express = require("express");
var Yo = require("yo-api");
var nconf = require("nconf");
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var passport = require("passport");
var session = require("express-session");
var bodyParser = require('body-parser');
var ejs = require('ejs');
var app = express();

var Gmail = require("node-gmail-api");
var emails = [];

nconf.argv()
  .env()
  .file({ file: "config.json"});

var yo = new Yo(nconf.get("yo"));
var lastYoName = "";

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false }))

app.use(session({secret: nconf.get("session-secret"), resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

function User(username, email) {
    this.username = username;
    this.email = email;
    this.hasNotified = false;
}

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


app.listen(8080, function(){
  console.log("Listening on port " +  8080);
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
      for (var j = 0; j < d.payload.headers.length; j++) {
        var header = d.payload.headers[j];
        // Email is @gmail.com for now, for testing purposes.
        if (header.name == "From" && header.value.indexOf("@apple.com") == -1) {
          shouldSendYo = false
        }
        if (header.name == "Subject" && header.value.indexOf("WWDC") == -1) {
          shouldSendYo = false
        }
      }
      if (shouldSendYo) {
        yo.yo(yoName, function (err, res, body) {
          console.log("HEY, WE JUST YO'D " + yoName);
        })
        user.hasNotified = true;
      }
    })
  }
}, 3000);



