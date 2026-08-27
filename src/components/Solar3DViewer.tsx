import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Compass, 
  Layers, 
  Box, 
  Maximize2, 
  RotateCw, 
  Eye, 
  MapPin, 
  Zap, 
  Sparkles,
  Sliders,
  Download,
  Info,
  Building,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Solar3DViewerProps {
  lat?: number;
  lng?: number;
  address?: string;
  roofType?: string;
  roofAreaSqFt?: number;
  panelCount?: number;
  tiltAngle?: number;
  azimuth?: number; // 180 = South
  onDesignChange?: (design: { panelCount: number; tiltAngle: number; annualKwh: number }) => void;
}

export default function Solar3DViewer({
  lat = 17.3850,
  lng = 78.4867,
  address = 'Hyderabad, Telangana, India',
  roofType = 'Flat Concrete',
  roofAreaSqFt = 1200,
  panelCount: initialPanelCount = 12,
  tiltAngle: initialTilt = 15,
  azimuth = 180,
  onDesignChange
}: Solar3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Controls
  const [panelCount, setPanelCount] = useState<number>(initialPanelCount);
  const [tiltAngle, setTiltAngle] = useState<number>(initialTilt);
  const [rotationAngle, setRotationAngle] = useState<number>(45); // Camera Orbit Y-axis
  const [cameraPitch, setCameraPitch] = useState<number>(35); // Camera Pitch X-axis
  const [timeOfDay, setTimeOfDay] = useState<number>(12); // 6 AM to 18 PM (12 = Noon)
  const [renderMode, setRenderMode] = useState<'3d_realistic' | 'wireframe' | 'shading_heatmap' | 'satellite'>('3d_realistic');
  const [showSunPath, setShowSunPath] = useState<boolean>(true);
  const [showObstructions, setShowObstructions] = useState<boolean>(true);

  // Latitude-based Solar Calculations
  const calcSolarMetrics = () => {
    const latRad = (lat * Math.PI) / 180;
    // Declination angle approximate for equinox/summer peak
    const sunElevation = Math.max(0, Math.sin((timeOfDay - 6) * (Math.PI / 12)) * Math.cos(latRad * 0.5));
    const dailyIrradiance = (4.5 + Math.cos(latRad) * 1.5).toFixed(1); // kWh/m²/day
    const systemKw = (panelCount * 0.54).toFixed(2); // 540W modules
    const annualKwh = Math.round(Number(systemKw) * Number(dailyIrradiance) * 365 * 0.85);

    return { sunElevation, dailyIrradiance, systemKw, annualKwh };
  };

  const metrics = calcSolarMetrics();

  useEffect(() => {
    if (onDesignChange) {
      onDesignChange({
        panelCount,
        tiltAngle,
        annualKwh: metrics.annualKwh
      });
    }
  }, [panelCount, tiltAngle]);

  // Render 3D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas background
    ctx.clearRect(0, 0, width, height);

    // Background Gradient (Sky & Environment)
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isNight) {
      skyGradient.addColorStop(0, '#0f172a');
      skyGradient.addColorStop(1, '#1e293b');
    } else if (timeOfDay < 9 || timeOfDay > 16) {
      skyGradient.addColorStop(0, '#f97316');
      skyGradient.addColorStop(0.5, '#fdba74');
      skyGradient.addColorStop(1, '#cbd5e1');
    } else {
      skyGradient.addColorStop(0, '#0284c7');
      skyGradient.addColorStop(0.6, '#38bdf8');
      skyGradient.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Grid Floor / Lawn
    const centerX = width / 2;
    const centerY = height / 2 + 60;
    const rotRad = (rotationAngle * Math.PI) / 180;
    const pitchRad = (cameraPitch * Math.PI) / 180;

    // 3D Isometric Projection Helper
    const project3D = (x: number, y: number, z: number) => {
      const cosR = Math.cos(rotRad);
      const sinR = Math.sin(rotRad);
      const cosP = Math.cos(pitchRad);
      const sinP = Math.sin(pitchRad);

      const rx = x * cosR - z * sinR;
      const rz = x * sinR + z * cosR;

      const ry = y * cosP - rz * sinP;
      const rzFinal = y * sinP + rz * cosP;

      const scale = 380 / (380 + rzFinal);
      const px = centerX + rx * scale;
      const py = centerY - ry * scale;

      return { x: px, y: py, scale };
    };

    // Draw Ground Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = -200; i <= 200; i += 40) {
      const p1 = project3D(i, 0, -200);
      const p2 = project3D(i, 0, 200);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project3D(-200, 0, i);
      const p4 = project3D(200, 0, i);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }

    // 3D Building Dimensions
    const bWidth = 140;
    const bDepth = 110;
    const bHeight = 80;

    // 3D Building Base Vertices
    const p000 = project3D(-bWidth/2, 0, -bDepth/2);
    const p100 = project3D(bWidth/2, 0, -bDepth/2);
    const p101 = project3D(bWidth/2, 0, bDepth/2);
    const p001 = project3D(-bWidth/2, 0, bDepth/2);

    const p010 = project3D(-bWidth/2, bHeight, -bDepth/2);
    const p110 = project3D(bWidth/2, bHeight, -bDepth/2);
    const p111 = project3D(bWidth/2, bHeight, bDepth/2);
    const p011 = project3D(-bWidth/2, bHeight, bDepth/2);

    // Draw Shadow of Building on Ground based on Time of Day
    const shadowOffsetX = Math.cos((timeOfDay - 6) * Math.PI / 12) * 90;
    const shadowOffsetZ = Math.sin((timeOfDay - 6) * Math.PI / 12) * 50;
    const sp0 = project3D(-bWidth/2 + shadowOffsetX, 0, -bDepth/2 + shadowOffsetZ);
    const sp1 = project3D(bWidth/2 + shadowOffsetX, 0, -bDepth/2 + shadowOffsetZ);
    const sp2 = project3D(bWidth/2 + shadowOffsetX, 0, bDepth/2 + shadowOffsetZ);
    const sp3 = project3D(-bWidth/2 + shadowOffsetX, 0, bDepth/2 + shadowOffsetZ);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.beginPath();
    ctx.moveTo(p000.x, p000.y);
    ctx.lineTo(p100.x, p100.y);
    ctx.lineTo(sp1.x, sp1.y);
    ctx.lineTo(sp2.x, sp2.y);
    ctx.lineTo(sp3.x, sp3.y);
    ctx.lineTo(p001.x, p001.y);
    ctx.closePath();
    ctx.fill();

    // Draw Building Walls
    if (renderMode === 'wireframe') {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      const edges = [
        [p000, p100], [p100, p101], [p101, p001], [p001, p000],
        [p010, p110], [p110, p111], [p111, p011], [p011, p010],
        [p000, p010], [p100, p110], [p101, p111], [p001, p011]
      ];
      edges.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      });
    } else {
      // Wall Front
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(p000.x, p000.y);
      ctx.lineTo(p100.x, p100.y);
      ctx.lineTo(p110.x, p110.y);
      ctx.lineTo(p010.x, p010.y);
      ctx.closePath();
      ctx.fill();

      // Wall Right
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(p100.x, p100.y);
      ctx.lineTo(p101.x, p101.y);
      ctx.lineTo(p111.x, p111.y);
      ctx.lineTo(p110.x, p110.y);
      ctx.closePath();
      ctx.fill();

      // Rooftop Surface
      ctx.fillStyle = renderMode === 'shading_heatmap' ? '#f59e0b' : '#64748b';
      ctx.beginPath();
      ctx.moveTo(p010.x, p010.y);
      ctx.lineTo(p110.x, p110.y);
      ctx.lineTo(p111.x, p111.y);
      ctx.lineTo(p011.x, p011.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 3D Solar Panels Array Placement on Roof
    const rows = Math.ceil(panelCount / 4);
    const cols = Math.min(panelCount, 4);
    const panelW = 24;
    const panelH = 14;
    const tiltOffset = Math.sin((tiltAngle * Math.PI) / 180) * 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r * 4 + c >= panelCount) break;

        const startX = -bWidth/2 + 25 + c * 28;
        const startZ = -bDepth/2 + 20 + r * 22;

        const pv0 = project3D(startX, bHeight + 4, startZ);
        const pv1 = project3D(startX + panelW, bHeight + 4, startZ);
        const pv2 = project3D(startX + panelW, bHeight + 4 + tiltOffset, startZ + panelH);
        const pv3 = project3D(startX, bHeight + 4 + tiltOffset, startZ + panelH);

        // Panel Surface Fill
        if (renderMode === 'shading_heatmap') {
          ctx.fillStyle = '#10b981'; // High efficiency green
        } else if (renderMode === 'wireframe') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        } else {
          ctx.fillStyle = '#0284c7'; // Deep blue solar glass texture
        }

        ctx.beginPath();
        ctx.moveTo(pv0.x, pv0.y);
        ctx.lineTo(pv1.x, pv1.y);
        ctx.lineTo(pv2.x, pv2.y);
        ctx.lineTo(pv3.x, pv3.y);
        ctx.closePath();
        ctx.fill();

        // Panel Metallic Frame Border
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Solar Cell Grid Lines inside panel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo((pv0.x + pv1.x)/2, (pv0.y + pv1.y)/2);
        ctx.lineTo((pv3.x + pv2.x)/2, (pv3.y + pv2.y)/2);
        ctx.stroke();
      }
    }

    // 3D Obstructions (Water Tank / Chimney)
    if (showObstructions) {
      const tankX = bWidth/2 - 25;
      const tankZ = bDepth/2 - 25;
      const tankH = bHeight + 25;

      const tp0 = project3D(tankX - 10, bHeight, tankZ - 10);
      const tp1 = project3D(tankX + 10, bHeight, tankZ - 10);
      const tp2 = project3D(tankX + 10, tankH, tankZ - 10);
      const tp3 = project3D(tankX - 10, tankH, tankZ - 10);

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(tp0.x, tp0.y);
      ctx.lineTo(tp1.x, tp1.y);
      ctx.lineTo(tp2.x, tp2.y);
      ctx.lineTo(tp3.x, tp3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.stroke();
    }

    // Draw Sun Arc Path
    if (showSunPath && !isNight) {
      const sunX = centerX + Math.cos((timeOfDay - 6) * Math.PI / 12 - Math.PI/2) * (width * 0.38);
      const sunY = centerY - 140 - Math.sin((timeOfDay - 6) * Math.PI / 12) * 110;

      // Sun Glow
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 35);
      sunGlow.addColorStop(0, '#fef08a');
      sunGlow.addColorStop(0.5, '#eab308');
      sunGlow.addColorStop(1, 'rgba(234, 179, 8, 0)');

      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
      ctx.fill();

      // Sun Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [lat, lng, panelCount, tiltAngle, rotationAngle, cameraPitch, timeOfDay, renderMode, showObstructions, showSunPath]);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-5 text-white font-sans overflow-hidden">
      
      {/* HEADER & LOCATION INFOBAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> GPS 3D Solar Engine
            </span>
            <span className="text-xs text-slate-400 font-mono font-bold">
              Lat: {lat.toFixed(4)}° N, Long: {lng.toFixed(4)}° E
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-emerald-400" /> Interactive 3D Rooftop Solar Viewer
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {address}
          </p>
        </div>

        {/* Quick View Mode Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: '3d_realistic', label: '3D Realistic' },
            { id: 'shading_heatmap', label: 'Shading Heatmap' },
            { id: 'wireframe', label: 'CAD Wireframe' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setRenderMode(m.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                renderMode === m.id 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRIC RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DC System Size</span>
          <span className="text-base font-black text-white">{metrics.systemKw} kWp</span>
          <span className="text-[10px] text-slate-500 font-bold block">{panelCount} x 540W PV Modules</span>
        </div>

        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Est. Annual Generation</span>
          <span className="text-base font-black text-emerald-400">{metrics.annualKwh.toLocaleString()} kWh/yr</span>
          <span className="text-[10px] text-slate-500 font-bold block">@{metrics.dailyIrradiance} kWh/m²/day Peak</span>
        </div>

        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Roof Tilt & Azimuth</span>
          <span className="text-base font-black text-teal-300">{tiltAngle}° Tilt / {azimuth}° South</span>
          <span className="text-[10px] text-slate-500 font-bold block">{roofType} Structure</span>
        </div>

        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sun Position & Elevation</span>
          <span className="text-base font-black text-amber-400">{timeOfDay}:00 hrs</span>
          <span className="text-[10px] text-slate-500 font-bold block">Elev: {(metrics.sunElevation * 90).toFixed(1)}°</span>
        </div>
      </div>

      {/* CANVAS & 3D CONTROLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Main 3D Canvas */}
        <div className="lg:col-span-3 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between group">
          
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={460} 
            className="w-full h-[400px] sm:h-[460px] object-cover cursor-grab active:cursor-grabbing"
          />

          {/* Interactive Sun Path Slider Overlay */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800/80 flex items-center gap-4 text-xs">
            <Sun className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                <span>Sun Path Time Simulation</span>
                <span className="text-amber-300">{timeOfDay}:00 {timeOfDay < 12 ? 'AM' : 'PM'}</span>
              </div>
              <input 
                type="range" 
                min="6" 
                max="18" 
                step="1"
                value={timeOfDay}
                onChange={e => setTimeOfDay(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Top Floating Controls */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setRotationAngle((prev) => (prev + 45) % 360)}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 backdrop-blur-md transition-all shadow-md"
              title="Rotate 3D View 45°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar Controls */}
        <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
          <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-emerald-400" /> CAD Parameters
          </h3>

          {/* Panel Count Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span>PV Panel Count</span>
              <span className="text-emerald-400 font-mono">{panelCount} Modules</span>
            </div>
            <input 
              type="range" 
              min="4" 
              max="40" 
              value={panelCount}
              onChange={e => setPanelCount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Roof Tilt Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span>Structure Tilt Angle</span>
              <span className="text-teal-400 font-mono">{tiltAngle}°</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="45" 
              value={tiltAngle}
              onChange={e => setTiltAngle(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Orbit Camera Angle */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span>3D Orbit View Angle</span>
              <span className="text-blue-400 font-mono">{rotationAngle}°</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="360" 
              value={rotationAngle}
              onChange={e => setRotationAngle(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Camera Pitch Angle */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span>3D Pitch Camera</span>
              <span className="text-purple-400 font-mono">{cameraPitch}°</span>
            </div>
            <input 
              type="range" 
              min="15" 
              max="75" 
              value={cameraPitch}
              onChange={e => setCameraPitch(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Feature Toggles */}
          <div className="pt-2 space-y-2 border-t border-slate-800">
            <label className="flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-pointer">
              <span>Show Obstructions (Tank/Chimney)</span>
              <input 
                type="checkbox" 
                checked={showObstructions} 
                onChange={e => setShowObstructions(e.target.checked)} 
                className="w-4 h-4 accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-pointer">
              <span>Show Sun Path Trajectory Arc</span>
              <input 
                type="checkbox" 
                checked={showSunPath} 
                onChange={e => setShowSunPath(e.target.checked)} 
                className="w-4 h-4 accent-amber-500"
              />
            </label>
          </div>
        </div>

      </div>

    </div>
  );
}
