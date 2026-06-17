import React, { useRef, useEffect, useState } from 'react';
import { Pencil, Highlighter, Eraser, MousePointer2, RotateCcw, X, Square, ZoomIn } from 'lucide-react';

type Tool = 'pointer' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'magnifier';

interface DrawingOverlayProps {
  currentSlide: number;
}

const DrawingOverlay: React.FC<DrawingOverlayProps> = ({ currentSlide }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlighterCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const highlighterContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const previewContextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<Tool>('pointer');
  const [lastTool, setLastTool] = useState<Tool>('pen');
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(true);
  const [isHoveringControls, setIsHoveringControls] = useState(false);

  // Magnifier state variables
  const [magnifierSize, setMagnifierSize] = useState(180);
  const [zoomFactor, setZoomFactor] = useState(2.0);
  const [slideHtml, setSlideHtml] = useState('');

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const hCanvas = highlighterCanvasRef.current;
    const pCanvas = previewCanvasRef.current;
    if (!canvas || !hCanvas || !pCanvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    
    [canvas, hCanvas, pCanvas].forEach(c => {
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (c === canvas) contextRef.current = ctx;
        else if (c === hCanvas) highlighterContextRef.current = ctx;
        else previewContextRef.current = ctx;
      }
    });
  };

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(initCanvas, 100);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    clearCanvas();
  }, [currentSlide]);

  // Sync and cache the slide's underlying DOM HTML for smooth magnifying
  // We use a MutationObserver to ensure the magnifier perfectly mirrors the main slide
  // during animations and interactive state changes without freezing mid-transition.
  useEffect(() => {
    if (tool === 'magnifier') {
      const el = document.getElementById('lecture-slide-capture-area');
      if (!el) return;

      const updateHtml = () => {
        setSlideHtml(el.innerHTML);
      };

      updateHtml();

      let timeoutId: any = null;
      const observer = new MutationObserver(() => {
        if (!timeoutId) {
          // Throttle DOM updates to ~15fps (60ms) to ensure smooth magnifier animation
          // without causing excessive React re-renders.
          timeoutId = setTimeout(() => {
            updateHtml();
            timeoutId = null;
          }, 60);
        }
      });

      observer.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [currentSlide, tool]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1000, y: -1000 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e && 'touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'pointer' || tool === 'magnifier') return;
    
    if (!contextRef.current || !highlighterContextRef.current) initCanvas();
    
    const { x, y } = getCoordinates(e);
    setStartPos({ x, y });
    
    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      contextRef.current?.beginPath();
      contextRef.current?.moveTo(x, y);
      highlighterContextRef.current?.beginPath();
      highlighterContextRef.current?.moveTo(x, y);
    }
    
    setIsDrawing(true);
    if (e.cancelable) e.preventDefault();
  };

  const drawShape = (ctx: CanvasRenderingContext2D, type: 'rectangle', start: {x:number, y:number}, current: {x:number, y:number}) => {
    ctx.beginPath();
    ctx.rect(start.x, start.y, current.x - start.x, current.y - start.y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    setLaserPos({ x, y });

    if (tool === 'pointer' || tool === 'magnifier' || !isDrawing) return;
    
    const ctx = contextRef.current;
    const hCtx = highlighterContextRef.current;
    const pCtx = previewContextRef.current;
    if (!ctx || !hCtx || !pCtx) return;

    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#F04452';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 1;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'highlighter') {
      hCtx.globalCompositeOperation = 'source-over';
      hCtx.strokeStyle = '#FFFF00';
      hCtx.lineWidth = 30;
      hCtx.globalAlpha = 0.6;
      hCtx.lineTo(x, y);
      hCtx.stroke();
    } else if (tool === 'eraser') {
      [ctx, hCtx].forEach(c => {
        c.globalCompositeOperation = 'destination-out';
        c.lineWidth = 40;
        c.lineTo(x, y);
        c.stroke();
      });
    } else if (tool === 'rectangle') {
      const canvas = previewCanvasRef.current;
      if (canvas) {
        pCtx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
      }
      pCtx.strokeStyle = '#F04452';
      pCtx.lineWidth = 3;
      drawShape(pCtx, tool, startPos, { x, y });
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const { x, y } = getCoordinates(e);
    const ctx = contextRef.current;
    const pCtx = previewContextRef.current;
    const canvas = previewCanvasRef.current;

    if (ctx && pCtx && canvas) {
      if (tool === 'rectangle') {
        pCtx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#F04452';
        ctx.lineWidth = 3;
        drawShape(ctx, tool, startPos, { x, y });
      }
      ctx.closePath();
      highlighterContextRef.current?.closePath();
    }
    
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    [canvasRef.current, highlighterCanvasRef.current, previewCanvasRef.current].forEach(c => {
      if (c) {
        const ctx = c.getContext('2d');
        ctx?.clearRect(0, 0, c.width / dpr, c.height / dpr);
      }
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getCoordinates(e);
      setLaserPos({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      if (!isVisible || !containerRef.current?.contains(e.target as Node)) {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const isInArea = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;
          if (!isInArea) return;
        } else return;
      }
      
      e.preventDefault();
      setTool(prevTool => {
        if (prevTool === 'pointer') return lastTool;
        else {
          setLastTool(prevTool);
          return 'pointer';
        }
      });
    };
    
    window.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => window.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, [isVisible, lastTool]);

  const selectTool = (t: Tool) => {
    if (t !== 'pointer') setLastTool(t);
    setTool(t);
  };

  const isMouseInside = canvasRef.current && 
    laserPos.x >= 0 && 
    laserPos.x <= canvasRef.current.clientWidth && 
    laserPos.y >= 0 && 
    laserPos.y <= canvasRef.current.clientHeight;

  const containerWidth = canvasRef.current ? canvasRef.current.clientWidth : 1024;
  const containerHeight = canvasRef.current ? canvasRef.current.clientHeight : 768;

  if (!isVisible) {
    return (
      <div ref={containerRef}>
        <button 
          onClick={() => setIsVisible(true)}
          className="absolute bottom-10 left-10 z-[100] bg-black/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/20 text-white/50 hover:text-white pointer-events-auto shadow-2xl"
        >
          <Pencil className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas
        ref={highlighterCanvasRef}
        className="absolute inset-0 z-[88] w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'multiply', width: '100%', height: '100%' }}
      />
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 z-[89] w-full h-full pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className={`absolute inset-0 z-[90] w-full h-full ${tool === 'pointer' || tool === 'magnifier' ? 'pointer-events-none' : 'pointer-events-auto cursor-none'}`}
        style={{ touchAction: 'none', width: '100%', height: '100%' }}
      />
      
      {tool === 'pointer' && (
        <div 
          className="pointer-events-none absolute z-[95] w-6 h-6 bg-red-500 rounded-full shadow-[0_0_25px_rgba(239,68,68,1)] flex items-center justify-center"
          style={{ left: laserPos.x - 12, top: laserPos.y - 12, transition: 'none' }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}

      {tool !== 'pointer' && tool !== 'magnifier' && (
        <div 
          className="pointer-events-none absolute z-[95] w-2 h-2 bg-white border border-black/20 rounded-full"
          style={{ left: laserPos.x - 1, top: laserPos.y - 1, transition: 'none' }}
        />
      )}

      {/* Premium Magnifying Glass (돋보기) Portal Element */}
      {tool === 'magnifier' && isMouseInside && !isHoveringControls && !(laserPos.x < 380 && laserPos.y > containerHeight - 145) && slideHtml && (
        <div 
          className="absolute z-[80] border-[3px] border-[#D4AF37] shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-none bg-white rounded-full"
          style={{ 
            width: magnifierSize, 
            height: magnifierSize, 
            left: laserPos.x - magnifierSize / 2, 
            top: laserPos.y - magnifierSize / 2, 
            transition: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: containerWidth,
              height: containerHeight,
              left: -laserPos.x * zoomFactor + magnifierSize / 2,
              top: -laserPos.y * zoomFactor + magnifierSize / 2,
              transform: `scale(${zoomFactor})`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
            }}
            dangerouslySetInnerHTML={{ __html: slideHtml }}
          />
          {/* Magnifying Glass Lens Flare & Reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none rounded-full" />
          <div className="absolute inset-0 shadow-[inset_0_4px_16px_rgba(255,255,255,0.25),inset_0_-4px_16px_rgba(0,0,0,0.2)] rounded-full" />
        </div>
      )}

      <div 
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => setIsHoveringControls(false)}
        className="absolute bottom-8 left-8 z-[100] flex flex-col gap-2 origin-bottom-left scale-90 pointer-events-auto"
      >
        {/* Real-time Magnifier Adjustment Sub-Panel */}
        {tool === 'magnifier' && (
          <div className="flex items-center gap-4 px-4 py-2.5 bg-black/75 backdrop-blur-xl rounded-2xl border border-white/10 text-white text-[11px] font-bold pointer-events-auto shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-white/60">돋보기 크기:</span>
              <input 
                type="range" 
                min="120" 
                max="600" 
                step="10"
                value={magnifierSize} 
                onChange={(e) => setMagnifierSize(Number(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
              <span className="w-8 font-mono text-[#D4AF37] text-right">{magnifierSize}px</span>
            </div>
            <div className="w-px h-3 bg-white/15" />
            <div className="flex items-center gap-2">
              <span className="text-white/60">돋보기 배율:</span>
              <input 
                type="range" 
                min="1.5" 
                max="3.0" 
                step="0.1" 
                value={zoomFactor} 
                onChange={(e) => setZoomFactor(Number(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
              <span className="w-8 font-mono text-[#D4AF37] text-right">{zoomFactor.toFixed(1)}배</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-1 pr-2 mr-1 border-r border-white/10">
             <button
              onClick={() => setIsVisible(false)}
              className="p-2.5 rounded-xl text-white/30 hover:text-white/60 transition-all"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => selectTool('pointer')}
            className={`p-3 rounded-xl transition-all ${tool === 'pointer' ? 'bg-[#3182F6] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="레이저 포인터"
          >
            <MousePointer2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => selectTool('pen')}
            className={`p-3 rounded-xl transition-all ${tool === 'pen' ? 'bg-[#F04452] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="사인펜"
          >
            <Pencil className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => selectTool('highlighter')}
            className={`p-3 rounded-xl transition-all ${tool === 'highlighter' ? 'bg-[#FFFF00] text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="형광펜"
          >
            <Highlighter className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={() => selectTool('rectangle')}
            className={`p-3 rounded-xl transition-all ${tool === 'rectangle' ? 'bg-[#F04452] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="사각형"
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={() => selectTool('magnifier')}
            className={`p-3 rounded-xl transition-all ${tool === 'magnifier' ? 'bg-[#D4AF37] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="돋보기"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1" />
          
          <button
            onClick={() => selectTool('eraser')}
            className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="지우개"
          >
            <Eraser className="w-5 h-5" />
          </button>
          
          <button
            onClick={clearCanvas}
            className="p-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
            title="전체 지우기"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingOverlay;
