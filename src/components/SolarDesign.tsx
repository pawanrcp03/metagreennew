import React, { useState } from 'react';
import { 
  Box, 
  Map as MapIcon, 
  Sun, 
  Battery, 
  Zap, 
  Maximize, 
  Layers, 
  ChevronRight,
  Monitor,
  Download,
  Settings,
  CheckCircle2,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportToPDF } from '@/src/lib/exportUtils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import Solar3DViewer from './Solar3DViewer';

export default function SolarDesign() {
  const [activeTab, setActiveTab] = useState<'layout' | 'electrical' | 'simulation'>('layout');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  
  // Lat/Long Coordinates State
  const [lat, setLat] = useState<number>(17.3850);
  const [lng, setLng] = useState<number>(78.4867);
  const [address, setAddress] = useState<string>('Jubilee Hills, Hyderabad, Telangana');

  // Simulated Interactive States
  const [roofDrawn, setRoofDrawn] = useState(false);
  const [obstructionsAdded, setObstructionsAdded] = useState(false);
  const [panelsPlaced, setPanelsPlaced] = useState(false);
  
  const [stringsDesigned, setStringsDesigned] = useState(false);
  const [cableRouted, setCableRouted] = useState(false);
  
  const [shadingRun, setShadingRun] = useState(false);

  const [panelCount, setPanelCount] = useState(12);
  const [tiltAngle, setTiltAngle] = useState(15);
  const [orientation, setOrientation] = useState('Portrait');

  const handleExport = () => {
    const data = [
      ['Total Panels', panelCount.toString()],
      ['System Capacity', `${(panelCount * 0.5).toFixed(1)} kW`],
      ['Tilt Angle', `${tiltAngle}°`],
      ['Orientation', orientation]
    ];
    exportToPDF('Solar CAD Export Report', ['Parameter', 'Value'], data);
  };
  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'solarDesigns'), {
        panelCount,
        tiltAngle,
        orientation,
        roofDrawn,
        obstructionsAdded,
        panelsPlaced,
        stringsDesigned,
        cableRouted,
        shadingRun,
        createdAt: serverTimestamp()
      });
      alert('Design saved successfully to the database!');
    } catch (err) {
      console.error('Error saving design:', err);
      alert('Failed to save design.');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Solar Design Studio</h1>
          <p className="text-slate-500 font-medium mt-1">Design, simulate, and optimize solar installations</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExport} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm">
             <Download className="w-4 h-4" /> Export CAD
           </button>
           <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-emerald-200">
             Save Design
           </button>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'layout', label: 'Roof Layout & Placement', icon: MapIcon },
          { id: 'electrical', label: 'Electrical & Components', icon: Zap },
          { id: 'simulation', label: 'Energy Simulation', icon: Sun },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-emerald-100/80 text-emerald-800" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 overflow-y-auto space-y-6">
          {activeTab === 'layout' && (
            <>
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><MapIcon className="w-4 h-4"/> Mapping Tools</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setRoofDrawn(!roofDrawn)}
                    className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-lg border flex justify-between items-center transition-colors", roofDrawn ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "text-slate-700 hover:bg-slate-50 border-slate-200")}
                  >
                    {roofDrawn ? 'Roof Boundary Drawn' : 'Draw Roof Boundary'} 
                    {roofDrawn ? <CheckCircle2 className="w-4 h-4"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                  </button>
                  <button 
                    onClick={() => {
                        if (!roofDrawn) return alert('Please draw roof boundary first');
                        setObstructionsAdded(!obstructionsAdded);
                    }}
                    className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-lg border flex justify-between items-center transition-colors", obstructionsAdded ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "text-slate-700 hover:bg-slate-50 border-slate-200")}
                  >
                    {obstructionsAdded ? 'Obstructions Added' : 'Add Obstruction (Chimney/Tree)'} 
                    {obstructionsAdded ? <CheckCircle2 className="w-4 h-4"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                  </button>
                  <button 
                    onClick={() => {
                        if (!roofDrawn) return alert('Please draw roof boundary first');
                        setPanelsPlaced(!panelsPlaced);
                    }}
                    className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-lg border flex justify-between items-center transition-colors", panelsPlaced ? "bg-blue-50 border-blue-200 text-blue-700" : "text-slate-700 hover:bg-slate-50 border-slate-200")}
                  >
                    {panelsPlaced ? 'Clear Panels' : 'Auto-Place Panels'} 
                    {panelsPlaced ? <RefreshCw className="w-4 h-4"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Settings className="w-4 h-4"/> Panel Settings</h3>
                <div className="space-y-3">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Orientation</label>
                     <select 
                        value={orientation} 
                        onChange={e => setOrientation(e.target.value)} 
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg bg-white"
                     >
                       <option>Portrait</option>
                       <option>Landscape</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Tilt Angle ({tiltAngle}°)</label>
                     <input 
                        type="range" 
                        min="0" 
                        max="45" 
                        value={tiltAngle}
                        onChange={e => setTiltAngle(parseInt(e.target.value))} 
                        className="w-full accent-emerald-600" 
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Panel Count ({panelCount})</label>
                     <input 
                        type="range" 
                        min="4" 
                        max="24" 
                        value={panelCount}
                        onChange={e => setPanelCount(parseInt(e.target.value))} 
                        className="w-full accent-emerald-600" 
                     />
                   </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'electrical' && (
            <>
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> String Design</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                        if (!panelsPlaced) return alert('Please place panels in Layout tab first');
                        setStringsDesigned(!stringsDesigned);
                    }}
                    className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-lg border transition-colors flex justify-between items-center", stringsDesigned ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "text-slate-700 hover:bg-slate-50 border-slate-200")}
                  >
                    {stringsDesigned ? 'Strings Auto-Designed' : 'Auto-String Panels'}
                    {stringsDesigned ? <CheckCircle2 className="w-4 h-4"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                  </button>
                  <button 
                    onClick={() => alert('Manual string routing mode activated (Simulated)')}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200"
                  >
                    Manual String Routing
                  </button>
                  <button 
                    onClick={() => {
                        if (!stringsDesigned) return alert('Please design strings first');
                        setCableRouted(!cableRouted);
                    }}
                    className={cn("w-full text-left px-3 py-2 text-sm font-medium rounded-lg border transition-colors flex justify-between items-center", cableRouted ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "text-slate-700 hover:bg-slate-50 border-slate-200")}
                  >
                    {cableRouted ? 'Cable Path Routed' : 'Cable Routing Path'}
                    {cableRouted ? <CheckCircle2 className="w-4 h-4"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Battery className="w-4 h-4"/> Components</h3>
                <div className="space-y-3">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Inverter Selection</label>
                     <select className="w-full text-sm p-2 border border-slate-200 rounded-lg bg-white">
                       <option>SolarEdge 5kW HD-Wave</option>
                       <option>Enphase IQ8 Microinverter</option>
                       <option>Fronius Primo 5.0</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Battery Storage</label>
                     <select className="w-full text-sm p-2 border border-slate-200 rounded-lg bg-white">
                       <option>None</option>
                       <option>Tesla Powerwall 2 (13.5kWh)</option>
                       <option>LG Chem RESU 10H</option>
                     </select>
                   </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'simulation' && (
            <>
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Sun className="w-4 h-4"/> Environmental Data</h3>
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                     <span className="text-slate-500">Irradiance</span>
                     <span className="font-bold">5.2 kWh/m²/day</span>
                   </div>
                   <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                     <span className="text-slate-500">System Losses</span>
                     <span className="font-bold text-amber-600">14%</span>
                   </div>
                   <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                     <span className="text-slate-500">Est. Generation</span>
                     <span className="font-bold text-emerald-600">
                         {panelsPlaced ? `${Math.round(panelCount * 400 * 5.2 * 365 * 0.86 / 1000).toLocaleString()} kWh/yr` : '0 kWh/yr'}
                     </span>
                   </div>
                   {shadingRun && (
                       <div className="flex justify-between items-center pb-2 border-b border-slate-100 bg-amber-50 p-2 rounded-lg">
                         <span className="text-amber-700">Shading Loss</span>
                         <span className="font-bold text-amber-700">
                             {obstructionsAdded ? '12.5%' : '1.2%'}
                         </span>
                       </div>
                   )}
                </div>
              </div>
              <button 
                onClick={() => setShadingRun(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Run Shading Analysis
              </button>
            </>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="lg:col-span-3 bg-slate-100 rounded-3xl border border-slate-200 relative overflow-hidden flex flex-col min-h-[500px]">
          <div className="absolute top-4 right-4 z-20 bg-white rounded-2xl shadow-md border border-slate-200 p-1 flex">
            <button 
              onClick={() => setViewMode('2d')}
              className={cn("px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer", viewMode === '2d' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100')}
            >
              2D Satellite
            </button>
            <button 
              onClick={() => setViewMode('3d')}
              className={cn("px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5", viewMode === '3d' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100')}
            >
              <Box className="w-3.5 h-3.5"/> Interactive 3D Model
            </button>
          </div>

          {viewMode === '3d' ? (
            <div className="p-2">
              <Solar3DViewer
                lat={lat}
                lng={lng}
                address={address}
                panelCount={panelCount}
                tiltAngle={tiltAngle}
                onDesignChange={(d) => {
                  setPanelCount(d.panelCount);
                  setTiltAngle(d.tiltAngle);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center relative overflow-hidden p-6">
              {/* Simulated Canvas Content */}
              <div className="text-center w-full h-full flex items-center justify-center relative">
                <div className="w-[600px] h-[400px] bg-slate-200/50 border-2 border-dashed border-slate-400 rounded-2xl flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                  <img 
                      src="https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800&h=600" 
                      alt="Satellite Roof" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
                  />
                  
                  {!roofDrawn && (
                      <>
                          <MapIcon className="w-12 h-12 text-slate-600 mb-2 relative z-10" />
                          <p className="text-slate-700 font-bold text-sm relative z-10">Satellite Roof Canvas ({lat.toFixed(4)}°, {lng.toFixed(4)}°)</p>
                          <p className="text-slate-500 font-medium text-xs relative z-10">Draw a roof boundary or switch to 3D Model View</p>
                      </>
                  )}
                    
                    {/* Simulated Roof / Panels */}
                    {roofDrawn && (
                        <div className="absolute inset-0 m-16 bg-white/20 border-2 border-emerald-400 rotate-2 backdrop-blur-[1px] transition-all duration-500">
                           {obstructionsAdded && (
                               <div className="absolute bottom-4 right-8 w-16 h-16 bg-slate-800/40 rounded-full border border-slate-500 flex items-center justify-center">
                                   <span className="text-white text-xs font-bold">Tree</span>
                               </div>
                           )}

                           {panelsPlaced && (
                               <div className={cn(
                                   "grid gap-1 p-2 h-full absolute inset-0 transition-all duration-500", 
                                   orientation === 'Portrait' ? "grid-cols-6" : "grid-cols-4"
                               )}>
                                 {Array.from({length: Math.min(panelCount, 24)}).map((_, i) => (
                                   <div key={i} className={cn(
                                       "bg-blue-600/80 border border-blue-400 rounded-sm relative transition-all duration-300 shadow-sm",
                                       shadingRun && obstructionsAdded && (i === 10 || i === 11 || i === 16 || i === 17) ? "bg-slate-700/80" : "", // simulated shade
                                   )}>
                                       {/* Stringing simulation */}
                                       {stringsDesigned && i < panelCount - 1 && (
                                            <div className="absolute top-1/2 left-1/2 w-[120%] h-0.5 bg-red-500 z-10 transform origin-left shadow-sm"></div>
                                       )}
                                   </div>
                                 ))}
                                 
                                 {/* Cable Routing simulation */}
                                 {cableRouted && (
                                     <div className="absolute top-1/2 -left-8 w-12 h-1 bg-amber-500 z-20"></div>
                                 )}
                               </div>
                           )}
                        </div>
                    )}
                  </div>
              </div>
            </div>
          )}

          {/* Sun Path Overlay Simulation */}
          {activeTab === 'simulation' && shadingRun && viewMode === '2d' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
              <div className="w-[800px] h-[800px] rounded-full border-2 border-amber-300/40 relative">
                <div className="absolute top-[10%] left-[20%] w-12 h-12 bg-amber-400 rounded-full blur-sm shadow-[0_0_50px_20px_rgba(251,191,36,0.5)] flex items-center justify-center animate-pulse">
                  <Sun className="w-6 h-6 text-white"/>
                </div>
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                  <path d="M 10 50 Q 50 10 90 50" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2,2"/>
                </svg>
              </div>
            </div>
          )}

          {/* Bottom Toolbar */}
          <div className="h-12 bg-white border-t border-slate-200 px-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1"><Monitor className="w-4 h-4"/> 100%</span>
              <span className="flex items-center gap-1"><Maximize className="w-4 h-4"/> Fit to screen</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1"><Layers className="w-4 h-4"/> Layers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
