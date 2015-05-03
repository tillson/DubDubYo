var express = require("express");
var Yo = require("yo-api");
var nconf = require("nconf");
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var passport = require("passport");
var session = require("express-session");
var app = express();

var Gmail = require("node-gmail-api");
var emails = [];

nconf.argv()
  .env()
  .file({ file: "config.json"});

var yo = new Yo(nconf.get("yo"));


var token = "NO KEY FOR YOU";
emails.push(new Gmail(token));


app.use(session({secret: nconf.get("session-secret"), resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: nconf.get("gmail-client"),
    clientSecret: nconf.get("gmail-secret"),
    callbackURL: "http://127.0.0.1:8080/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    emails.push(new Gmail(accessToken));
    return done(null, null)
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: 'https://mail.google.com https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile' }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });

app.get("/", function(req, res) {
  res.send("Hi!");
});


app.listen(8080, function(){
  console.log("Listening on port " +  8080);
});

setInterval(function() {
  for (var i = 0; i < emails.length; i++) {
    var email = emails[i];
    var s = email.messages("label:inbox", {max: 1});
    s.on("data", function(d) {

      var shouldSendYo = true
      for (var j = 0; j < d.payload.headers.length; j++) {
        var header = d.payload.headers[j];
        // Check if it is from apple
        if (header.name == "From" && header.value.indexOf("@gmail.com") == -1) {
          shouldSendYo = false
          console.log(header.value);
        }
        if (header.name == "Subject" && header.value.indexOf("WWDC") == -1) {
          shouldSendYo = false
          console.log(header.value);
        }
      }
      if (shouldSendYo) {
        console.log("yes, should send a yo")
        yo.yo("TILLSON", function (err, res, body) {
          console.log("HEY, WE JUST YO'D " + "TILLSON")
        })
      } else {
        console.log("No, yo.");
      }
    })
  }
}, 3000);



