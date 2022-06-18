import { Box, Typography } from '@mui/material';
import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

function RoomPage() {
  const { roomId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pointerPosition, setPointerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  function setRelativePointerPosition(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    setPointerPosition({
      x: e.clientX - (canvas?.offsetLeft ?? 0),
      y: e.clientY - (canvas?.offsetTop ?? 0),
    });
  }

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
          setRelativePointerPosition(e);
          const ctx = ctxRef.current;
          if (!ctx) {
            return;
          }
          ctx.strokeStyle = '#000';
          ctx.beginPath();
        }}
        onPointerUp={() => {
          const ctx = ctxRef.current;
          const canvas = canvasRef.current;
          if (!ctx || !canvas || !roomId) {
            return;
          }
          localStorage.setItem(roomId, canvas.toDataURL());
          setPointerPosition(null);
        }}
        onPointerMove={(e) => {
          const ctx = ctxRef.current;
          if (!ctx || !pointerPosition) {
            return;
          }
          setRelativePointerPosition(e);
          ctx.lineTo(pointerPosition.x, pointerPosition.y);
          ctx.stroke();
        }}
      />
    </Box>
  );
}

export default RoomPage;
