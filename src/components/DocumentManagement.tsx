import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Search, 
  FileCheck,
  Building,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus, Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { storageService } from '@/src/services/storage.service';
import { format } from 'date-fns';

type DocCategory = 
  | 'KYC / Customer Docs (Aadhaar, Passbook)' 
  | 'Electricity Bill' 
  | 'Material Photos' 
  | 'Site Before Photos' 
  | 'Site After Photos' 
  | 'Subsidy Docs' 
  | 'DCR Certificate' 
  | 'Survey Report' 
  | 'Agreement' 
  | 'Warranty' 
  | 'Department Verification Report' 
  | 'Net Meter Approval' 
  | 'Invoices';

const CATEGORIES: { id: DocCategory, label: string, icon: any, required: boolean }[] = [
  { id: 'KYC / Customer Docs (Aadhaar, Passbook)', label: 'Customer Docs (Aadhaar, Bill, Passbook)', icon: User, required: true },
  { id: 'Electricity Bill', label: 'Electricity Bill', icon: FileText, required: true },
  { id: 'Material Photos', label: 'Material Photos (Panels, Inverters, Cables, Structures)', icon: ImageIcon, required: true },
  { id: 'Site Before Photos', label: 'Site Before Photos (Rooftop & Electrical Pre-Install)', icon: ImageIcon, required: true },
  { id: 'Site After Photos', label: 'Site After Photos (Commissioned Array, Inverter & Meter)', icon: CheckCircle2, required: true },
  { id: 'Subsidy Docs', label: 'PM Surya Ghar Subsidy Application Docs', icon: FileCheck, required: true },
  { id: 'Department Verification Report', label: 'Department Verification & Inspection Report', icon: FileCheck, required: true },
  { id: 'DCR Certificate', label: 'DCR Solar Panel Certificate', icon: FileCheck, required: true },
  { id: 'Survey Report', label: 'Site Survey Report', icon: Building, required: true },
  { id: 'Agreement', label: 'Customer Agreement', icon: FileCheck, required: true },
  { id: 'Net Meter Approval', label: 'Net Metering Approval', icon: FileCheck, required: true },
  { id: 'Invoices', label: 'Invoices & Receipts', icon: FileText, required: false },
  { id: 'Warranty', label: 'Warranty Certificates', icon: FileCheck, required: false },
];

