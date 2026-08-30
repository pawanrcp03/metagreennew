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
  Percent, Edit2, Trash2,
  Package, Wrench, Layers, AlertCircle, Eye, X, Check, Filter
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
  const [projects, setProjects] = useState<any[]>([]);
  const [siteConsumptions, setSiteConsumptions] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Project Breakdown Modal
  const [selectedProjectBreakdown, setSelectedProjectBreakdown] = useState<any | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

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
    projectId: '',
    amount: 0,
    type: 'Advance',
    category: 'Income',
    expenseType: 'Material & Hardware Purchase',
    gstEnabled: false,
    notes: ''
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

    const qProjects = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qSiteConsumptions = query(collection(db, 'siteConsumptions'));
    const unsubConsumptions = onSnapshot(qSiteConsumptions, (snapshot) => {
      setSiteConsumptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qInventory = query(collection(db, 'inventory'));
    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { 
      unsubTx(); 
      unsubLoans(); 
      unsubExpTypes(); 
      unsubProjects();
      unsubConsumptions();
      unsubInventory();
    };
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

  // Select project to auto-fill customer and default amount
  const handleSelectProjectForTx = (projId: string) => {
    if (!projId) {
      setNewTx(prev => ({ ...prev, projectId: '', customer: '' }));
      return;
    }
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      const balancePending = Math.max(0, (proj.totalCost || 0) - (proj.amountPaid || 0));
      setNewTx(prev => ({
        ...prev,
        projectId: proj.id,
        customer: proj.customerName,
        amount: prev.amount > 0 ? prev.amount : (balancePending > 0 ? balancePending : (proj.totalCost || 0))
      }));
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gstAmount = newTx.gstEnabled && newTx.category === 'Income' ? newTx.amount * 0.18 : 0;
      if (editingTxId) {
        await updateDoc(doc(db, 'financeTransactions', editingTxId), {
          customer: newTx.customer,
          projectId: newTx.projectId || null,
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
          projectId: newTx.projectId || null,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          expenseType: newTx.category === 'Expense' ? (newTx.expenseType || 'Other Expenses') : null,
          gst: gstAmount,
          status: 'Completed',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          createdAt: serverTimestamp()
        });

        // If income is linked to a project, update the project's amountPaid in real-time
        if (newTx.projectId && newTx.category === 'Income') {
          const proj = projects.find(p => p.id === newTx.projectId);
          if (proj) {
            const currentPaid = proj.amountPaid || 0;
            const updatedPaid = currentPaid + newTx.amount;
            await updateDoc(doc(db, 'projects', newTx.projectId), {
              amountPaid: updatedPaid
            });
          }
        }
      }
      setIsTxModalOpen(false);
      setEditingTxId(null);
      setNewTx({ customer: '', projectId: '', amount: 0, type: 'Advance', category: 'Income', expenseType: 'Material & Hardware Purchase', gstEnabled: false, notes: '' });
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
  const totalInventoryOutCost = siteConsumptions.reduce((sum, sc) => sum + (sc.totalCost || ((sc.consumedQuantity || 0) * (sc.unitPrice || 0))), 0);
  const totalExpenses = transactions.filter(t => t.category === 'Expense' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
  const totalAllCost = totalInventoryOutCost + totalExpenses;
  const totalGST = transactions.filter(t => t.category === 'Income' && t.status === 'Completed').reduce((sum, t) => sum + (t.gst || 0), 0);
  const netProfit = totalRevenue - totalAllCost;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Project-Wise Profit & Loss Calculations
  const projectPLData = projects.map(proj => {
    const contractVal = proj.totalCost || 0;
    const projTxs = transactions.filter(t => 
      t.projectId === proj.id || 
      (t.customer && proj.customerName && t.customer.toLowerCase() === proj.customerName.toLowerCase())
    );
    const incomeTxs = projTxs.filter(t => t.category === 'Income' && t.status === 'Completed');
    const collectedRevenue = incomeTxs.reduce((sum, t) => sum + t.amount, 0) || (proj.amountPaid || 0);

    const consumptions = siteConsumptions.filter(sc => 
      sc.projectId === proj.id || 
      (sc.customerName && proj.customerName && sc.customerName.toLowerCase() === proj.customerName.toLowerCase()) ||
      (sc.projectName && proj.customerName && sc.projectName.toLowerCase().includes(proj.customerName.toLowerCase()))
    );
    const inventoryCost = consumptions.reduce((sum, sc) => sum + (sc.totalCost || ((sc.consumedQuantity || 0) * (sc.unitPrice || 0))), 0);

    const expenseTxs = projTxs.filter(t => t.category === 'Expense' && t.status === 'Completed');
    const directExpenses = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

    const totalCost = inventoryCost + directExpenses;
    const grossProfit = contractVal - totalCost;
    const realizedProfit = collectedRevenue - totalCost;
    const profitMargin = contractVal > 0 ? ((grossProfit / contractVal) * 100).toFixed(1) : '0.0';
    const collectionPct = contractVal > 0 ? Math.min(100, Math.round((collectedRevenue / contractVal) * 100)) : 0;

    return {
      project: proj,
      contractVal,
      collectedRevenue,
      inventoryCost,
      directExpenses,
      totalCost,
      grossProfit,
      realizedProfit,
      profitMargin,
      collectionPct,
      consumptions,
      incomeTxs,
      expenseTxs
    };
  });

  const filteredTx = transactions.filter(t => 
    (t.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.displayId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <IndianRupee className="w-8 h-8 text-emerald-600" /> Finance & Ledger
          </h1>
          <p className="text-slate-500 font-medium mt-1">Project revenue, inventory stock-out cost, Profit & Loss ledger, and customer EMIs</p>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'payments', label: 'Payments & Invoices', icon: Receipt },
          { id: 'profit', label: 'Project-Wise Profit & Loss', icon: TrendingUp },
          { id: 'loans', label: 'Loan & EMI Integration', icon: Landmark },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id 
                ? "bg-emerald-100/80 text-emerald-800 ring-2 ring-emerald-500/20" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PAYMENTS & INVOICES */}
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
              onClick={() => { 
                setNewTx({ customer: '', projectId: '', amount: 0, type: 'Advance', category: 'Income', expenseType: 'Material & Hardware Purchase', gstEnabled: false, notes: '' }); 
                setIsTxModalOpen(true); 
              }}
              className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-emerald-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Customer & Project</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Amount (₹)</th>
                  <th className="p-4 text-right">GST (₹)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.filter(t => t.category === 'Income').map(t => {
                  const linkedProj = projects.find(p => p.id === t.projectId);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{t.displayId || t.id}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{t.date}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        <p className="font-bold text-slate-900">{t.customer}</p>
                        {linkedProj && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 mt-0.5">
                            {linkedProj.capacityKw} kW Solar Project
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
                          t.type === 'Advance' ? "bg-blue-50 text-blue-700 border-blue-100" :
                          t.type === 'Balance' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                          t.type === 'Refund' ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-slate-900">
                        ₹{t.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-500">
                        {t.gst > 0 ? `₹${t.gst?.toLocaleString('en-IN')}` : '-'}
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
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-blue-200 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF Invoice
                          </button>
                          <button onClick={() => { setEditingTxId(t.id); setNewTx({ customer: t.customer, projectId: t.projectId || '', amount: t.amount, type: t.type, category: t.category, expenseType: t.expenseType || 'Material & Hardware Purchase', gstEnabled: t.gst > 0, notes: '' }); setIsTxModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* TAB 2: PROJECT-WISE PROFIT & LOSS (CALCULATED VIA INVENTORY IN/OUT & REVENUE) */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          {/* Executive P&L Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest mb-3">
                <Wallet className="w-4 h-4 text-blue-500" /> Revenue Inflow (Collected)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Customer milestone payments received</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest mb-3">
                <Package className="w-4 h-4 text-amber-500" /> Inventory Out Cost (COGS)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">₹{totalInventoryOutCost.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Panels, Inverters, BOS consumed on site</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest mb-3">
                <Receipt className="w-4 h-4 text-red-500" /> Direct & Operational Expenses
              </div>
              <div className="text-2xl sm:text-3xl font-black text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Labor wages, transport & DISCOM fees</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-3">
                <TrendingUp className="w-4 h-4" /> Net Realized Profit
              </div>
              <div className={cn("text-2xl sm:text-3xl font-black", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                ₹{netProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-600/80 mt-1.5 font-bold uppercase tracking-wider">{margin}% Realized Margin</p>
            </div>
          </div>

          {/* PROJECT-WISE PROFIT & LOSS LEDGER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Project-Wise Profit & Loss Ledger (Based on Inventory In/Out & Payments)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Real-time profit calculated per solar project based on hardware stock-out (COGS) and client milestone receipts.
                </p>
              </div>

              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shrink-0">
                {projects.length} Active Projects
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3.5">Solar Project & Customer</th>
                    <th className="p-3.5 text-right">Contract Value</th>
                    <th className="p-3.5 text-right">Revenue Inflow</th>
                    <th className="p-3.5 text-right">Inventory Stock-Out (COGS)</th>
                    <th className="p-3.5 text-right">Direct Expenses</th>
                    <th className="p-3.5 text-right">Total Cost</th>
                    <th className="p-3.5 text-right">Projected Profit</th>
                    <th className="p-3.5 text-center">Margin %</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {projectPLData.map((pl, idx) => (
                    <tr key={pl.project.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-black text-slate-900 text-sm">{pl.project.customerName}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-bold text-amber-700">{pl.project.capacityKw} kW Solar</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{pl.project.status || 'In Process'}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-black text-slate-900">
                        ₹{pl.contractVal.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right">
                        <span className="font-bold text-emerald-700">₹{pl.collectedRevenue.toLocaleString('en-IN')}</span>
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pl.collectionPct}%` }} />
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-bold text-amber-700">
                        ₹{pl.inventoryCost.toLocaleString('en-IN')}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {pl.consumptions.length} SKU(s) Dispatched
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-600">
                        ₹{pl.directExpenses.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right font-bold text-red-600">
                        ₹{pl.totalCost.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right font-black">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md font-extrabold",
                          pl.grossProfit >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                        )}>
                          {pl.grossProfit >= 0 ? '+' : ''}₹{pl.grossProfit.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={cn(
                          "font-black text-xs px-2 py-0.5 rounded-md",
                          Number(pl.profitMargin) >= 20 ? "text-emerald-700 bg-emerald-100" :
                          Number(pl.profitMargin) >= 10 ? "text-blue-700 bg-blue-100" : "text-amber-700 bg-amber-100"
                        )}>
                          {pl.profitMargin}%
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedProjectBreakdown(pl);
                            setIsBreakdownModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 mx-auto cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3 h-3" /> Breakdown
                        </button>
                      </td>
                    </tr>
                  ))}

                  {projectPLData.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                        No projects created yet. Create a project in Projects / CRM to see live profit & loss calculations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GENERAL EXPENSE LOG SECTION */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Direct & Operating Expense Log</h3>
                <p className="text-xs text-slate-500">Record wages, shipping, permissions & overhead expenses</p>
              </div>
              <button 
                onClick={() => { setNewTx({ customer: '', projectId: '', amount: 0, type: 'Expense', category: 'Expense', expenseType: 'Material & Hardware Purchase', gstEnabled: false, notes: '' }); setIsTxModalOpen(true); }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>

            <div className="space-y-3">
              {transactions.filter(t => t.category === 'Expense').map(t => {
                const linkedProj = projects.find(p => p.id === t.projectId);

                return (
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
                          {linkedProj && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Project: {linkedProj.customerName}
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
                        <button onClick={() => { setEditingTxId(t.id); setNewTx({ customer: t.customer, projectId: t.projectId || '', amount: t.amount, type: t.type, category: t.category, expenseType: t.expenseType || 'Material & Hardware Purchase', gstEnabled: t.gst > 0, notes: '' }); setIsTxModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-red-600">-₹{t.amount?.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paid</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {transactions.filter(t => t.category === 'Expense').length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">No expenses recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOANS & EMIs */}
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
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> New Loan App
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loans.map(loan => (
                  <div key={loan.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingLoanId(loan.id); setNewLoan({ customer: loan.customer, bank: loan.bank, amount: loan.amount, tenure: loan.tenure }); setIsLoanModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteLoan(loan.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100 cursor-pointer" title="Delete">
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
                        <div className="text-xl font-black text-slate-900">₹{loan.amount?.toLocaleString('en-IN')}</div>
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
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
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

      {/* RECORD PAYMENT / EXPENSE MODAL */}
      {isTxModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => { setIsTxModalOpen(false); setEditingTxId(null); }}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky Header with Prominent Close Button */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black", newTx.category === 'Income' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                  {newTx.category === 'Income' ? <Wallet className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingTxId ? 'Edit Entry' : newTx.category === 'Income' ? 'Record Customer Payment' : 'Record Project / Overhead Expense'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Link transaction to solar projects and customer ledger</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setIsTxModalOpen(false); setEditingTxId(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              {/* Select Project / Customer Dropdown */}
              {newTx.category === 'Income' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Solar Project / Customer *
                  </label>
                  {projects.length > 0 ? (
                    <select
                      value={newTx.projectId}
                      onChange={e => handleSelectProjectForTx(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="">-- Choose Existing Solar Project --</option>
                      {projects.map(p => {
                        const balance = Math.max(0, (p.totalCost || 0) - (p.amountPaid || 0));
                        return (
                          <option key={p.id} value={p.id}>
                            {p.customerName} • {p.capacityKw} kW (Total: ₹{(p.totalCost || 0).toLocaleString()} | Balance: ₹{balance.toLocaleString()})
                          </option>
                        );
                      })}
                    </select>
                  ) : null}

                  <div className="mt-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Or Customer Name (Direct input):</label>
                    <input 
                      required 
                      type="text" 
                      value={newTx.customer} 
                      onChange={e => setNewTx({...newTx, customer: e.target.value})} 
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Link to Project (Optional)
                  </label>
                  <select
                    value={newTx.projectId}
                    onChange={e => {
                      const pid = e.target.value;
                      const found = projects.find(p => p.id === pid);
                      setNewTx(prev => ({
                        ...prev,
                        projectId: pid,
                        customer: found ? `${found.customerName} (Site Expense)` : prev.customer
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white mb-2"
                  >
                    <option value="">-- General / Overhead Business Expense --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        Project: {p.customerName} ({p.capacityKw} kW)
                      </option>
                    ))}
                  </select>

                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vendor / Payee / Description *
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={newTx.customer} 
                    onChange={e => setNewTx({...newTx, customer: e.target.value})} 
                    placeholder="e.g. Havells Cables Ltd / Site Labor Contractor"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500" 
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={newTx.amount || ''} 
                    onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} 
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-emerald-700 outline-none focus:border-emerald-500" 
                  />
                </div>

                {newTx.category === 'Income' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Stage / Type</label>
                    <select 
                      value={newTx.type} 
                      onChange={e => setNewTx({...newTx, type: e.target.value})} 
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-emerald-500"
                    >
                      <option value="Advance">Advance (Signing)</option>
                      <option value="Material Delivery">Material Delivery (Milestone)</option>
                      <option value="Installation Complete">Installation Complete</option>
                      <option value="Net Metering / Subsidy">Net Metering / Subsidy</option>
                      <option value="Balance">Final Balance</option>
                      <option value="EMI">EMI</option>
                      <option value="Refund">Refund</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Expense Type *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewExpenseType(!isAddingNewExpenseType)}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {isAddingNewExpenseType ? 'Cancel' : '+ New Type'}
                      </button>
                    </div>

                    {isAddingNewExpenseType ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customExpenseTypeInput}
                          onChange={e => setCustomExpenseTypeInput(e.target.value)}
                          placeholder="New category..."
                          className="flex-1 px-2.5 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddExpenseType}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={newTx.expenseType || expenseTypes[0]}
                        onChange={e => setNewTx({...newTx, expenseType: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-emerald-500"
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
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="gst" 
                    checked={newTx.gstEnabled} 
                    onChange={e => setNewTx({...newTx, gstEnabled: e.target.checked})} 
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" 
                  />
                  <label htmlFor="gst" className="text-xs font-bold text-slate-700 cursor-pointer">Include GST (18% Statutory Invoice Tax)</label>
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-slate-100 shrink-0">
                <button 
                  type="button" 
                  onClick={() => { setIsTxModalOpen(false); setEditingTxId(null); }} 
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT FINANCIAL & INVENTORY BREAKDOWN MODAL */}
      {isBreakdownModalOpen && selectedProjectBreakdown && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsBreakdownModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black">{selectedProjectBreakdown.project.customerName} - Financial Breakdown</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{selectedProjectBreakdown.project.capacityKw} kW Solar • Total Contract ₹{selectedProjectBreakdown.contractVal.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-black text-xs transition-all shadow-xs border border-red-500/30 hover:border-red-500 cursor-pointer shrink-0"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Top Financial Health KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Contract Value</p>
                  <p className="text-lg font-black text-emerald-950">₹{selectedProjectBreakdown.contractVal.toLocaleString('en-IN')}</p>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Hardware Stock-Out</p>
                  <p className="text-lg font-black text-amber-950">₹{selectedProjectBreakdown.inventoryCost.toLocaleString('en-IN')}</p>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Net Profit & Margin</p>
                  <p className="text-lg font-black text-blue-950">₹{selectedProjectBreakdown.grossProfit.toLocaleString('en-IN')} <span className="text-xs font-bold">({selectedProjectBreakdown.profitMargin}%)</span></p>
                </div>
              </div>

              {/* Itemized Materials Consumed from Inventory */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  1. Inventory Hardware Stock-Out (Cost of Goods Sold)
                </h4>

                {selectedProjectBreakdown.consumptions.length === 0 ? (
                  <p className="text-slate-400 p-4 border border-dashed rounded-xl text-center">
                    No warehouse stock outward items logged yet. When technicians record component usage in Inventory, items appear here automatically.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Component SKU</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5 text-center">Quantity</th>
                          <th className="p-2.5 text-right">Unit Rate</th>
                          <th className="p-2.5 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedProjectBreakdown.consumptions.map((c: any, i: number) => (
                          <tr key={c.id || i}>
                            <td className="p-2.5 font-bold text-slate-900">{c.itemName}</td>
                            <td className="p-2.5 text-slate-500">{c.category}</td>
                            <td className="p-2.5 text-center font-bold">{c.consumedQuantity} {c.unit}</td>
                            <td className="p-2.5 text-right text-slate-600">₹{(c.unitPrice || 0).toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right font-black text-amber-700">₹{(c.totalCost || (c.consumedQuantity * (c.unitPrice || 0))).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Customer Milestone Payments Log */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  2. Customer Payments & Milestone Inflows
                </h4>

                {selectedProjectBreakdown.incomeTxs.length === 0 ? (
                  <p className="text-slate-400 p-4 border border-dashed rounded-xl text-center">
                    No milestone payment receipts recorded yet for this project.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Milestone / Stage</th>
                          <th className="p-2.5 text-right">Amount (₹)</th>
                          <th className="p-2.5 text-right">GST (₹)</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedProjectBreakdown.incomeTxs.map((t: any) => (
                          <tr key={t.id}>
                            <td className="p-2.5 text-slate-600">{t.date}</td>
                            <td className="p-2.5 font-bold text-slate-900">{t.type}</td>
                            <td className="p-2.5 text-right font-black text-emerald-700">₹{t.amount.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right text-slate-500">{t.gst > 0 ? `₹${t.gst.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Completed</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOAN MODAL */}
      {isLoanModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => { setIsLoanModalOpen(false); setEditingLoanId(null); }}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Initiate Loan Application</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setIsLoanModalOpen(false); setEditingLoanId(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitLoan} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Project *</label>
                {projects.length > 0 ? (
                  <select
                    onChange={e => {
                      const found = projects.find(p => p.id === e.target.value);
                      if (found) {
                        setNewLoan(prev => ({
                          ...prev,
                          customer: found.customerName,
                          amount: found.totalCost || prev.amount
                        }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-indigo-500 mb-2"
                  >
                    <option value="">-- Select from Existing Projects --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.customerName} • {p.capacityKw} kW (₹{(p.totalCost || 0).toLocaleString()})</option>
                    ))}
                  </select>
                ) : null}

                <input required type="text" value={newLoan.customer} onChange={e => setNewLoan({...newLoan, customer: e.target.value})} placeholder="Customer Name..." className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Financial Partner *</label>
                <select value={newLoan.bank} onChange={e => setNewLoan({...newLoan, bank: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-indigo-500">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loan Amount (₹) *</label>
                  <input required type="number" min="10000" value={newLoan.amount || ''} onChange={e => setNewLoan({...newLoan, amount: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-indigo-700 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tenure (Months) *</label>
                  <select value={newLoan.tenure} onChange={e => setNewLoan({...newLoan, tenure: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-indigo-500">
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                    <option value={36}>36 Months</option>
                    <option value={48}>48 Months</option>
                    <option value={60}>60 Months</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => { setIsLoanModalOpen(false); setEditingLoanId(null); }} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer">Submit Eligibility Check</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE PDF MODAL */}
      {isInvoiceModalOpen && selectedTxForInvoice && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsInvoiceModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> Select PDF Invoice Format
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generate PDF matching customer & DISCOM requirements
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-black text-xs transition-all shadow-xs border border-red-500/30 hover:border-red-500 cursor-pointer shrink-0"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer / Tx Details</p>
                <p className="text-sm font-black text-slate-900">{selectedTxForInvoice.customer}</p>
                <p className="text-xs text-slate-600">
                  Amount: <span className="font-bold text-emerald-700">₹{selectedTxForInvoice.amount?.toLocaleString('en-IN')}</span> ({selectedTxForInvoice.type})
                </p>
              </div>

              {/* Template Option 1 */}
              <button
                onClick={() => handleDownloadInvoice(selectedTxForInvoice, 'commercial')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group flex items-start gap-3 cursor-pointer"
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
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group flex items-start gap-3 cursor-pointer"
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
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group flex items-start gap-3 cursor-pointer"
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
