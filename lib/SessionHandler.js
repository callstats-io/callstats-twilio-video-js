'use strict';

const Logger = require('./Logger');

const logger = new Logger('SessionHandler');

class SessionHandler
{
  constructor(room, peerToPeer, roomName, callstats) {
    logger.debug('constructor()');

    let errorCodes = [
      ['AccessTokenInvalidError', 20101],
      ['ConfigurationAcquireFailedError', 53500],
      ['ConfigurationAcquireTurnFailedError', 53501],
      ['MediaClientLocalDescFailedError', 53400],
      ['MediaClientRemoteDescFailedError', 53402],
      ['MediaNoSupportedCodecError', 53404],
      ['MediaServerLocalDescFailedError', 53401],
      ['MediaServerRemoteDescFailedError', 53403],
      ['ParticipantIdentityCharsInvalidError', 53202],
      ['ParticipantIdentityInvalidError', 53200],
      ['ParticipantIdentityTooLongError', 53201],
      ['ParticipantMaxTracksExceededError', 53203],
      ['ParticipantNotFoundError', 53204],
      ['RoomConnectFailedError', 53104],
      ['RoomCreateFailedError', 53103],
      ['RoomMaxParticipantsExceededError', 53105],
      ['RoomNameCharsInvalidError', 53102],
      ['RoomNameInvalidError', 53100],
      ['RoomNameTooLongError', 53101],
      ['RoomNotFoundError', 53106],
      ['SignalingConnectionDisconnectedError', 53001],
      ['SignalingConnectionError', 53000],
      ['SignalingConnectionTimeoutError', 53002],
      ['SignalingIncomingMessageInvalidError', 53003],
      ['SignalingOutgoingMessageInvalidError', 53004],
      ['TrackInvalidError', 53300],
      ['TrackNameCharsInvalidError', 53303],
      ['TrackNameInvalidError', 53301],
      ['TrackNameTooLongError', 5330]
    ];

    this._causes = new Map(errorCodes);

    // Private properties.
    this._room = room;
    this._roomName = roomName;
    this._callstats = callstats;
    this._peerConnection;

    this._knownPeerConnections = [];

    // Twilio Video uses SIP.js as a transport mechanism
    // there can be multiple peerConnections when its a peer to peer room
    window.peerConnectionManager = this._room._signaling._peerConnectionManager;

    if (peerToPeer) {

      function connectToCS (participant) {
        this._room._signaling._peerConnectionManager._peerConnections.forEach(peerConnection => {

          //presume that on load, _room.participants order is the same order as the peerConnections. Could be wrong!

          if (!this._knownPeerConnections.includes(peerConnection.id)) {

            this._knownPeerConnections.push(peerConnection.id);

            //set the peerConnection private to the last peer connection we know about, at least for now
            this._peerConnection = peerConnection;

            this._callstats.addNewFabric(
              // pcObject
              peerConnection._peerConnection._peerConnection,
              // remoteUserID is really unknown for the time being
              participant.identity,//bit of a guess which might not always be right
              // fabricUsage (TODO)
              this._callstats.fabricUsage.multiplex,
              // roomName
              this._roomName,
              // pcCallback
              (err, msg) => {
                if (err === 'success')
                  logger.debug('pcCallback success: %s', msg);
                else
                  logger.warn('pcCallback %s: %s', err, msg);
              }
            );
          }
        });
      }


      if (this._room.participants.size > 0) {
        this._room.participants.forEach( (participant) => {
          connectToCS.call(this, participant);
        });
      }

      this._room.on('participantConnected', (participant) => {
        connectToCS.call(this, participant);
      });

    } else {
      this._peerConnection = this._room._signaling._peerConnectionManager._peerConnections.values().next().value._peerConnection;
      // Create a new callstats fabric.
      this._callstats.addNewFabric(
        // pcObject
        this._peerConnection._peerConnection,
        // remoteUserID is really the conf room name because its not a peer to peer call
        this._roomName,
        // fabricUsage (TODO)
        this._callstats.fabricUsage.multiplex,
        // roomName
        this._roomName,
        // pcCallback
        (err, msg) => {
          if (err === 'success')
            logger.debug('pcCallback success: %s', msg);
          else
            logger.warn('pcCallback %s: %s', err, msg);
        }
      );

      this._room.localParticipant.on('trackAdded', (track) => {
        //go and figure out what peerConnection its tied to
        let ssrc = this._peerConnection._tracksToSSRCs.get(track.id);
        if (ssrc) {
          this._callstats.associateMstWithUserID(
            pc._peerConnection,
            this._room.localParticipant.identity,
            this._roomName,
            ssrc,
            track.kind,
            track._dummyEl
          )
        }
      });
    }

    this._room.localParticipant.on('trackDisabled', (track) => {
      if (track.kind === 'audio') {
        this._sendFabricEvent(this._callstats.fabricEvent.audioMute);
      }
      if (track.kind == 'video') {
        this._sendFabricEvent(this._callstats.fabricEvent.videoPause);
      }
    });

    this._room.localParticipant.on('trackEnabled', (track) => {
      if (track.kind === 'audio') {
        this._sendFabricEvent(this._callstats.fabricEvent.audioUnmute);
      }
      if (track.kind == 'video') {
        this._sendFabricEvent(this._callstats.fabricEvent.videoResume);
      }
    });

    this._room.on('disconnected', (room, cause) => {
      this._sendFabricEvent(this._callstats.fabricEvent.fabricTerminated);
      this._mayReportSignalingError('terminated', cause);
    });
  }

