import React, { useState, useRef, MouseEvent } from "react";
import { countries } from "./world-map-data";

interface InteractivePointMapProps {
  onPointSelect: (point: { lat: number; lng: number }) => void;
  radius: number; // The visual radius to draw on the map in km
}

const VIEWBOX_WIDTH = 360;
const VIEWBOX_HEIGHT = 182.592;
const INITIAL_VIEWBOX = [-180, -91.296, VIEWBOX_WIDTH, VIEWBOX_HEIGHT];

const InteractivePointMap: React.FC<InteractivePointMapProps> = ({ onPointSelect, radius }) => {
  const [clickedPoint, setClickedPoint] = useState<{ x: number, y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState(INITIAL_VIEWBOX);
  
  const isPanning = useRef(false);
  const didPan = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });

  // Helper function to constrain the viewBox within the world map limits
  const constrainViewBox = (newViewBox: number[]): number[] => {
    const [x, y, w, h] = newViewBox;
    
    const minX = INITIAL_VIEWBOX[0];
    const maxX = INITIAL_VIEWBOX[0] + INITIAL_VIEWBOX[2] - w;
    const minY = INITIAL_VIEWBOX[1];
    const maxY = INITIAL_VIEWBOX[1] + INITIAL_VIEWBOX[3] - h;

    const clampedX = Math.max(minX, Math.min(x, maxX));
    const clampedY = Math.max(minY, Math.min(y, maxY));
    
    return [clampedX, clampedY, w, h];
  };


  const handleZoom = (factor: number) => {
    const [x, y, w, h] = viewBox;
    const newW = w * factor;
    const newH = h * factor;

    // Zoom limits
    if (newW > VIEWBOX_WIDTH * 2 || newW < VIEWBOX_WIDTH / 5) {
        return;
    }

    // Center zoom
    const newX = x + (w - newW) / 2;
    const newY = y + (h - newH) / 2;
    setViewBox(constrainViewBox([newX, newY, newW, newH]));
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    isPanning.current = true;
    didPan.current = false;
    startPoint.current = { x: e.clientX, y: e.clientY };
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isPanning.current || !svgRef.current) return;
    e.preventDefault();
    
    const dxInitial = e.clientX - startPoint.current.x;
    const dyInitial = e.clientY - startPoint.current.y;
    if (!didPan.current && Math.sqrt(dxInitial*dxInitial + dyInitial*dyInitial) > 5) {
        didPan.current = true;
    }

    if(didPan.current) {
        const svg = svgRef.current;
        const { width, height } = svg.getBoundingClientRect();
        const scaleX = viewBox[2] / width;
        const scaleY = viewBox[3] / height;
        
        const dx = e.clientX - startPoint.current.x;
        const dy = e.clientY - startPoint.current.y;

        startPoint.current = { x: e.clientX, y: e.clientY };
        setViewBox(prev => constrainViewBox([prev[0] - dx * scaleX, prev[1] - dy * scaleY, prev[2], prev[3]]));
    }
  };

  const handleMouseUp = (e: MouseEvent<SVGSVGElement>) => {
    if (svgRef.current) svgRef.current.style.cursor = 'crosshair';

    if (isPanning.current && !didPan.current) {
        // It was a click, not a pan
        if (!svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPoint = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
        
        setClickedPoint({ x: svgPoint.x, y: svgPoint.y });

        const lat = -(svgPoint.y / (VIEWBOX_HEIGHT / 2)) * 90;
        const lng = svgPoint.x;
        onPointSelect({ lat, lng });
    }
    
    isPanning.current = false;
  };
  
  const handleMouseLeave = () => {
    if (svgRef.current) svgRef.current.style.cursor = 'crosshair';
    isPanning.current = false;
  };

  // Convert radius in km to SVG degrees. This is an approximation for visualization.
  const visualRadius = (radius / 111);
  const scaleFactor = viewBox[2] / VIEWBOX_WIDTH;

  return (
    <div className="relative bg-slate-900 p-2 sm:p-4 rounded-xl shadow-2xl border border-blue-900/50">
      <div className="overflow-hidden rounded-md">
        <svg
          ref={svgRef}
          viewBox={viewBox.join(' ')}
          className="w-full h-auto bg-slate-800"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'crosshair' }}
          aria-label="World map for region selection"
        >
          <defs>
            <radialGradient id="oceanGradient" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0B2D56" />
              <stop offset="100%" stopColor="#0A192F" />
            </radialGradient>
          </defs>
          <rect x="-180" y="-91.296" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#oceanGradient)" />
          
          {/* Countries */}
          <g>
            {countries.map((country) => (
              <path
                key={country.id}
                d={country.d}
                className="transition-all duration-300 stroke-cyan-300/20 fill-cyan-400/50 pointer-events-none"
                strokeWidth="0.1"
              />
            ))}
          </g>

          {/* Clicked Point and Radius */}
          {clickedPoint && (
            <g className="pointer-events-none">
              <circle
                cx={clickedPoint.x}
                cy={clickedPoint.y}
                r={visualRadius}
                fill="rgba(56, 189, 248, 0.2)"
                stroke="rgba(56, 189, 248, 0.8)"
                strokeWidth={0.2 * scaleFactor}
                className="transition-all duration-300"
              />
              <circle
                cx={clickedPoint.x}
                cy={clickedPoint.y}
                r={0.5 * scaleFactor}
                fill="#F87171" 
              />
            </g>
          )}
        </svg>
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(0.8)}
          className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-2xl font-light hover:bg-slate-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(1.25)}
          className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-2xl font-light hover:bg-slate-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
    </div>
  );
};

export default InteractivePointMap;