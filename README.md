# callstats-twilio-video-js

[Twilio Video JS](https://github.com/twilio/twilio-video.js) interface to [callstats.io](http://callstats.io/).

## Install

* Adding a `<script>` tag in the HTML.

In case no module loaded is used, a global `window.callstatstwiliovideojs` is exposed.

_NOTE:_ This library does not include the **callstats.io** library (it must be added separetely).

## Documentation

* Read the full [documentation](docs/index.md) in the docs folder.

## Usage example

In the HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Load callstats.io library (it provides window.callstats -->
    <script src="https://api.callstats.io/static/callstats.min.js"></script>
    <!-- Load Twilio Video JS library -->
    <script src="//media.twiliocdn.com/sdk/js/video/v1/twilio-video.min.js"></script>
    <!-- Load callstats-twiliovideojs library (it provides window.callstatstwiliovideojs) -->
    <script src="js/callstats-twiliovideojs.js"></script>
    <!-- Load our app code -->
    <script src="js/app.js"></script>
  </head>

  <body>
    <!-- your stuff -->
  </body>
</html>
```

In `app.js`:

```javascript

const Video = Twilio.Video;

Video.connect('$TOKEN', { name: 'room-name' }).then(room => {

  callstatstwiliovideojs(room, peerToPeerTruthy, AppID, AppSecret);

  console.log('Connected to Room "%s"', room.name);

  ...

});

// Run the callstats-twiliovideojs library for this Twilio.Video.Room
```

## Development (TODO)

When using Bower or a `<script>` tag, the provided library is built with [browserify](http://browserify.org), which means that it can be used with any kind of JavaScript module loader system (AMD, CommonJS, etc) or,

* Using NPM: `$ npm install callstats-twiliovideojs`
* Using Bower: `$ bower install callstats-twiliovideojs`


Install NPM development dependencies:

```bash
$ npm install
```

Install `gulp-cli` globally (which provides the `gulp` command):

```bash
$ npm install -g gulpjs
```

* `gulp prod` generates a production/minified `dist/callstats-twiliovideojs.min.js` bundle.
* `gulp dev` generates a development non-minified and sourcemaps enabled `dist/callstats-twiliovideojs.js` bundle.


## Authors

Dan Jenkins at Nimble Ape Ltd (https://nimblea.pe).