  get callstats() {
    return this._callstats;
  }

  reportObtainingLocalMediaError(error) {
    let wrtcFuncName = this._callstats.webRTCFunctions.getUserMedia;
    logger.debug('reportError() [wrtcFuncName:%s, msg:"%s"]', wrtcFuncName, error);
    this._reportError(wrtcFuncName, error);
  }

  reportError(error) {
    // error is a twilio error
    // figure out what the actual error is
    this._mayReportSignalingError(error);
  }

  sendUserFeedback(feedback, pcCallback) {
    logger.debug('sendUserFeedback()');

    this._callstats.sendUserFeedback(
      // conferenceID
      this._roomName,
      // feedback
      feedback,
      // pcCallback
      pcCallback
    );
  }

  _sendFabricEvent(fabricEvent) {
    logger.debug('_sendFabricEvent() [fabricEvent:%s]', fabricEvent);

    this._room._signaling._peerConnectionManager._peerConnections.forEach(peerConnection => {
      this._callstats.sendFabricEvent(
        // pcObject
        peerConnection._peerConnection,
        // fabricEvent
        fabricEvent,
        // conferenceID
        this._roomName
      );
    });
  }

  _reportError(wrtcFuncName, error) {
    if (wrtcFuncName === this._callstats.webRTCFunctions.applicationLog) {
      logger.debug('reportError() [wrtcFuncName:%s, msg:"%s"]', wrtcFuncName, error);
    } else {
      logger.warn('reportError() [wrtcFuncName:%s, error:%o]', wrtcFuncName, error);
    }

    this._callstats.reportError(
      // pcObject
      this._peerconnection,
      // conferenceID
      this._roomName,
      // wrtcFuncName
      wrtcFuncName,
      // domError
      error,
      // localSDP
      this._peerconnection.localDescription ? this._peerconnection.localDescription.sdp : null,
      // remoteSDP
      this._peerconnection.remoteDescription ? this._peerconnection.remoteDescription.sdp : null
    );
  }

  _mayReportSignalingError(cause) {

    if (cause === null || !cause.code) {
      return;
    }

    switch (cause.code) {
      case this._causes.SignalingConnectionDisconnectedError:
      case this._causes.SignalingConnectionError:
      case this._causes.SignalingConnectionTimeoutError:
      case this._causes.SignalingIncomingMessageInvalidError:
      case this._causes.SignalingOutgoingMessageInvalidError:
      {
        this._reportError(this._callstats.webRTCFunctions.signalingError, cause);
        break;
      }
      default:
      {
        if (this._causes.values().contains(cause.code)) {
          this._reportError(this._callstats.webRTCFunctions.applicationLog, cause);
        }
      }
    }
  }
}

module.exports = SessionHandler;
