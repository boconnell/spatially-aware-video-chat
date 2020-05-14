import { useEffect, useState } from 'react';
import { Participant, Track, LocalDataTrack } from 'twilio-video';
import useParticipants from '../useParticipants/useParticipants';
import useVideoContext from '../useVideoContext/useVideoContext';

export interface Position {
  x: number;
  y: number;
}

export type ParticipantPositions = Record<Participant.SID, Position>;

// TODO: Remove existing pattern of abusing useState hook to "select" data from larger room context.
// Effects for subcsribing to events should all be centralized into a single hook.
// Mutable twilio room state should be recreated as an immutable version in the top-level component's state.
export default function useParticipantPositions() {
  const {
    room: { localParticipant },
    localTracks,
  } = useVideoContext();
  const participants = useParticipants();
  const [participantPositions, setParticipantPositions] = useState<ParticipantPositions>({});

  useEffect(() => {
    // Send current position if a new participant is added (although this sends it whenever there is any change in list of participants)
    if (localParticipant && participantPositions[localParticipant.sid]) {
      const dataTrack = localTracks.find(track => track.kind === 'data') as LocalDataTrack | null;
      const localPosition = participantPositions[localParticipant.sid];
      dataTrack?.send(`${localPosition.x},${localPosition.y}`);
    }
    participants.forEach(participant => {
      participant.on('trackSubscribed', (track: Track) => {
        if (track.kind === 'data') {
          track.on('message', data => {
            const [x, y] = data.split(',');
            setParticipantPositions(prevParticipantPositions => {
              return {
                ...prevParticipantPositions,
                [participant.sid]: {
                  x,
                  y,
                },
              };
            });
          });
        }
      });
    });
    return () => {
      participants.forEach(participant => {
        participant.removeAllListeners('trackSubscribed');
      });
    };
  }, [localParticipant, localTracks, participantPositions, participants]);

  return {
    participantPositions,
    setParticipantPositions,
  };
}
