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
  const lastTouchDistance = useRef(null);
  const DRAG_THRESHOLD = 5;

  const CELL_SIZE = 40;
  const GRID_COLOR = '#8c1c84';
  const STONE_COLOR = '#45a2f8';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawGrid = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDragging.current = false;
      const touch = e.touches[0];
      lastPosition.current = { x: touch.clientX, y: touch.clientY };
      dragStartPosition.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - dragStartPosition.current.x);
      const deltaY = Math.abs(touch.clientY - dragStartPosition.current.y);
      
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        isDragging.current = true;
      }

      if (isDragging.current) {
        const moveX = touch.clientX - lastPosition.current.x;
        const moveY = touch.clientY - lastPosition.current.y;
        setOffset(prev => ({
          x: prev.x + moveX,
          y: prev.y + moveY
        }));
        lastPosition.current = { x: touch.clientX, y: touch.clientY };
      }
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance.current !== null) {
        const delta = currentDistance - lastTouchDistance.current;
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
        
        // Calculate center of pinch
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        // Convert center position to world space before zoom
        const worldX = (centerX - offset.x) / zoom;
        const worldY = (centerY - offset.y) / zoom;
        
        // Calculate new offset to keep the center position fixed
        const newOffset = {
          x: centerX - worldX * newZoom,
          y: centerY - worldY * newZoom
        };

        setZoom(newZoom);
        setOffset(newOffset);
      }
      
      lastTouchDistance.current = currentDistance;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      if (!isDragging.current) {
        const touch = e.changedTouches[0];
        handleClick(touch);
      }
      isDragging.current = false;
      lastTouchDistance.current = null;
    }
  };

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
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

    const newOffset = {
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom
    };

    setZoom(newZoom);
    setOffset(newOffset);
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => isDragging.current = false}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default InfiniteGrid;