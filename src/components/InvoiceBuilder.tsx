import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Download, 
  Mail, 
  Building, 
  User, 
  IndianRupee, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  FileText,
  Clock,
  Printer,
  QrCode,
  Building2,
  UserPlus,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useLogos } from '@/src/context/LogoContext';
import { useAuth } from '@/src/context/AuthContext';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Lead } from '@/src/types';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export default function InvoiceBuilder() {
  const { logos } = useLogos();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const vendorCompanyName = user?.companyName || user?.vendorAccount?.companyName || logos.companyName || 'META GREEN SOLAR SOLUTIONS LLP';
  const vendorLogo = user?.companyLogo || user?.vendorAccount?.companyLogo || logos.companyLogo;
  const vendorDoorNo = user?.doorNo || user?.vendorAccount?.doorNo;
  const vendorAddressText = user?.companyAddress 
    ? `${vendorDoorNo ? `${vendorDoorNo}, ` : ''}${user.companyAddress}, ${user.city || ''}, ${user.state || ''} ${user.pincode || ''}`
    : (user?.vendorAccount?.companyAddress ? `${vendorDoorNo ? `${vendorDoorNo}, ` : ''}${user.vendorAccount.companyAddress}, ${user.vendorAccount.city || ''}, ${user.vendorAccount.state || ''} ${user.vendorAccount.pincode || ''}` : 'Vijayawada, Andhra Pradesh');
  const vendorGstin = user?.gstin || user?.vendorAccount?.gstin || '37AABFM9812K1Z9';

  // Walk-in Customer Modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinData, setWalkinData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: 'Andhra Pradesh',
    pincode: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceType: 'Standard Invoice' as 'Standard Invoice' | 'Proforma Invoice' | 'Progress Billing',
    invoiceNo: 'MGI-2026-0108',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    poReferenceNo: 'PO-2026-402',
    paymentTerms: '50% Advance, 40% Delivery, 10% Installation',
    customerName: 'K. Srimannarayana',
    phone: '9492161474',
    email: 'sriman@example.com',
    address: 'D.No: 1-13-1, Main Road',
    city: 'Pedapadu Village, Eluru',
    state: 'Andhra Pradesh',
    pincode: '534001',
    items: [
      {
        id: '1',
        description: 'Solar PV Modules 550W Mono PERC (Supply Component)',
        quantity: 10,
        unit: 'Pcs',
        rate: 14500,
        amount: 145000
      },
      {
        id: '2',
        description: 'On-Grid Solar Inverter 5kW Grid-Tied (Supply Component)',
        quantity: 1,
        unit: 'Nos',
        rate: 48000,
        amount: 48000
      },
      {
        id: '3',
        description: 'Installation, Civil Grouting & Commissioning Services',
        quantity: 1,
        unit: 'Job',
        rate: 22000,
        amount: 22000
      }
    ] as InvoiceLineItem[],
    discount: 5000,
    gstRate: 12,
    use7030Split: true,
    notes: 'Thank you for choosing MetaGreen Solar Solutions. Certified that particulars given are true and correct. Payment to be remitted directly to authorized bank account.'
  });

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });
    return () => unsubscribe();
  }, []);

  const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalBeforeTax = Math.max(0, subtotal - invoiceForm.discount);

  let gstAmount = 0;
  if (invoiceForm.use7030Split) {
    const component70 = totalBeforeTax * 0.7;
    const component30 = totalBeforeTax * 0.3;
    gstAmount = (component70 * 0.12) + (component30 * 0.18);
  } else {
    gstAmount = totalBeforeTax * (invoiceForm.gstRate / 100);
  }

  const grandTotal = totalBeforeTax + gstAmount;

  const handleAddItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: 'New Solar Hardware / Service Component',
      quantity: 1,
      unit: 'Nos',
      rate: 1000,
      amount: 1000
    };
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (id: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const handleAddWalkinCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLead = {
        name: walkinData.name,
        phone: walkinData.phone,
        email: `${walkinData.phone}@walkin.solar`,
        address: walkinData.address,
        city: walkinData.city,
        state: walkinData.state,
        pincode: walkinData.pincode,
        source: 'Walk-in' as const,
        status: 'New Lead' as const,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'leads'), newLead);
      setInvoiceForm(prev => ({
        ...prev,
        customerName: walkinData.name,
        phone: walkinData.phone,
        email: `${walkinData.phone}@walkin.solar`,
        address: walkinData.address,
        city: walkinData.city,
        state: walkinData.state,
        pincode: walkinData.pincode
      }));
      setIsWalkinModalOpen(false);
      setWalkinData({ name: '', phone: '', address: '', city: '', state: 'Andhra Pradesh', pincode: '' });
      alert(`✅ Customer "${walkinData.name}" added & selected for Invoice!`);
    } catch (err) {
      console.error(err);
      alert('Failed to add customer');
    }
  };

  const handleSaveInvoice = async () => {
    try {
      await addDoc(collection(db, 'invoices'), {
        ...invoiceForm,
        subtotal,
        gstAmount,
        grandTotal,
        createdAt: serverTimestamp()
      });
      alert('✅ Invoice saved successfully to Cloud database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice');
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview-container');
    if (!element) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Invoice_${invoiceForm.invoiceNo}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Failed to generate PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-500/20">
              Commercial & Proforma Billing
            </span>
            <h1 className="text-xl font-black text-white mt-0.5">Commercial Invoice Generator</h1>
            <p className="text-xs text-slate-400 font-medium">Issue proforma invoices, progress billing & commercial statements for customer payments</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsWalkinModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-slate-700"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            + Walk-in Client
          </button>
          <button
            onClick={handleSaveInvoice}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-slate-700"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Save Cloud Record
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF Invoice
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left (Col 5) vs Preview Right (Col 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EDITABLE FORM */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Invoice Type & Details */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Invoice Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Invoice Document Type</label>
                <select
                  value={invoiceForm.invoiceType}
                  onChange={e => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                >
                  <option value="Standard Invoice">Standard Commercial Invoice</option>
                  <option value="Proforma Invoice">Proforma Invoice</option>
                  <option value="Progress Billing">Progress Billing Statement</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceForm.invoiceNo}
                  onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceForm.invoiceDate}
                  onChange={e => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">PO / Ref Number</label>
                <input
                  type="text"
                  value={invoiceForm.poReferenceNo}
                  onChange={e => setInvoiceForm({ ...invoiceForm, poReferenceNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Payment Schedule</label>
                <input
                  type="text"
                  value={invoiceForm.paymentTerms}
                  onChange={e => setInvoiceForm({ ...invoiceForm, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Customer Details
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">Select existing or type below</span>
            </div>

            {leads.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Select from CRM Leads</label>
                <select
                  onChange={e => {
                    const lead = leads.find(l => l.id === e.target.value);
                    if (lead) {
                      setInvoiceForm(prev => ({
                        ...prev,
                        customerName: lead.name,
                        phone: lead.phone,
                        email: lead.email || '',
                        address: lead.address || '',
                        city: lead.city || '',
                        state: lead.state || 'Andhra Pradesh',
                        pincode: lead.pincode || ''
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select CRM Customer --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.phone}) - {l.city}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={invoiceForm.customerName}
                  onChange={e => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={invoiceForm.phone}
                    onChange={e => setInvoiceForm({ ...invoiceForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={invoiceForm.email}
                    onChange={e => setInvoiceForm({ ...invoiceForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Address & Location</label>
                <input
                  type="text"
                  value={invoiceForm.address}
                  onChange={e => setInvoiceForm({ ...invoiceForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500 mb-2"
                  placeholder="Street / Door No."
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={invoiceForm.city}
                    onChange={e => setInvoiceForm({ ...invoiceForm, city: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
                    placeholder="City / Village"
                  />
                  <input
                    type="text"
                    value={invoiceForm.state}
                    onChange={e => setInvoiceForm({ ...invoiceForm, state: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={invoiceForm.pincode}
                    onChange={e => setInvoiceForm({ ...invoiceForm, pincode: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Billed Items & Services
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line Item
              </button>
            </div>

            <div className="space-y-3">
              {invoiceForm.items.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Item #{idx + 1}</span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={item.description}
                    onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-medium outline-none"
                    placeholder="Item description"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase">Unit Rate (₹)</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase">Total (₹)</label>
                      <input
                        type="number"
                        readOnly
                        value={item.amount}
                        className="w-full px-2.5 py-1 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-emerald-400 font-black cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Discounts */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Subtotal:</span>
                <span className="text-white font-black">₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={invoiceForm.discount}
                    onChange={e => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GST Tax Computation</label>
                  <button
                    type="button"
                    onClick={() => setInvoiceForm({ ...invoiceForm, use7030Split: !invoiceForm.use7030Split })}
                    className={`w-full py-1.5 px-2 rounded-xl text-xs font-black transition-all border ${
                      invoiceForm.use7030Split
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {invoiceForm.use7030Split ? '70:30 Rule Active' : 'Flat GST Rate'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-slate-800">
                <span className="text-emerald-400">Total Payable:</span>
                <span className="text-emerald-400 text-base">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PRINTABLE INVOICE PREVIEW */}
        <div className="lg:col-span-7">
          <div className="sticky top-20 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Live A4 Document Preview
              </span>
              <span className="text-[11px] font-medium">Auto-formatted for Printing & Customer PDF</span>
            </div>

            {/* Printable Container */}
            <div 
              id="invoice-preview-container" 
              className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-6 font-sans border border-slate-200"
              style={{ minHeight: '800px' }}
            >
              {/* Header: Company Info & Logo */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  {vendorLogo ? (
                    <img src={vendorLogo} alt="Logo" className="h-12 object-contain mb-2" />
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg">M</div>
                      <span className="text-lg font-black tracking-tight text-slate-900">{vendorCompanyName}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-600 font-medium max-w-sm">{vendorAddressText}</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">GSTIN: {vendorGstin}</p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-widest">
                    {invoiceForm.invoiceType}
                  </span>
                  <p className="text-xl font-black text-slate-900 mt-2">{invoiceForm.invoiceNo}</p>
                  <p className="text-xs font-medium text-slate-600">Date: <span className="font-bold text-slate-800">{invoiceForm.invoiceDate}</span></p>
                  <p className="text-xs font-medium text-slate-600">Due Date: <span className="font-bold text-slate-800">{invoiceForm.dueDate}</span></p>
                  {invoiceForm.poReferenceNo && (
                    <p className="text-xs font-medium text-slate-600">Ref / PO: <span className="font-bold text-slate-800">{invoiceForm.poReferenceNo}</span></p>
                  )}
                </div>
              </div>

              {/* Bill To & Ship To */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Billed To (Customer):</span>
                  <p className="font-black text-sm text-slate-900">{invoiceForm.customerName}</p>
                  <p className="text-slate-600 mt-0.5">{invoiceForm.address}</p>
                  <p className="text-slate-600">{invoiceForm.city}, {invoiceForm.state} - {invoiceForm.pincode}</p>
                  <p className="text-slate-700 font-bold mt-1">Ph: {invoiceForm.phone}</p>
                </div>

                <div className="border-l border-slate-200 pl-6">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Payment Schedule & Terms:</span>
                  <p className="font-bold text-slate-800">{invoiceForm.paymentTerms}</p>
                  <p className="text-slate-500 mt-2 text-[11px]">Mode: Direct NEFT / RTGS / Bank Transfer</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="p-3">#</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Rate (₹)</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoiceForm.items.map((item, idx) => (
                      <tr key={item.id} className="text-slate-800 font-medium">
                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{item.description}</td>
                        <td className="p-3 text-center font-bold">{item.quantity} {item.unit}</td>
                        <td className="p-3 text-right font-medium">₹{item.rate.toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-slate-900">₹{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary & Bank Info */}
              <div className="grid grid-cols-12 gap-6 pt-2">
                <div className="col-span-7 space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Bank Payment Account:</span>
                    <p className="font-bold text-slate-900">Bank: HDFC Bank Ltd | A/C: 50200084920194</p>
                    <p className="text-slate-600">IFSC Code: HDFC0001824 | Branch: Vijayawada Main</p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">{invoiceForm.notes}</p>
                </div>

                <div className="col-span-5 space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {invoiceForm.discount > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                      <span>Discount:</span>
                      <span>- ₹{invoiceForm.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">GST (70:30 Split):</span>
                    <span className="text-slate-900">₹{Math.round(gstAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                    <span>Total Amount Payable:</span>
                    <span className="text-emerald-600 text-base">₹{Math.round(grandTotal).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Signatory</p>
                  <div className="h-8"></div>
                  <p className="font-bold text-slate-700">{invoiceForm.customerName}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">For {vendorCompanyName}</p>
                  <div className="h-8"></div>
                  <p className="font-black text-slate-900">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* WALK-IN CUSTOMER MODAL */}
      {isWalkinModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" /> Add Walk-in Customer
            </h3>

            <form onSubmit={handleAddWalkinCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Customer Name *</label>
                <input
                  required
                  type="text"
                  value={walkinData.name}
                  onChange={e => setWalkinData({ ...walkinData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Phone Number *</label>
                <input
                  required
                  type="text"
                  value={walkinData.phone}
                  onChange={e => setWalkinData({ ...walkinData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Address & Location</label>
                <input
                  type="text"
                  value={walkinData.address}
                  onChange={e => setWalkinData({ ...walkinData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="Door No, Street Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={walkinData.city}
                  onChange={e => setWalkinData({ ...walkinData, city: e.target.value })}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={walkinData.pincode}
                  onChange={e => setWalkinData({ ...walkinData, pincode: e.target.value })}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="Pincode"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkinModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
