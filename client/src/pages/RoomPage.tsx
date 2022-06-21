import { Box, Typography } from '@mui/material';
import { useSelector } from '@xstate/react';
import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StateFrom } from 'xstate';
import { AuthService, useAuthService } from '../auth/AuthServiceProvider';
import { RoomMachine } from '../rooms/roomMachine';
import { bytesToShort, shortToBytes } from '../utils/binary';
import { pointsToSvgPath } from '../utils/svg';

function roomSelector(state: AuthService['state']) {
  if (!state.context.roomRef) {
    throw new Error('Unexpected null room actor ref');
  }
  return state.context.roomRef;
}

function wsSelector(state: StateFrom<RoomMachine>) {
  return state.context.ws;
}

const drawPathMessageType = 1;

interface Point {
  x: number;
  y: number;
}
interface Dimensions {
  width: number;
  height: number;
}

type PointerPosition = Point | null;

function RoomPage() {
  const { roomId } = useParams();
  const authService = useAuthService();
  const roomRef = useSelector(authService, roomSelector);
  const ws = useSelector(roomRef, wsSelector);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pointerPosition, setPointerPosition] = useState<PointerPosition>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const outputImageDataDimensions = useRef<Dimensions>({ width: 0, height: 0 });
  const outputBufferRef = useRef<Point[]>([]);

  function getRelativePointerPosition(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    return {
      x: e.clientX - (canvas?.offsetLeft ?? 0),
      y: e.clientY - (canvas?.offsetTop ?? 0),
    };
  }

  useEffect(() => {
    if (!ws) {
      console.log('no websocket');

      return;
    }
    console.log('has websocket');
    function handleMessage(e: MessageEvent) {
      const [messageType, ...bytes] = new Uint8Array(e.data);
      if (messageType !== drawPathMessageType) {
        console.log('no draw message', messageType);

        return;
      }

      const points: number[] = [];

      const chunkSize = 4;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const [xMsb, xLsb, yMsb, yLsb] = bytes.slice(i, i + chunkSize);
        // do whatever
        points.push(bytesToShort([xMsb, xLsb]), bytesToShort([yMsb, yLsb]));
      }

      console.log('got points', points);

      const pathToDraw = new Path2D(pointsToSvgPath(points));
      const ctx = ctxRef.current;
      if (!ctx) {
        return;
      }
      ctx.stroke(pathToDraw);
    }
    function handleError(e: any) {
      console.log(e);
    }
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('error', handleError);
    console.log('added handle message');

    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('error', handleError);
    };
  }, [ws]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight * 0.8;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    ctxRef.current = ctx;

    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!roomId) {
      return;
    }

    const persistedImageURL = localStorage.getItem(roomId);

    if (!persistedImageURL) {
      return;
    }
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };

    img.src = persistedImageURL;
  }, [roomId]);

  return (
    <Box width="100vw" height="100vh">
      <Typography variant="h1">{roomId}</Typography>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          const relativePointerPosition = getRelativePointerPosition(e);
          setPointerPosition(relativePointerPosition);
          const ctx = ctxRef.current;
          if (!ctx) {
            return;
          }
          outputBufferRef.current.push(relativePointerPosition);

          ctx.strokeStyle = '#000';
          ctx.beginPath();
        }}
        onPointerUp={() => {
          const ctx = ctxRef.current;
          const canvas = canvasRef.current;
          if (!ctx || !canvas || !roomId) {
            return;
          }
          if (ws && outputBufferRef.current.length !== 0) {
            console.log('sending points', outputBufferRef.current);
            const bytes = [
              drawPathMessageType,
              ...outputBufferRef.current.flatMap((point) => [
                ...shortToBytes(point.x),
                ...shortToBytes(point.y),
              ]),
            ];

            const message = new Uint8Array(bytes);

            ws.send(message);

            outputBufferRef.current = [];
          }
          localStorage.setItem(roomId, canvas.toDataURL());
          setPointerPosition(null);
        }}
        onPointerMove={(e) => {
          const ctx = ctxRef.current;
          if (!ctx || !pointerPosition || !ws) {
            return;
          }
          setPointerPosition(getRelativePointerPosition(e));
          ctx.lineTo(pointerPosition.x, pointerPosition.y);
          ctx.stroke();

          outputBufferRef.current.push(pointerPosition);
        }}
      />
    </Box>
  );
}

export default RoomPage;