interface AppDocument {
  id: string;
  projectId: string;
  customerName: string;
  category: DocCategory;
  fileName: string;
  uploadDate: string;
  size: string;
  fileData?: string;
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [realProjects, setRealProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<{ isOpen: boolean, category: DocCategory | null }>({ isOpen: false, category: null });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const displayProjects = realProjects.map(p => {
    return {
      id: p.id,
      customerName: p.customerName || 'Unknown',
      docsCount: documents.filter(d => d.projectId === p.id).length
    };
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const qDocs = query(collection(db, 'projectDocuments'), orderBy('uploadDate', 'desc'));
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppDocument)));
    });

    const qProj = query(collection(db, 'projects'));
    const unsubProj = onSnapshot(qProj, (snapshot) => {
      setRealProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubDocs(); unsubProj(); };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProject && uploadModal.category && selectedFile) {
      const proj = displayProjects.find(p => p.id === selectedProject);
      setIsUploading(true);

      try {
        const filePath = `projects/${selectedProject}/documents/${Date.now()}_${selectedFile.name}`;
        const fileUrl = await storageService.uploadFile(selectedFile, filePath);

        await addDoc(collection(db, 'projectDocuments'), {
          projectId: selectedProject,
          customerName: proj?.customerName || 'Unknown',
          category: uploadModal.category,
          fileName: selectedFile.name,
          uploadDate: new Date().toISOString(),
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
          fileData: fileUrl, // Storing public URL for download
          storagePath: filePath,
          createdAt: serverTimestamp()
        });

        setUploadModal({ isOpen: false, category: null });
        setSelectedFile(null);
      } catch (err) {
        console.error('Upload failed', err);
        alert('Upload failed: ' + err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDownload = (doc: AppDocument) => {
    if (doc.fileData && doc.fileData.startsWith('http')) {
      // It's a public URL, open in new tab
      window.open(doc.fileData, '_blank');
    } else if (doc.fileData) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.fileName;
      a.click();
    } else {
      // Fallback for dummy documents
      const { jsPDF } = window as any;
      if (jsPDF) {
        const pdf = new jsPDF();
        pdf.text(`Document: ${doc.fileName}`, 10, 10);
        pdf.text(`Category: ${doc.category}`, 10, 20);
        pdf.text(`Customer: ${doc.customerName}`, 10, 30);
        pdf.save(doc.fileName);
      } else {
        alert('Download not available for this dummy file.');
      }
    }
  };

  const handleDeleteDocument = async (id: string, storagePath?: string) => { 
    if (window.confirm("Are you sure you want to delete this document?")) { 
      try { 
        await deleteDoc(firestoreDoc(db, "projectDocuments", id)); 
        if (storagePath) await storageService.deleteFile(storagePath);
      } catch (err) { 
        console.error("Error deleting document", err); 
      } 
    } 
  };

  const handleDownloadAll = () => {
    const projectDocs = documents.filter(d => d.projectId === selectedProject);
    projectDocs.forEach(doc => handleDownload(doc));
  };

  const filteredProjects = displayProjects.filter(p => 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(p.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Sidebar - Project List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-emerald-600" /> Document Vault
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredProjects.map(proj => {
            const isSelected = selectedProject === proj.id;
            const projectDocs = documents.filter(d => d.projectId === proj.id);
            const reqCategories = CATEGORIES.filter(c => c.required);
            const completedReq = reqCategories.filter(c => projectDocs.some(d => d.category === c.id)).length;
            const progress = (completedReq / reqCategories.length) * 100;

            return (
              <button 
                key={proj.id}
                onClick={() => setSelectedProject(proj.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all",
                  isSelected ? "bg-emerald-50 border border-emerald-100 shadow-sm" : "hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className="font-bold text-slate-900">{proj.customerName}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-2">{proj.id}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", progress === 100 ? "bg-emerald-500" : "bg-amber-500")} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{completedReq}/{reqCategories.length}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - Document Categories */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {selectedProject ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-xl font-black text-slate-900">{displayProjects.find(p => p.id === selectedProject)?.customerName}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Project Documents & Files</p>
              </div>
              <button onClick={handleDownloadAll} className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Download All
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(category => {
                  const docs = documents.filter(d => d.projectId === selectedProject && d.category === category.id);
                  const hasDoc = docs.length > 0;

                  return (
                    <div key={category.id} className={cn(
                      "border rounded-xl p-4 transition-all",
                      hasDoc ? "bg-white border-emerald-100 hover:border-emerald-200 shadow-sm" : "bg-slate-50 border-dashed border-slate-200"
                    )}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            hasDoc ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                          )}>
                            <category.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{category.label}</h4>
                            {category.required && !hasDoc && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-md mt-1 inline-block">Required</span>
                            )}
                          </div>
                        </div>
                        {hasDoc ? (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <button 
                            onClick={() => setUploadModal({ isOpen: true, category: category.id })}
                            className="p-2 hover:bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {hasDoc ? (
                        <div className="space-y-2">
                          {docs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100 group">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate text-sm font-medium text-slate-700">{doc.fileName}</div>
                              </div>
                              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-md" title="Download"><Download className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteDocument(doc.id, (doc as any).storagePath)} className="p-1.5 hover:bg-red-100 text-red-500 rounded-md" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                          <button 
                            onClick={() => setUploadModal({ isOpen: true, category: category.id })}
                            className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:underline mt-2 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Another
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium text-center py-4">No documents uploaded yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-1">Select a Project</h3>
            <p className="text-sm">Choose a project from the sidebar to view and manage its documents.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Upload {uploadModal.category}</h3>
              <button onClick={() => { setUploadModal({ isOpen: false, category: null }); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer relative bg-slate-50">
                <input 
                  type="file" 
                  required
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Click to browse or drag file here</p>
                <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                
                {selectedFile && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-left">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="truncate w-full">
                      <div className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setUploadModal({ isOpen: false, category: null }); setSelectedFile(null); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg disabled:opacity-50" disabled={isUploading}>Cancel</button>
                <button type="submit" disabled={!selectedFile || isUploading} className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50">
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
