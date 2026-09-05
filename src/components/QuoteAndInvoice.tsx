import React, { useState } from 'react';
import { Sparkles, Calculator, Receipt, FileText } from 'lucide-react';
import ProposalGenerator from './ProposalGenerator';
import QuotationBuilder from './QuotationBuilder';
import InvoiceBuilder from './InvoiceBuilder';
import TaxInvoiceGenerator from './TaxInvoiceGenerator';
import { cn } from '@/src/lib/utils';

export default function QuoteAndInvoice({ initialSubTab }: { initialSubTab?: 'proposal' | 'quotation' | 'invoice' | 'tax-invoice' }) {
  const [activeSubTab, setActiveSubTab] = useState<'proposal' | 'quotation' | 'invoice' | 'tax-invoice'>(initialSubTab || 'quotation');

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Top Document Tool Switcher Sub-Header Bar */}
      <div className="bg-slate-900 text-white p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-slate-900/10">
        <div className="flex items-center gap-2 pl-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">Quote & Invoice Hub</h2>
            <p className="text-[10px] text-slate-400 font-medium">Proposal, Quotation/Estimate, Commercial Invoice & GST Tax Invoice Generators</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('proposal')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0",
              activeSubTab === 'proposal'
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span>Proposal Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('quotation')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0",
              activeSubTab === 'quotation'
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Calculator className="w-4 h-4" />
            <span>Estimate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('invoice')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0",
              activeSubTab === 'invoice'
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tax-invoice')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0",
              activeSubTab === 'tax-invoice'
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Receipt className="w-4 h-4" />
            <span>Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Render Active View with Side-by-Side Editor & View */}
      {activeSubTab === 'proposal' && <ProposalGenerator />}
      {activeSubTab === 'quotation' && <QuotationBuilder />}
      {activeSubTab === 'invoice' && <InvoiceBuilder />}
      {activeSubTab === 'tax-invoice' && <TaxInvoiceGenerator />}
    </div>
  );
}
