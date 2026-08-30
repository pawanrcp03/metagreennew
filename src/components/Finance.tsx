import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Receipt, 
  FileText, 
  TrendingUp, 
  Building, 
  Calculator, 
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wallet,
  PieChart,
  Landmark,
  Percent, Edit2, Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { downloadInvoicePDF, InvoiceData, InvoiceType } from '@/src/services/invoiceGenerator.service';
import { useLogos } from '@/src/context/LogoContext';

export default function Finance() {
  const [activeTab, setActiveTab] = useState<'payments' | 'profit' | 'loans'>('payments');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { logos } = useLogos();
  const [selectedTxForInvoice, setSelectedTxForInvoice] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleDownloadInvoice = (tx: any, templateType: InvoiceType) => {
    const invData: InvoiceData = {
      invoiceType: templateType,
      invoiceNo: tx.displayId ? tx.displayId.replace('TX-', '') : '000001',
      invoiceDate: tx.date || new Date().toISOString().split('T')[0],
      referenceNo: `REF-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      modeOfPayment: tx.type || 'Cash / UPI',
      shipTo: {
        name: tx.customer || 'UYYURU NAGESWARARAO',
        address: '2-201, Shivalayam Street, T.Narasapuram',
        cityDistrict: 'Eluru',
        state: 'Andhra Pradesh',
        stateCode: '37',
        pincode: '534467',
        phone: '7095784875'
      },
      billTo: {
        name: tx.customer || 'UYYURU NAGESWARARAO',
        address: '2-201, Shivalayam Street, T.Narasapuram',
        cityDistrict: 'Eluru',
        state: 'Andhra Pradesh',
        stateCode: '37',
        pincode: '534467',
        phone: '7095784875'
      },
      items: [
        {
          slNo: 1,
          description: 'Vikram Solar Panels 550w+ M10 Bifacial G2G HC DCR (3 KW)',
          quantity: 1,
          capacity: 'GroWatt TL-X2 (Pro) On Grid Tied Solar Invertor',
          amount: tx.amount || 215000,
          hsnSac: '85414300',
          rateInclTax: 116666.67,
          rate: 104166.67,
          unit: 'kwp',
          taxableValue: (tx.amount || 215000) / 1.05,
          cgstRate: 2.5,
          cgstAmount: ((tx.amount || 215000) / 1.05) * 0.025,
          sgstRate: 2.5,
          sgstAmount: ((tx.amount || 215000) / 1.05) * 0.025
        }
      ],
      systemCapacityKw: 3,
      totalAmount: tx.amount || 215000,
      companyDetails: {
        name: logos.companyName || 'SOLAR HUT SOLUTIONS LLP',
        logoPath: logos.companyLogo,
        stampPath: logos.officialSeal
      },
      bankDetails: {
        bankName: 'State Bank of India',
        accountName: 'Solar Hut Solutions LLP',
        accountNumber: '44513337275',
        ifsc: 'SBIN0012948',
        branch: 'Pantakalava Road, Vijayawada.',
        qrCodePath: logos.paymentQrCode
      }
    };

    downloadInvoicePDF(invData);
    setIsInvoiceModalOpen(false);
  };

  // Forms State
  const [newTx, setNewTx] = useState({
    customer: '',
    amount: 0,
    type: 'Advance',
    category: 'Income',
    expenseType: 'Material & Hardware Purchase',
    gstEnabled: false
  });

  const [expenseTypes, setExpenseTypes] = useState<string[]>([
    'Material & Hardware Purchase',
    'Labor & Installation Wages',
    'Logistics & Transport',
    'DISCOM Application Fees',
    'Marketing & Customer Acquisition',
    'Office Rent & Utilities',
    'Equipment Repair & Maintenance',
    'Civil & Foundation Work',
    'Vendor Advance Payment',
    'Other Expenses'
  ]);

  const [isAddingNewExpenseType, setIsAddingNewExpenseType] = useState(false);
  const [customExpenseTypeInput, setCustomExpenseTypeInput] = useState('');

  const [newLoan, setNewLoan] = useState({
    customer: '',
    bank: 'SBI',
    amount: 0,
    tenure: 60
  });

  // EMI Calculator State
  const [emiCalc, setEmiCalc] = useState({ principal: 200000, rate: 8.5, tenure: 60 });
  const [emiResult, setEmiResult] = useState(0);

  useEffect(() => {
    // Calculate EMI whenever inputs change
    const P = emiCalc.principal;
    const R = (emiCalc.rate / 12) / 100;
    const N = emiCalc.tenure;
    if (P > 0 && R > 0 && N > 0) {
      const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
      setEmiResult(Math.round(emi));
    } else {
      setEmiResult(0);
    }
  }, [emiCalc]);

  useEffect(() => {
    const qTx = query(collection(db, 'financeTransactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qLoans = query(collection(db, 'financeLoans'), orderBy('date', 'desc'));
    const unsubLoans = onSnapshot(qLoans, (snapshot) => {
      setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qExpenseTypes = query(collection(db, 'financeExpenseTypes'), orderBy('name', 'asc'));
    const unsubExpTypes = onSnapshot(qExpenseTypes, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(d => d.data().name as string);
        setExpenseTypes(prev => Array.from(new Set([...prev, ...fetched])));
      }
    });

    return () => { unsubTx(); unsubLoans(); unsubExpTypes(); };
  }, []);

  const handleAddExpenseType = async () => {
    if (!customExpenseTypeInput.trim()) return;
    const trimmed = customExpenseTypeInput.trim();
    try {
      await addDoc(collection(db, 'financeExpenseTypes'), {
        name: trimmed,
        createdAt: serverTimestamp()
      });
      setExpenseTypes(prev => Array.from(new Set([...prev, trimmed])));
      setNewTx(prev => ({ ...prev, expenseType: trimmed }));
      setCustomExpenseTypeInput('');
      setIsAddingNewExpenseType(false);
    } catch (err) {
      console.error('Error adding expense type:', err);
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gstAmount = newTx.gstEnabled && newTx.category === 'Income' ? newTx.amount * 0.18 : 0;
      if (editingTxId) {
        await updateDoc(doc(db, 'financeTransactions', editingTxId), {
          customer: newTx.customer,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          expenseType: newTx.category === 'Expense' ? (newTx.expenseType || 'Other Expenses') : null,
          gst: gstAmount,
        });
      } else {
        const newId = `TX-2026-${String(transactions.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'financeTransactions'), {
          displayId: newId,
          customer: newTx.customer,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          expenseType: newTx.category === 'Expense' ? (newTx.expenseType || 'Other Expenses') : null,
          gst: gstAmount,
          status: 'Completed',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          createdAt: serverTimestamp()
        });
      }
      setIsTxModalOpen(false);
      setEditingTxId(null);
      setNewTx({ customer: '', amount: 0, type: 'Advance', category: 'Income', expenseType: 'Material & Hardware Purchase', gstEnabled: false });
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteDoc(doc(db, 'financeTransactions', id));
      } catch (err) {
        console.error('Error deleting transaction:', err);
      }
    }
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const type = ['SBI', 'HDFC', 'ICICI'].includes(newLoan.bank) ? 'Bank' : 'NBFC';
      if (editingLoanId) {
        await updateDoc(doc(db, 'financeLoans', editingLoanId), {
          customer: newLoan.customer,
          bank: newLoan.bank,
          type: type,
          amount: newLoan.amount,
          tenure: newLoan.tenure,
        });
      } else {
        const newId = `LN-2026-${String(loans.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'financeLoans'), {
          displayId: newId,
          customer: newLoan.customer,
          bank: newLoan.bank,
          type: type,
          amount: newLoan.amount,
          tenure: newLoan.tenure,
          status: 'Eligibility Check',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          createdAt: serverTimestamp()
        });
      }
      setIsLoanModalOpen(false);
      setEditingLoanId(null);
      setNewLoan({ customer: '', bank: 'SBI', amount: 0, tenure: 60 });
    } catch (err) {
      console.error('Error saving loan:', err);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this loan?")) {
      try {
        await deleteDoc(doc(db, 'financeLoans', id));
      } catch (err) {
        console.error('Error deleting loan:', err);
      }
    }
  };

  // Profit Calculations
  const totalRevenue = transactions.filter(t => t.category === 'Income' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.category === 'Expense' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
  const totalGST = transactions.filter(t => t.category === 'Income' && t.status === 'Completed').reduce((sum, t) => sum + (t.gst || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const filteredTx = transactions.filter(t => 
    t.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.displayId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <IndianRupee className="w-8 h-8 text-emerald-600" /> Finance & Loans
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage payments, invoices, expenses, and customer EMIs</p>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'payments', label: 'Payments & Invoices', icon: Receipt },
          { id: 'profit', label: 'Profit Analysis', icon: TrendingUp },
          { id: 'loans', label: 'Loan & EMI Integration', icon: Landmark },
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

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-96 flex items-center">
              <Search className="w-5 h-5 absolute left-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search payments & invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
            <button 
              onClick={() => { setNewTx({...newTx, category: 'Income'}); setIsTxModalOpen(true); }}
              className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-emerald-200"
            >
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Amount (₹)</th>
                  <th className="p-4 text-right">GST (₹)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.filter(t => t.category === 'Income').map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{t.displayId || t.id}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.date}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{t.customer}</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
                        t.type === 'Advance' ? "bg-blue-50 text-blue-700 border-blue-100" :
                        t.type === 'Balance' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                        t.type === 'Refund' ? "bg-red-50 text-red-700 border-red-100" :
                        "bg-emerald-50 text-emerald-700 border-emerald-100" // EMI
                      )}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-900">
                      ₹{t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-medium text-slate-500">
                      {t.gst > 0 ? `₹${t.gst.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-4">
                      {t.status === 'Completed' 
                        ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-4 h-4"/> Completed</span>
                        : <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600"><Clock className="w-4 h-4"/> Pending</span>
                      }
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedTxForInvoice(t); setIsInvoiceModalOpen(true); }}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-blue-200"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF Invoice
                        </button>
                        <button onClick={() => { setEditingTxId(t.id); setNewTx({ customer: t.customer, amount: t.amount, type: t.type, category: t.category, gstEnabled: t.gst > 0 }); setIsTxModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTx.filter(t => t.category === 'Income').length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">
                <Wallet className="w-5 h-5 text-blue-500" /> Total Revenue
              </div>
              <div className="text-3xl font-black text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Excluding GST</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">
                <Receipt className="w-5 h-5 text-red-500" /> Total Expenses
              </div>
              <div className="text-3xl font-black text-slate-900">₹{totalExpenses.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Operations & Procurement</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">
                <TrendingUp className="w-5 h-5" /> Net Profit
              </div>
              <div className="text-3xl font-black text-emerald-600">₹{netProfit.toLocaleString('en-IN')}</div>
              <p className="text-xs text-emerald-600/70 mt-2 font-bold uppercase tracking-wider">{margin}% Margin</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">
                <FileText className="w-5 h-5 text-indigo-500" /> GST Collected
              </div>
              <div className="text-3xl font-black text-slate-900">₹{totalGST.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Tax Liability</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Expense Log</h3>
              <button 
                onClick={() => { setNewTx({...newTx, category: 'Expense', type: 'Expense', gstEnabled: false}); setIsTxModalOpen(true); }}
                className="text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>
            <div className="space-y-3">
              {transactions.filter(t => t.category === 'Expense').map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50 group">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Receipt className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{t.customer}</h4>
                        {t.expenseType && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                            {t.expenseType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-1">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.date}</span>
                        <span className="font-bold uppercase tracking-wider">{t.displayId || t.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingTxId(t.id); setNewTx({ customer: t.customer, amount: t.amount, type: t.type, category: t.category, gstEnabled: t.gst > 0 }); setIsTxModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-red-600">-₹{t.amount.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paid</div>
                    </div>
                  </div>
                </div>
              ))}
              {transactions.filter(t => t.category === 'Expense').length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">No expenses recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* EMI Calculator */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-500" /> EMI Calculator
              </h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <label>Loan Amount (₹)</label>
                    <span>₹{emiCalc.principal.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range" min="50000" max="1000000" step="10000"
                    value={emiCalc.principal} onChange={e => setEmiCalc({...emiCalc, principal: Number(e.target.value)})}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <label>Interest Rate (%)</label>
                    <span>{emiCalc.rate}%</span>
                  </div>
                  <input 
                    type="range" min="5" max="15" step="0.1"
                    value={emiCalc.rate} onChange={e => setEmiCalc({...emiCalc, rate: Number(e.target.value)})}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <label>Tenure (Months)</label>
                    <span>{emiCalc.tenure} mo</span>
                  </div>
                  <input 
                    type="range" min="12" max="120" step="6"
                    value={emiCalc.tenure} onChange={e => setEmiCalc({...emiCalc, tenure: Number(e.target.value)})}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div className="pt-6 border-t border-slate-100 text-center">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly EMI</div>
                  <div className="text-4xl font-black text-indigo-600">₹{emiResult.toLocaleString('en-IN')}</div>
                  <div className="text-xs font-bold text-slate-400 mt-3 flex items-center justify-center gap-1">
                    Total Interest: ₹{(emiResult * emiCalc.tenure - emiCalc.principal).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Applications */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="font-bold text-slate-700 px-2">Financing Partners</div>
                <button 
                  onClick={() => setIsLoanModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-indigo-200"
                >
                  <Plus className="w-4 h-4" /> New Loan App
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loans.map(loan => (
                  <div key={loan.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingLoanId(loan.id); setNewLoan({ customer: loan.customer, bank: loan.bank, amount: loan.amount, tenure: loan.tenure }); setIsLoanModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteLoan(loan.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-start mb-4 pr-16">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{loan.customer}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{loan.displayId || loan.id}</div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
                        loan.type === 'Bank' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"
                      )}>
                        {loan.bank}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-end mb-5">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                        <div className="text-xl font-black text-slate-900">₹{loan.amount.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tenure</div>
                        <div className="text-sm font-black text-slate-700">{loan.tenure} mo</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "flex items-center gap-1.5 text-xs font-bold",
                          loan.status === 'Disbursed' ? "text-emerald-600" :
                          loan.status === 'Approved' ? "text-blue-600" :
                          "text-amber-600"
                        )}>
                          {loan.status === 'Disbursed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          {loan.status}
                        </span>
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {newTx.category === 'Income' ? 'Record Payment' : 'Record Expense'}
              </h3>
              <button onClick={() => {setIsTxModalOpen(false); setEditingTxId(null); setNewTx({ customer: '', amount: 0, type: 'Advance', category: 'Income', gstEnabled: false });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {newTx.category === 'Income' ? 'Customer Name' : 'Vendor / Description'}
                </label>
                <input required type="text" value={newTx.customer} onChange={e => setNewTx({...newTx, customer: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input required type="number" min="1" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                {newTx.category === 'Income' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
                    <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                      <option value="Advance">Advance</option>
                      <option value="Balance">Balance</option>
                      <option value="EMI">EMI</option>
                      <option value="Refund">Refund</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">Expense Type *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewExpenseType(!isAddingNewExpenseType)}
                        className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {isAddingNewExpenseType ? 'Cancel' : '+ Add New Type'}
                      </button>
                    </div>

                    {isAddingNewExpenseType ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customExpenseTypeInput}
                          onChange={e => setCustomExpenseTypeInput(e.target.value)}
                          placeholder="Enter new expense type..."
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddExpenseType}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={newTx.expenseType || expenseTypes[0]}
                        onChange={e => setNewTx({...newTx, expenseType: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-bold"
                      >
                        {expenseTypes.map((et, idx) => (
                          <option key={idx} value={et}>{et}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
              
              {newTx.category === 'Income' && (
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="gst" checked={newTx.gstEnabled} onChange={e => setNewTx({...newTx, gstEnabled: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                  <label htmlFor="gst" className="text-sm font-medium text-slate-700">Include GST (18%)</label>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsTxModalOpen(false); setEditingTxId(null); setNewTx({ customer: '', amount: 0, type: 'Advance', category: 'Income', gstEnabled: false });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Initiate Loan Application</h3>
              <button onClick={() => {setIsLoanModalOpen(false); setEditingLoanId(null); setNewLoan({ customer: '', bank: 'SBI', amount: 0, tenure: 60 });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitLoan} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                <input required type="text" value={newLoan.customer} onChange={e => setNewLoan({...newLoan, customer: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Financial Partner</label>
                <select value={newLoan.bank} onChange={e => setNewLoan({...newLoan, bank: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                  <optgroup label="Banks">
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                  </optgroup>
                  <optgroup label="NBFCs">
                    <option value="Bajaj Finserv">Bajaj Finserv</option>
                    <option value="Tata Capital">Tata Capital</option>
                    <option value="Muthoot">Muthoot Finance</option>
                  </optgroup>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loan Amount (₹)</label>
                  <input required type="number" min="10000" value={newLoan.amount || ''} onChange={e => setNewLoan({...newLoan, amount: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (Months)</label>
                  <select value={newLoan.tenure} onChange={e => setNewLoan({...newLoan, tenure: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                    <option value={36}>36 Months</option>
                    <option value={48}>48 Months</option>
                    <option value={60}>60 Months</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsLoanModalOpen(false); setEditingLoanId(null); setNewLoan({ customer: '', bank: 'SBI', amount: 0, tenure: 60 });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Submit Eligibility Check</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice PDF Template Selection Modal */}
      {isInvoiceModalOpen && selectedTxForInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" /> Select PDF Invoice Format
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate PDF matching customer & DISCOM requirements
                </p>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <div className="p-6 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer / Tx Details</p>
                <p className="text-sm font-black text-slate-900">{selectedTxForInvoice.customer}</p>
                <p className="text-xs text-slate-600">
                  Amount: <span className="font-bold text-emerald-700">₹{selectedTxForInvoice.amount.toLocaleString('en-IN')}</span> ({selectedTxForInvoice.type})
                </p>
              </div>

              {/* Template Option 1 */}
              <button
                onClick={() => handleDownloadInvoice(selectedTxForInvoice, 'commercial')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group flex items-start gap-3"
              >
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
                    1. Standard Commercial Invoice (PDF Format 1)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Includes company logo, customer ship-to/bill-to, bank details, SBI Scan & Pay QR box & terms.
                  </p>
                </div>
              </button>

              {/* Template Option 2 */}
              <button
                onClick={() => handleDownloadInvoice(selectedTxForInvoice, 'itemized_tax_invoice')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group flex items-start gap-3"
              >
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
                    2. Statutory Itemized Tax Invoice (PDF Format 2)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full statutory form layout with HSN/SAC code breakdown, CGST/SGST tax grid & amount in words.
                  </p>
                </div>
              </button>

              {/* Template Option 3 */}
              <button
                onClick={() => handleDownloadInvoice(selectedTxForInvoice, 'solar_7030_tax_invoice')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group flex items-start gap-3"
              >
                <div className="p-2.5 bg-purple-100 text-purple-800 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
                    3. 70:30 Solar RTS Tax Invoice (PDF Format 3)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Splits plant cost into 70% Solar Goods (@ 5% GST) and 30% Services/Labor (@ 18% GST).
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
