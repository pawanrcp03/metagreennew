import React, { useState } from 'react';
import { 
  Map, 
  MapPin, 
  Camera, 
  Video, 
  Sun, 
  Compass, 
  Home, 
  TreePine, 
  Zap, 
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  Box,
  Sparkles,
  Navigation
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import Solar3DViewer from './Solar3DViewer';
import { useToast } from '@/src/context/ToastContext';

export default function SiteSurvey() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  
  // Lat/Long state
  const [lat, setLat] = useState<number>(17.3850);
  const [lng, setLng] = useState<number>(78.4867);
  const [address, setAddress] = useState<string>('Plot 42, Jubilee Hills, Hyderabad, Telangana 500033');

  const [surveyData, setSurveyData] = useState({
    gpsLocation: '17.3850, 78.4867',
    roofType: 'Flat Concrete',
    roofArea: '1200',
    tiltAngle: '15',
    shadeAnalysis: 'Minimal',
    compassDirection: 'South',
    nearbyBuildings: 'None',
    treeObstruction: 'None',
    electricalPanelType: 'Single Phase',
    meterNumber: 'MTR-2026-9812',
    surveyNotes: ''
  });

  // GPS Auto-Detect Function
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.warning('Geolocation is not supported by your browser.', 'GPS Unsupported');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const detectedLat = pos.coords.latitude;
        const detectedLng = pos.coords.longitude;
        setLat(detectedLat);
        setLng(detectedLng);
        const gpsStr = `${detectedLat.toFixed(5)}, ${detectedLng.toFixed(5)}`;
        setSurveyData(prev => ({ ...prev, gpsLocation: gpsStr }));
        toast.success(`GPS Location captured: ${gpsStr}`, 'GPS Detected');

        // Reverse Geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${detectedLat}&lon=${detectedLng}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        console.error(err);
        toast.error('Failed to fetch GPS coordinates. Please enter manually.', 'GPS Error');
        setIsDetectingGps(false);
      }
    );
  };

  const handleManualGpsChange = (val: string) => {
    setSurveyData({ ...surveyData, gpsLocation: val });
    const parts = val.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setLat(parts[0]);
      setLng(parts[1]);
    }
  };

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = (Array.from(e.target.files) as File[]).map(f => f.name);
      setImages([...images, ...newImages]);
      toast.info(`${newImages.length} site photos uploaded.`, 'Photos Uploaded');
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newVideos = (Array.from(e.target.files) as File[]).map(f => f.name);
      setVideos([...videos, ...newVideos]);
      toast.info(`${newVideos.length} site videos uploaded.`, 'Videos Uploaded');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'siteSurveys'), {
        ...surveyData,
        lat,
        lng,
        address,
        images,
        videos,
        createdAt: serverTimestamp()
      });
      toast.success('Site survey report and 3D solar model saved to cloud!', 'Survey Saved');
    } catch (err) {
      console.error('Error submitting site survey:', err);
      toast.error('Failed to submit site survey.', 'Survey Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Compass className="w-8 h-8 text-emerald-600" /> Site Survey & 3D Rooftop CAD Engine
          </h1>
          <p className="text-slate-500 font-medium mt-1">Engineer field survey data collection & live 3D rooftop simulation based on GPS coordinates.</p>
        </div>
      </header>

      {/* DYNAMIC 3D ROOFTOP SOLAR VIEWER */}
      <Solar3DViewer 
        lat={lat}
        lng={lng}
        address={address}
        roofType={surveyData.roofType}
        roofAreaSqFt={Number(surveyData.roofArea) || 1200}
        tiltAngle={Number(surveyData.tiltAngle) || 15}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            
            {/* Location & Property */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" /> GPS Location & Address Geocoding
                </span>
                <button
                  type="button"
                  onClick={handleAutoDetectGPS}
                  disabled={isDetectingGps}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isDetectingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  {isDetectingGps ? 'Detecting...' : 'Auto-Detect Live GPS'}
                </button>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GPS Lat/Long Coordinates *</label>
                  <input 
                    type="text" 
                    value={surveyData.gpsLocation}
                    onChange={e => handleManualGpsChange(e.target.value)}
                    placeholder="17.3850, 78.4867"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold font-mono text-emerald-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-xs" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roof Type *</label>
                  <select 
                    value={surveyData.roofType}
                    onChange={e => setSurveyData({...surveyData, roofType: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white text-xs" 
                  >
                    <option value="Flat Concrete">Flat Concrete Roof</option>
                    <option value="Sloped Tile">Sloped Clay Tile</option>
                    <option value="Tin Sheet">Tin / Metal Sheet Roof</option>
                    <option value="Asbestos">Asbestos Sheet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Usable Roof Area (sq. ft)</label>
                  <input 
                    type="number" 
                    value={surveyData.roofArea}
                    onChange={e => setSurveyData({...surveyData, roofArea: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Compass Direction</label>
                  <select 
                    value={surveyData.compassDirection}
                    onChange={e => setSurveyData({...surveyData, compassDirection: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>South (Optimal)</option>
                    <option>East</option>
                    <option>West</option>
                    <option>North (Not Recommended)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sun className="w-5 h-5 text-amber-500" /> Technical Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roof Tilt Angle (°)</label>
                  <input 
                    type="number" 
                    value={surveyData.tiltAngle}
                    onChange={e => setSurveyData({...surveyData, tiltAngle: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shade Analysis</label>
                  <select 
                    value={surveyData.shadeAnalysis}
                    onChange={e => setSurveyData({...surveyData, shadeAnalysis: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>Minimal (0-10%)</option>
                    <option>Moderate (10-30%)</option>
                    <option>Heavy (&gt;30%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Home className="w-4 h-4"/> Nearby Buildings</label>
                  <input 
                    type="text" 
                    value={surveyData.nearbyBuildings}
                    onChange={e => setSurveyData({...surveyData, nearbyBuildings: e.target.value})}
                    placeholder="Height and distance"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><TreePine className="w-4 h-4"/> Tree Obstruction</label>
                  <input 
                    type="text" 
                    value={surveyData.treeObstruction}
                    onChange={e => setSurveyData({...surveyData, treeObstruction: e.target.value})}
                    placeholder="Describe any trees blocking sun"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Electricals */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Zap className="w-5 h-5 text-blue-500" /> Electrical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Existing Panel Type</label>
                  <select 
                    value={surveyData.electricalPanelType}
                    onChange={e => setSurveyData({...surveyData, electricalPanelType: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>Single Phase (230V)</option>
                    <option>Three Phase (400V)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meter Number / Account</label>
                  <input 
                    type="text" 
                    value={surveyData.meterNumber}
                    onChange={e => setSurveyData({...surveyData, meterNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-5 h-5 text-slate-500" /> Survey Notes
              </h3>
              <textarea 
                value={surveyData.surveyNotes}
                onChange={e => setSurveyData({...surveyData, surveyNotes: e.target.value})}
                placeholder="Enter any additional observations, hazards, or special requirements..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none min-h-[100px]"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} 
              {isSubmitting ? 'Submitting...' : 'Submit Survey Report'}
            </button>
          </form>
        </div>

        {/* Media Uploads sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Camera className="w-5 h-5 text-emerald-600" /> Photos
            </h3>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Click to upload photos</p>
                </div>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {images.length > 0 && (
                <ul className="text-sm text-slate-600 space-y-1">
                  {images.map((img, i) => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500"/> {img}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Video className="w-5 h-5 text-emerald-600" /> Videos
            </h3>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Click to upload videos</p>
                </div>
                <input type="file" multiple accept="video/*" className="hidden" onChange={handleVideoUpload} />
              </label>
              {videos.length > 0 && (
                <ul className="text-sm text-slate-600 space-y-1">
                  {videos.map((vid, i) => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500"/> {vid}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
