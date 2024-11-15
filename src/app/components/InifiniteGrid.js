"use client"

import React, { useState, useEffect, useRef } from 'react';

const InfiniteGrid = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [stones, setStones] = useState(new Set());
  const canvasRef = useRef(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 5;

  const CELL_SIZE = 40;
  const GRID_COLOR = '#8c1c84';
  const STONE_COLOR = '#45a2f8';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const startX = Math.floor(-offset.x / (CELL_SIZE * zoom));
      const endX = startX + Math.ceil(canvas.width / (CELL_SIZE * zoom));
      const startY = Math.floor(-offset.y / (CELL_SIZE * zoom));
      const endY = startY + Math.ceil(canvas.height / (CELL_SIZE * zoom));
      
      ctx.beginPath();
      ctx.strokeStyle = GRID_COLOR;
      
      for (let x = startX; x <= endX; x++) {
        const xPos = x * CELL_SIZE * zoom + offset.x;
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, canvas.height);
      }
      
      for (let y = startY; y <= endY; y++) {
        const yPos = y * CELL_SIZE * zoom + offset.y;
        ctx.moveTo(0, yPos);
        ctx.lineTo(canvas.width, yPos);
      }
      
      ctx.stroke();
      
      ctx.fillStyle = STONE_COLOR;
      stones.forEach(stoneStr => {
        const [x, y] = stoneStr.split(',').map(Number);
        const xPos = x * CELL_SIZE * zoom + offset.x;
        const yPos = y * CELL_SIZE * zoom + offset.y;
        ctx.beginPath();
        ctx.arc(xPos, yPos, CELL_SIZE * zoom * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawGrid();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [offset, zoom, stones]);

  const handleMouseDown = (e) => {
    isDragging.current = false;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    dragStartPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (e.buttons === 1) {
      const deltaX = Math.abs(e.clientX - dragStartPosition.current.x);
      const deltaY = Math.abs(e.clientY - dragStartPosition.current.y);
      
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        isDragging.current = true;
      }

      if (isDragging.current) {
        const moveX = e.clientX - lastPosition.current.x;
        const moveY = e.clientY - lastPosition.current.y;
        setOffset(prev => ({
          x: prev.x + moveX,
          y: prev.y + moveY
        }));
        lastPosition.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDragging.current) {
      handleClick(e);
    }
    isDragging.current = false;
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.round((x - offset.x) / (CELL_SIZE * zoom));
    const gridY = Math.round((y - offset.y) / (CELL_SIZE * zoom));
    
    const stoneKey = `${gridX},${gridY}`;
    const newStones = new Set(stones);
    
    if (newStones.has(stoneKey)) {
      newStones.delete(stoneKey);
    } else {
      newStones.add(stoneKey);
    }
    
    setStones(newStones);
  };

  const handleWheel = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse position to world space before zoom
    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;

    // Calculate new zoom
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

    // Calculate new offset to keep the mouse position fixed
    const newOffset = {
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom
    };

    setZoom(newZoom);
    setOffset(newOffset);
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => isDragging.current = false}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default InfiniteGrid;