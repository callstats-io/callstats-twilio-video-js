# Documentation


## API

The main module `callstatstwiliovideojs` is a function that receives a `TwilioVideoJS.Video.Room` instance and parameters for `callstats.initialize()`.

The main module also exports a `setCallstatsModule()` function.


#### `callstatstwiliovideojs(room, peerToPeer, AppID, AppSecretOrTokenGenerator, localUserID, csInitCallback, csStatsCallback, configParams)`

| Params       | Argument  | Type                        | Description                            |
|--------------|-----------|-----------------------------|----------------------------------------|
| `room`       | Required  | `TwilioVideoJS.Video.Room`  | Twilio Video `Room` instance.          |
| `peerToPeer` | Required  | `Boolean`                   | Whether the room is set to peerToPeer  |

The rest of parameters match those in [callstats.initialize()](http://www.callstats.io/api/#callstats-initialize-with-app-secret), with a small difference:

* `localUserID` is not required. If `null`, the library fills it with an object containing the identity used while creating the Twilio room.


#### `callstatstwiliovideojs.setCallstatsModule(module)`

| Params   | Argument  | Type        | Description                  |
|----------|-----------|-------------|------------------------------|
| `module` | Required  | `function`  | The `callstats` main module. |

By default this library uses `window.callstats` (assuming that the **callstats.io** library has been previously loaded via a `<script>` tag.

However, the **callstats.io** library can also be loaded using loaders such as [require.js](http://www.requirejs.org/) meaning that it may be not exposed as a global `window.callstats`. In that case, `callstatstwiliovideojs.setCallstatsModule()` can be used to provide the **callstats-twiliovideojs** library with the **callstats.io** main module.


### `SessionHandler` class

When a TwilioVideoJS.Video.Room `Session` is created, the **callstats-twiliovideojs** library creates an instance of `SessionHandler` and stores it into `room.callstatsSessionHandler` to make it available to the application.

The `SessionHandler` class provides a wrapper over the API exposed by the `callstats` object, making it simpler by not requiring some parameters such as `conferenceID`.


#### `sessionHandler.callstats`

A getter that provides the already initialized `callstats` object.


#### `sessionHandler.associateMstWithUserID(userID, SSRC, usageLabel, associatedVideoTag)`

Arguments match those in [callstats.associateMstWithUserID()](http://www.callstats.io/api/#callstats-associatemstwithuserid).


#### `sessionHandler.reportUserIDChange(newUserID, userIDType)`

Arguments match those in [callstats.reportUserIDChange()](http://www.callstats.io/api/#callstats-reportuseridchange).


#### `sessionHandler.sendUserFeedback(feedback, pcCallback)`

Arguments match those in [callstats.sendUserFeedback()](http://www.callstats.io/api/#callstats-senduserfeedback).

#### `sessionHandler.reportError(err)`

With Twilio Video, you the user need to take greater responsibility of tracking twilio video errors and sending them to callstats. All you need to do is pass on the error to the reportError function and the library will take care of everything else.

