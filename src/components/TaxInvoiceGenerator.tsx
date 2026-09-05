import React, { useState } from 'react';
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
  UserPlus
} from 'lucide-react';
import { useLogos } from '@/src/context/LogoContext';
import { useAuth } from '@/src/context/AuthContext';
import { downloadInvoicePDF, InvoiceData } from '@/src/services/invoiceGenerator.service';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export default function TaxInvoiceGenerator() {
  const { logos } = useLogos();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

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
    cityDistrict: 'Eluru',
    state: 'Andhra Pradesh',
    stateCode: '37',
    pincode: '534467',
    systemCapacityKw: 5
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: 'MGS-2026-0042',
    invoiceDate: new Date().toISOString().split('T')[0],
    referenceNo: 'PO-98214',
    modeOfPayment: 'Bank Transfer / UPI',
    customerName: 'UYYURU NAGESWARARAO',
    phone: '7095784875',
    address: '2-201, Shivalayam Street, T.Narasapuram',
    cityDistrict: 'Eluru',
    state: 'Andhra Pradesh',
    stateCode: '37',
    pincode: '534467',
    systemCapacityKw: 5,
    use7030Split: true,
    items: [
      {
        slNo: 1,
        description: 'Vikram Solar Panels 550W+ Bifacial (9 Panels)',
        hsnSac: '85414300',
        quantity: 1,
        unit: 'kwp',
        rate: 180000,
        taxableValue: 180000,
        cgstRate: 2.5,
        sgstRate: 2.5
      },
      {
        slNo: 2,
        description: 'GroWatt 5kW On-Grid Solar Inverter TL-X',
        hsnSac: '85044090',
        quantity: 1,
        unit: 'nos',
        rate: 55000,
        taxableValue: 55000,
        cgstRate: 9.0,
        sgstRate: 9.0
      }
    ],
    customMatter: 'Subject to local jurisdiction. Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged. Goods once sold will not be taken back. Payment to be remitted directly via NEFT/RTGS/UPI. 70% Goods (SAC 85414300 @ 12%) and 30% Services (SAC 995411 @ 18%).'
  });

  const subtotalTaxable = invoiceForm.items.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalCgst = invoiceForm.items.reduce((sum, item) => sum + (item.taxableValue * (item.cgstRate / 100)), 0);
  const totalSgst = invoiceForm.items.reduce((sum, item) => sum + (item.taxableValue * (item.sgstRate / 100)), 0);
  const totalInvoiceAmount = subtotalTaxable + totalCgst + totalSgst;

  // Add Walk-in Lead directly to Firestore
  const handleAddWalkinCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLeadDoc = {
        name: walkinData.name,
        phone: walkinData.phone,
        email: `${walkinData.phone}@walkin.solar`,
        address: walkinData.address,
        city: walkinData.cityDistrict,
        district: walkinData.cityDistrict,
        state: walkinData.state,
        pincode: walkinData.pincode,
        expectedLoad: walkinData.systemCapacityKw.toString(),
        source: 'Walk-in' as const,
        status: 'New Lead' as const,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'leads'), newLeadDoc);

      setInvoiceForm(prev => ({
        ...prev,
        customerName: walkinData.name,
        phone: walkinData.phone,
        address: walkinData.address,
        cityDistrict: walkinData.cityDistrict,
        state: walkinData.state,
        stateCode: walkinData.stateCode,
        pincode: walkinData.pincode,
        systemCapacityKw: walkinData.systemCapacityKw
      }));

      alert(`✅ Walk-in Customer "${walkinData.name}" added to CRM leads & selected for Tax Invoice!`);
      setIsWalkinModalOpen(false);
      setWalkinData({ name: '', phone: '', address: '', cityDistrict: 'Eluru', state: 'Andhra Pradesh', stateCode: '37', pincode: '534467', systemCapacityKw: 5 });
    } catch (err) {
      console.error('Error adding walk-in customer:', err);
      alert('Failed to add walk-in customer.');
    }
  };

  const handleDownloadPDF = () => {
    const invData: InvoiceData = {
      invoiceType: 'solar_7030_tax_invoice',
      invoiceNo: invoiceForm.invoiceNo,
      invoiceDate: invoiceForm.invoiceDate,
      referenceNo: invoiceForm.referenceNo,
      modeOfPayment: invoiceForm.modeOfPayment,
      shipTo: {
        name: invoiceForm.customerName,
        address: invoiceForm.address,
        cityDistrict: invoiceForm.cityDistrict,
        state: invoiceForm.state,
        stateCode: invoiceForm.stateCode,
        pincode: invoiceForm.pincode,
        phone: invoiceForm.phone
      },
      billTo: {
        name: invoiceForm.customerName,
        address: invoiceForm.address,
        cityDistrict: invoiceForm.cityDistrict,
        state: invoiceForm.state,
        stateCode: invoiceForm.stateCode,
        pincode: invoiceForm.pincode,
        phone: invoiceForm.phone
      },
      items: invoiceForm.items.map(item => ({
        slNo: item.slNo,
        description: item.description,
        quantity: item.quantity,
        capacity: `${invoiceForm.systemCapacityKw} kW System`,
        amount: item.taxableValue,
        hsnSac: item.hsnSac,
        rateInclTax: item.rate * 1.05,
        rate: item.rate,
        unit: item.unit,
        taxableValue: item.taxableValue,
        cgstRate: item.cgstRate,
        cgstAmount: item.taxableValue * (item.cgstRate / 100),
        sgstRate: item.sgstRate,
        sgstAmount: item.taxableValue * (item.sgstRate / 100)
      })),
      systemCapacityKw: invoiceForm.systemCapacityKw,
      totalAmount: totalInvoiceAmount,
      companyDetails: {
        name: logos.companyName || 'META GREEN SOLAR SOLUTIONS LLP',
        logoPath: logos.companyLogo,
        stampPath: logos.officialSeal
      },
      bankDetails: {
        bankName: 'State Bank of India',
        accountName: 'Meta Green Solar Solutions LLP',
        accountNumber: '44513337275',
        ifsc: 'SBIN0012948',
        branch: 'Pantakalava Road, Vijayawada.',
        qrCodePath: logos.paymentQrCode
      }
    };

    downloadInvoicePDF(invData);
  };

  const handleAddItem = () => {
    const newItem = {
      slNo: invoiceForm.items.length + 1,
      description: 'Solar Mounting Structure / Cables',
      hsnSac: '73089090',
      quantity: 1,
      unit: 'lot',
      rate: 15000,
      taxableValue: 15000,
      cgstRate: 2.5,
      sgstRate: 2.5
    };
    setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const updated = invoiceForm.items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, slNo: idx + 1 }));
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-emerald-600" /> GST Tax Invoice Generator
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Compliant 70:30 GST Tax Invoice with dynamic company logo & walk-in customer creation
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => setIsWalkinModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 text-white font-extrabold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-xs shadow-md shadow-emerald-200"
          >
            <UserPlus className="w-4 h-4" /> + Direct Add Walk-in Lead
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4" /> Download Official GST PDF
          </button>
        </div>
      </header>

      {/* SIDE-BY-SIDE CONTAINER: EDITOR (LEFT) & LIVE DOCUMENT PREVIEW (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Tax Invoice Editor Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" /> Tax Invoice Editor Form
            </span>
            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              Live Input
            </span>
          </div>

          {/* Invoice Meta */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Invoice Header Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceForm.invoiceNo} 
                  onChange={e => setInvoiceForm({...invoiceForm, invoiceNo: e.target.value})} 
                  className="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Invoice Date</label>
                <input 
                  type="date" 
                  value={invoiceForm.invoiceDate} 
                  onChange={e => setInvoiceForm({...invoiceForm, invoiceDate: e.target.value})} 
                  className="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Reference PO No.</label>
                <input 
                  type="text" 
                  value={invoiceForm.referenceNo} 
                  onChange={e => setInvoiceForm({...invoiceForm, referenceNo: e.target.value})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Mode</label>
                <input 
                  type="text" 
                  value={invoiceForm.modeOfPayment} 
                  onChange={e => setInvoiceForm({...invoiceForm, modeOfPayment: e.target.value})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
            </div>
          </div>

          {/* Customer Billed To */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> Billed & Shipped To Customer
              </h3>
              <button
                type="button"
                onClick={() => setIsWalkinModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Walk-in Lead
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Customer Full Name</label>
                <input 
                  type="text" 
                  value={invoiceForm.customerName} 
                  onChange={e => setInvoiceForm({...invoiceForm, customerName: e.target.value})} 
                  className="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Mobile Contact</label>
                  <input 
                    type="text" 
                    value={invoiceForm.phone} 
                    onChange={e => setInvoiceForm({...invoiceForm, phone: e.target.value})} 
                    className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">System Capacity (kW)</label>
                  <input 
                    type="number" 
                    value={invoiceForm.systemCapacityKw} 
                    onChange={e => setInvoiceForm({...invoiceForm, systemCapacityKw: Number(e.target.value)})} 
                    className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Street Address</label>
                <input 
                  type="text" 
                  value={invoiceForm.address} 
                  onChange={e => setInvoiceForm({...invoiceForm, address: e.target.value})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none" 
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">City / District</label>
                  <input 
                    type="text" 
                    value={invoiceForm.cityDistrict} 
                    onChange={e => setInvoiceForm({...invoiceForm, cityDistrict: e.target.value})} 
                    className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">State</label>
                  <input 
                    type="text" 
                    value={invoiceForm.state} 
                    onChange={e => setInvoiceForm({...invoiceForm, state: e.target.value})} 
                    className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Pincode</label>
                  <input 
                    type="text" 
                    value={invoiceForm.pincode} 
                    onChange={e => setInvoiceForm({...invoiceForm, pincode: e.target.value})} 
                    className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Invoice Line Items & HSN/SAC
              </h3>
              <button 
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {invoiceForm.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      #{item.slNo}
                    </span>
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={e => {
                        const updated = [...invoiceForm.items];
                        updated[idx].description = e.target.value;
                        setInvoiceForm({...invoiceForm, items: updated});
                      }} 
                      placeholder="Item description" 
                      className="flex-1 p-1.5 border border-slate-200 rounded-md font-bold text-slate-800 outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => handleRemoveItem(idx)} 
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">HSN / SAC</label>
                      <input 
                        type="text" 
                        value={item.hsnSac} 
                        onChange={e => {
                          const updated = [...invoiceForm.items];
                          updated[idx].hsnSac = e.target.value;
                          setInvoiceForm({...invoiceForm, items: updated});
                        }} 
                        className="w-full p-1 border border-slate-200 rounded text-[11px] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Taxable Value (₹)</label>
                      <input 
                        type="number" 
                        value={item.taxableValue} 
                        onChange={e => {
                          const updated = [...invoiceForm.items];
                          updated[idx].taxableValue = Number(e.target.value);
                          setInvoiceForm({...invoiceForm, items: updated});
                        }} 
                        className="w-full p-1 border border-slate-200 rounded text-[11px] font-bold text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">CGST / SGST Rate</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={item.cgstRate} 
                        onChange={e => {
                          const updated = [...invoiceForm.items];
                          updated[idx].cgstRate = Number(e.target.value);
                          updated[idx].sgstRate = Number(e.target.value);
                          setInvoiceForm({...invoiceForm, items: updated});
                        }} 
                        className="w-full p-1 border border-slate-200 rounded text-[11px] font-medium text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Invoice Matter / Statutory Declarations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" /> Tax Invoice Matter & Declarations
            </h3>
            <textarea
              rows={3}
              value={invoiceForm.customMatter}
              onChange={e => setInvoiceForm({ ...invoiceForm, customMatter: e.target.value })}
              className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed"
              placeholder="Statutory declarations, 70:30 GST breakdown, jurisdiction..."
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Live GST Tax Invoice Document Preview */}
        <div className="lg:col-span-7 sticky top-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Live Rendered Tax Invoice View
            </span>
            <button 
              onClick={handleDownloadPDF}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>

          <div className="bg-slate-200/70 p-3 rounded-2xl border border-slate-300/80 overflow-x-auto shadow-inner">
            {/* Tax Invoice Document Preview Canvas */}
            <div 
              id="tax-invoice-preview-container" 
              className="bg-white text-slate-900 text-[11px] p-8 rounded-xl shadow-lg border border-slate-200 max-w-[820px] mx-auto space-y-4 font-sans"
            >
              {/* Top Header & Dynamic Logo */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  {vendorLogo ? (
                    <img src={vendorLogo} alt="Company Logo" className="h-10 max-w-[180px] object-contain mb-1" />
                  ) : (
                    <h2 className="text-xl font-black text-slate-900">{vendorCompanyName}</h2>
                  )}
                  <p className="text-slate-500 font-semibold text-[10px]">📍 {vendorAddressText} | GSTIN: {vendorGstin}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded uppercase">
                    TAX INVOICE
                  </span>
                  <p className="text-xs font-bold text-emerald-700 mt-1">Inv #: {invoiceForm.invoiceNo}</p>
                  <p className="text-[10px] text-slate-400">Date: {invoiceForm.invoiceDate}</p>
                </div>
              </div>

              {/* Billed To & Shipped To Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Billed To (Customer)</p>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{invoiceForm.customerName}</p>
                  <p className="text-slate-600">{invoiceForm.address}</p>
                  <p className="text-slate-600">{invoiceForm.cityDistrict}, {invoiceForm.state} - {invoiceForm.pincode}</p>
                  <p className="text-slate-500 font-semibold">Ph: {invoiceForm.phone} | State Code: {invoiceForm.stateCode}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Ship To (Site Location)</p>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{invoiceForm.customerName}</p>
                  <p className="text-slate-600">{invoiceForm.address}</p>
                  <p className="text-slate-600">{invoiceForm.cityDistrict}, {invoiceForm.state} - {invoiceForm.pincode}</p>
                  <p className="text-slate-500 font-semibold">Ref PO: {invoiceForm.referenceNo} | System: {invoiceForm.systemCapacityKw} kW</p>
                </div>
              </div>

              {/* Tax Invoice Items Table */}
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-[10px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">Description of Goods</th>
                    <th className="p-2 text-center">HSN/SAC</th>
                    <th className="p-2 text-right">Taxable Value (₹)</th>
                    <th className="p-2 text-center">CGST</th>
                    <th className="p-2 text-center">SGST</th>
                    <th className="p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceForm.items.map((item) => {
                    const itemCgst = item.taxableValue * (item.cgstRate / 100);
                    const itemSgst = item.taxableValue * (item.sgstRate / 100);
                    const itemTotal = item.taxableValue + itemCgst + itemSgst;
                    return (
                      <tr key={item.slNo}>
                        <td className="p-2 text-center font-bold text-slate-500">{item.slNo}</td>
                        <td className="p-2 font-bold text-slate-900">{item.description}</td>
                        <td className="p-2 text-center text-slate-500 font-mono">{item.hsnSac}</td>
                        <td className="p-2 text-right font-semibold">₹{item.taxableValue.toLocaleString()}</td>
                        <td className="p-2 text-center text-slate-600">{item.cgstRate}%</td>
                        <td className="p-2 text-center text-slate-600">{item.sgstRate}%</td>
                        <td className="p-2 text-right font-bold text-slate-900">₹{itemTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Calculation Summary & Bank QR */}
              <div className="grid grid-cols-2 gap-4 items-start pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Bank Payment Details</p>
                  <p className="font-bold text-slate-900">State Bank of India</p>
                  <p className="text-slate-600">A/c Name: {logos.companyName || 'Meta Green Solar Solutions LLP'}</p>
                  <p className="text-slate-600">A/c No: 44513337275 | IFSC: SBIN0012948</p>
                  <p className="text-slate-600">Branch: Pantakalava Road, Vijayawada</p>
                </div>

                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Taxable Subtotal:</span>
                    <span className="font-bold">₹{subtotalTaxable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total CGST:</span>
                    <span>₹{totalCgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total SGST:</span>
                    <span>₹{totalSgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-700 text-sm font-black">
                    <span>Invoice Total:</span>
                    <span className="text-emerald-400">₹{totalInvoiceAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tax Invoice Custom Matter / Terms */}
              {invoiceForm.customMatter && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-600 leading-relaxed font-medium">
                  <span className="font-bold text-slate-900 block text-[9px] uppercase tracking-wider mb-0.5">
                    Declarations & Legal Terms
                  </span>
                  <p className="whitespace-pre-line">{invoiceForm.customMatter}</p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[9px] text-slate-400">
                <p>Mode of Payment: {invoiceForm.modeOfPayment}</p>
                <p className="font-bold text-slate-600">For {logos.companyName || 'META GREEN SOLAR SOLUTIONS LLP'} (Authorized Signatory)</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK ADD WALK-IN CUSTOMER MODAL */}
      {isWalkinModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Quick Add Walk-in Customer
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Saves lead directly to CRM with 'Walk-in' tag</p>
              </div>
              <button 
                onClick={() => setIsWalkinModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddWalkinCustomer} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Full Name *</label>
                <input
                  required
                  type="text"
                  value={walkinData.name}
                  onChange={(e) => setWalkinData({ ...walkinData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Contact *</label>
                  <input
                    required
                    type="text"
                    value={walkinData.phone}
                    onChange={(e) => setWalkinData({ ...walkinData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Capacity (kW)</label>
                  <input
                    type="number"
                    value={walkinData.systemCapacityKw}
                    onChange={(e) => setWalkinData({ ...walkinData, systemCapacityKw: Number(e.target.value) })}
                    className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address *</label>
                <input
                  required
                  type="text"
                  value={walkinData.address}
                  onChange={(e) => setWalkinData({ ...walkinData, address: e.target.value })}
                  placeholder="Door No, Street Name"
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City / District</label>
                  <input
                    type="text"
                    value={walkinData.cityDistrict}
                    onChange={(e) => setWalkinData({ ...walkinData, cityDistrict: e.target.value })}
                    placeholder="Eluru"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={walkinData.state}
                    onChange={(e) => setWalkinData({ ...walkinData, state: e.target.value })}
                    placeholder="Andhra Pradesh"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    value={walkinData.pincode}
                    onChange={(e) => setWalkinData({ ...walkinData, pincode: e.target.value })}
                    placeholder="534467"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkinModalOpen(false)}
                  className="flex-1 px-3 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-emerald-600 text-white text-xs font-extrabold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
                >
                  Save Walk-in Lead & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
