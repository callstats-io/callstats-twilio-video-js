'use strict';

const Logger = require('./Logger');
const SessionHandler = require('./SessionHandler');

const logger = new Logger();

// The callstats.io main module.
let callstatsModule;
let callstats;
let isPeerToPeer;
/**
 * Handles a TwilioVideoJS.Room instance and initializes a callstats object.
 * @param  {TwilioVideoJS.Room} room - The TwilioVideoJS.Room instance.
 * @param  {boolean} peerToPeer - Whether this is a peer to peer room.
 * @param  {string} AppID - Same as in callstats.initialize().
 * @param  {string} AppSecretOrTokenGenerator - Same as in callstats.initialize().
 * @param  {string|object} [localUserID] - Same as in callstats.initialize().
 *                                         If unset, UA's identity is used.
 * @param  {function} [csInitCallback] - Same as in callstats.initialize().
 * @param  {function} [csStatsCallback] - Same as in callstats.initialize().
 * @param  {object} [configParams] - Same as in callstats.initialize().
 */
function handle(room, peerToPeer, AppID, AppSecretOrTokenGenerator, localUserID, csInitCallback, csStatsCallback, configParams) {
  logger.debug('handle() [AppID:"%s"]', AppID);

  // If unset, set callstatsModule with window.callstats
  callstatsModule = callstatsModule || window.callstats;

  if (typeof callstatsModule !== 'object') {
    throw new TypeError('callstatsModule not found');
  }

  if (!room && !localUserID) {
    throw new TypeError('localUserID must be provided when room is null');
  }

  if (room && typeof room !== 'object') {
    throw new TypeError('room argument must be a TwilioVideoJS.Video.Room instance');
  }

  isPeerToPeer = peerToPeer;
  if (!localUserID) {
    localUserID = {
      userName  : room.localParticipant.identity,
      aliasName : room.localParticipant.SID || room.localParticipant.identity
    };
  }

  if (!csInitCallback) {
    csInitCallback = (csError, csErrMsg) => {
      if (csError === 'success') {
        logger.debug('csInitCallback success: %s', csErrMsg);
      } else {
        logger.warn('csInitCallback %s: %s', csError, csErrMsg);
      }
    };
  }

  // Create and initialize the callstats object.

  callstats = callstatsModule;

  callstats.initialize(AppID, AppSecretOrTokenGenerator, localUserID, csInitCallback, csStatsCallback, configParams);
  if (room) {
    handle.setTwilioVideoRoom(room);
  }
  return callstats;
};

/**
 * Set the TwilioVideoJS.Video.Room.
 * @param  {TwilioVideoJS.Video.Room} room - The twilio video room
 */
handle.setTwilioVideoRoom = function(room) {
  logger.debug('setTwilioRoom()');
  if (!callstats) {
    throw new TypeError('callstats not intialized');
  }
  let sessionHandler = new SessionHandler(room, isPeerToPeer, room.name, callstats);
  room.callstatsSessionHandler = sessionHandler;
};

/**
 * Set the callstats main module.
 * @param  {function} module - The callstats.io main module.
 */
handle.setCallstatsModule = function(mod) {
  logger.debug('setCallstatsModule()');

  callstatsModule = mod;
};

module.exports = handle;
