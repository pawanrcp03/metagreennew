import React, { useState } from 'react';
import { ShoppingCart, Package, Store } from 'lucide-react';
import Procurement from './Procurement';
import Inventory from './Inventory';
import VendorPortal from './VendorPortal';
import { cn } from '@/src/lib/utils';

export default function InventoryAndPO({ initialTab = 'po' }: { initialTab?: 'po' | 'inventory' | 'vendors' }) {
  const [activeSubTab, setActiveSubTab] = useState<'po' | 'inventory' | 'vendors'>(initialTab);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation Sub-Header Bar */}
      <div className="bg-slate-900 text-white p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-slate-900/10">
        <div className="flex items-center gap-2 pl-2">
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">Inventory & PO Hub</h2>
            <p className="text-[10px] text-slate-400 font-medium">Create PO/RFQ first, send to vendor, accept PO, & receive auto-stock to inventory</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('po')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
              activeSubTab === 'po'
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>1. Purchase Orders (PO First)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('inventory')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
              activeSubTab === 'inventory'
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Package className="w-4 h-4" />
            <span>2. Inventory Stock Control</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('vendors')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
              activeSubTab === 'vendors'
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Store className="w-4 h-4" />
            <span>3. Registered Vendors</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeSubTab === 'po' && <Procurement />}
      {activeSubTab === 'inventory' && <Inventory />}
      {activeSubTab === 'vendors' && <VendorPortal />}
    </div>
  );
}

