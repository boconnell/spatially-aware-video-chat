import React from 'react';
import { styled } from '@material-ui/core/styles';
import { LocalDataTrack } from 'twilio-video';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import useParticipants from '../../hooks/useParticipants/useParticipants';
import useParticipantPositions from '../../hooks/useParticipantPositions/useParticipantPositions';
import Participant from '../Participant/Participant';

// Change this into a grid. Video size should be constrained by container, container should not flex to fit video.
const Container = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
});

const Row = styled('div')({
  height: '100%',
  width: '100%',
  display: 'flex',
});

const Cell = styled('div')({
  height: '100%',
  width: '100%',
  border: '1px solid',
});

export default function Room() {
  const {
    localTracks,
    room: { localParticipant },
  } = useVideoContext();
  const participants = useParticipants();
  const { participantPositions, setParticipantPositions } = useParticipantPositions();
  const participantsInGrid = new Array(5).fill(null).map(() => new Array(5).fill(null));
  [...participants, localParticipant].forEach(participant => {
    const position = participantPositions[participant.sid];
    if (position) {
      participantsInGrid[position.x][position.y] = participant;
    }
  });
  const localPosition = participantPositions[localParticipant.sid];

  return (
    <Container>
      {participantsInGrid.map((participantRow, x) => (
        <Row key={x}>
          {participantRow.map((participant, y) => {
            const position = `${x},${y}`;
            let volume = 0.5;
            if (localPosition && (x !== localPosition.x || y !== localPosition.y)) {
              volume = 1 / (Math.pow(x - localPosition.x, 2) + Math.pow(y - localPosition.y, 2));
            }
            return (
              <Cell
                key={participant ? participant.sid : y}
                onClick={() => {
                  if (!participant) {
                    const track = localTracks.find(_track => _track.kind === 'data') as LocalDataTrack;
                    track.send(position);
                    setParticipantPositions(prevParticipantPosition => ({
                      ...prevParticipantPosition,
                      [localParticipant.sid]: {
                        x,
                        y,
                      },
                    }));
                  }
                }}
              >
                {participant && (
                  <Participant participant={participant} isSelected={false} onClick={() => {}} volume={volume} />
                )}
              </Cell>
            );
          })}
        </Row>
      ))}
    </Container>
  );
}
