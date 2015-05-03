# DubDubYo
Get a Yo as soon as your WWDC Scholarship email arrives.

## So, how do I use it?
I'm glad you asked!
First off, you have to generate some API keys for various places, and create a config.json file.  That file should look like this:

    {
	    "yo": "Yo API Key",
	    "gmail-client": "Gmail OAUTH 2 Client Key",
	    "gmail-secret": "Gmail OAUTH 2 Secret Key",
	    "session-secret": "Session secret key"
    }

How do you set up your gmail keys?  Well that's a question I wish I had known the answer to when I started this.

1. Head over to the [Google Developer Console](https://console.developers.google.com/project) and create a new project
2. Go to API & Auth on the sidebar and add Gmail as a new API
3. Go to Credentials (under API & Auth in the sidebar) and create a new Client ID for OAUTH  
4. This should be a web application, and your URL stuff should look a bit like this.

![URL stuff](http://i.imgur.com/6dRJ2Qz.png)

From here, you should be good to go.


### Other API keys
- Session secret key: You create this on your own
- Yo key: Created at [dev.justyo.co](dev.justyo.co)