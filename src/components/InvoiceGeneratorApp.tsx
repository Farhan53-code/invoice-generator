import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { 
  fetchInvoices, 
  addInvoice, 
  deleteInvoice, 
  updateInvoice,
  addAuditLog,
  type InvoiceRecord
} from "../utils/db";
import { 
  Plus, 
  FileText, 
  Trash2, 
  Printer, 
  RefreshCw, 
  Check, 
  Eye, 
  ChevronRight, 
  User, 
  DollarSign, 
  Percent, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  X
} from "lucide-react";

export default function InvoiceGeneratorApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  
  // Custom delete confirmation modal state
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; invoiceNumber: string } | null>(null);
  
  // Create / Edit Form State
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<InvoiceRecord | null>(null);
  
  // Invoice form fields
  const [clientName, setClientName] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  
  // Dynamic Item Fields
  const [items, setItems] = useState<{ id: string; description: string; quantity: number; rate: number }[]>([
    { id: "1", description: "Design Consulting Services", quantity: 1, rate: 150 }
  ]);

  // Load Invoices
  const loadData = async (uid: string) => {
    try {
      const list = await fetchInvoices(uid);
      setInvoices(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadData(currentUser.uid);
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddItem = () => {
    setItems(prev => [...prev, { id: Date.now().toString(), description: "", quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: "description" | "quantity" | "rate", value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
    const totalAmount = subtotal - discountAmount + taxAmount;

    const record: Omit<InvoiceRecord, "id"> = {
      userId: user.uid,
      clientName,
      clientEmail,
      invoiceNumber,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      currency,
      subtotal,
      taxRate,
      discountRate: discount,
      totalAmount,
      status: "Draft",
      items: items.map(it => ({ description: it.description, quantity: it.quantity, price: it.rate })),
      isDeleted: false,
      createdDate: new Date().toISOString()
    };

    try {
      await addInvoice(record);
      await loadData(user.uid);
      
      // Reset
      setShowForm(false);
      setClientName("");
      setClientEmail("");
      setInvoiceNumber("");
      setIssueDate("");
      setDueDate("");
      setTaxRate(0);
      setDiscount(0);
      setItems([{ id: "1", description: "Design Consulting Services", quantity: 1, rate: 150 }]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!user) return;
    if (confirm(`Are you sure you want to delete Invoice ${num}?`)) {
      try {
        await deleteInvoice(id, user.uid);
        await loadData(user.uid);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleTogglePaid = async (id: string, currentStatus: "Draft" | "Sent" | "Paid" | "Overdue", num: string) => {
    if (!user) return;
    const nextStatus = currentStatus === "Paid" ? "Sent" : "Paid";
    try {
      await updateInvoice(id, { status: nextStatus }, user.uid);
      await loadData(user.uid);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    // Inject a print-only style to hide everything except the print-preview-modal-root container
    const style = document.createElement("style");
    style.id = "invoice-print-styles";
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #print-preview-modal-root, #print-preview-modal-root * {
          visibility: visible !important;
        }
        #print-preview-modal-root {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
          color: black !important;
        }
        .print-hidden, [class*="print:hidden"] {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Call print window
    window.print();
    
    // Clean up style
    setTimeout(() => {
      const el = document.getElementById("invoice-print-styles");
      if (el) el.remove();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 animate-pulse bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 mb-6" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  // Calculate sum counts for analytics header
  const totalDue = invoices
    .filter(inv => inv.status !== "Paid")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const totalCollected = invoices
    .filter(inv => inv.status === "Paid")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 print:p-0 print:bg-white print:text-black">
      
      {/* HEADER CONTROLS (Hide when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-center shrink-0 p-1">
            <img 
              src="/favicon.svg" 
              alt="Secura Logo" 
              className="w-7 h-7 object-contain" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon-96x96.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-widest text-neutral-900 dark:text-white font-mono">SECURA</h1>
              <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50 rounded text-[8px] font-mono font-bold uppercase tracking-widest">
                BILLING HUB
              </span>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              Secure client-ready freelance billing invoice systems and zero-knowledge ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              // Set automatic unique invoice number
              setInvoiceNumber(`INV-2026-${String(invoices.length + 1).padStart(3, "0")}`);
              setShowForm(true);
            }}
            className="h-9 px-4.5 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-white font-semibold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW (Hide when printing) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-4.5 rounded-xl">
          <p className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Total Collected</p>
          <p className="text-xl font-black text-emerald-500 mt-1.5">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-4.5 rounded-xl">
          <p className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Outstanding Balance</p>
          <p className="text-xl font-black text-amber-500 mt-1.5">${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-4.5 rounded-xl">
          <p className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Documents Issued</p>
          <p className="text-xl font-black mt-1.5">{invoices.length}</p>
        </div>
      </div>

      {/* LIST OF GENERATED INVOICES (Hide when printing) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl overflow-hidden shadow-sm print:hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">ISSUED INVOICES RECORDS</h3>
          <span className="text-[10px] text-neutral-400 font-mono">Real-time status tracking</span>
        </div>

        <div className="overflow-x-auto">
          {invoices.length > 0 ? (
            <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
              <thead className="bg-neutral-50 dark:bg-neutral-950/40 text-[10px] uppercase font-mono border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Sum</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10 transition-all">
                    <td className="py-3 px-4 font-bold text-neutral-800 dark:text-neutral-100">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-200">{inv.clientName}</p>
                        <p className="text-[10px] text-neutral-400">{inv.clientEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">{inv.dueDate}</td>
                    <td className="py-3 px-4 font-bold text-neutral-800 dark:text-neutral-100">
                      ${inv.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                        inv.status === "Paid" 
                          ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200/20" 
                          : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/20"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setShowPrintPreview(inv)}
                        className="w-7 h-7 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-indigo-500 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                        title="Print / View PDF template"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleTogglePaid(inv.id!, inv.status, inv.invoiceNumber)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                          inv.status === "Paid" 
                            ? "bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400" 
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-green-500"
                        }`}
                        title="Toggle Paid status"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setInvoiceToDelete({ id: inv.id!, invoiceNumber: inv.invoiceNumber })}
                        className="w-7 h-7 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-red-500 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-neutral-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-xs font-semibold">No invoices generated yet.</p>
              <p className="text-[10px] text-neutral-400 mt-1">Generate your first invoice to view billing records.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW INVOICE SLIDE-DRAWER OVERLAY (Hide when printing) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div className="fixed inset-0 bg-neutral-950/30 dark:bg-neutral-950/60 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-850 shadow-2xl p-6 z-10 flex flex-col animate-in slide-in-from-right duration-200 max-h-screen overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">New Freelance Invoice</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="flex flex-col gap-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Invoice Number</label>
                  <input 
                    type="text" 
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 text-xs outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-2.5 outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Client Name</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Acme Corp LLC"
                  className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Client Email</label>
                <input 
                  type="email" 
                  value={clientEmail} 
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="billing@acme.com"
                  className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  required 
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Issued Date</label>
                  <input 
                    type="date" 
                    value={issueDate} 
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  />
                </div>
              </div>

              {/* Dynamic Items list */}
              <div className="border-t border-neutral-100 dark:border-neutral-800/80 mt-2 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Line Items List</span>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add line item
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((it) => (
                    <div key={it.id} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={it.description} 
                        onChange={(e) => handleItemChange(it.id, "description", e.target.value)}
                        placeholder="Item details..."
                        className="flex-1 h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-2 outline-none"
                        required
                      />
                      <input 
                        type="number" 
                        value={it.quantity} 
                        onChange={(e) => handleItemChange(it.id, "quantity", Number(e.target.value))}
                        className="w-14 h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-1 text-center outline-none"
                        min={1}
                        required
                      />
                      <input 
                        type="number" 
                        value={it.rate} 
                        onChange={(e) => handleItemChange(it.id, "rate", Number(e.target.value))}
                        className="w-20 h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-2 text-right outline-none"
                        min={0}
                        required
                      />
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Tax Rate (%)</label>
                  <input 
                    type="number" 
                    value={taxRate} 
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Discount (%)</label>
                  <input 
                    type="number" 
                    value={discount} 
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                    min={0}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full h-10 mt-4 bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold rounded-lg text-xs flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-all"
              >
                Log Invoice Record
              </button>
            </form>

          </div>
        </div>
      )}

      {/* PRINT-READY EXPORT DIALOG OVERLAY */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:relative print:inset-auto print:p-0 print:z-0">
          {/* Backdrop (hidden during print) */}
          <div className="fixed inset-0 bg-neutral-950/45 dark:bg-neutral-950/75 backdrop-blur-xs print:hidden" onClick={() => setShowPrintPreview(null)} />
          
          <div className="w-full max-w-2xl bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl shadow-2xl p-8 z-10 flex flex-col gap-6 print:border-none print:shadow-none print:p-0 print:relative overflow-y-auto max-h-[90vh] print:max-h-none">
            
            {/* Modal top bar controls (hidden during print) */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 print:hidden">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">PDF Print Console</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to Printer</span>
                </button>
                <button 
                  onClick={() => setShowPrintPreview(null)}
                  className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* HIGH-FIDELITY PRINTABLE TEMPLATE WORKSPACE */}
            <div id="print-preview-modal-root" className="flex flex-col gap-8 select-text border-t-4 border-neutral-900 pt-6">
              
              {/* Header block with elegant logo and meta */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0 p-2 shadow-xs">
                    <img 
                      src="/favicon.svg" 
                      alt="Secura Logo" 
                      className="w-12 h-12 object-contain" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/favicon-96x96.png';
                      }}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-widest text-neutral-950 font-mono">SECURA</h1>
                    <p className="text-[11px] text-neutral-500 font-medium">Professional Billing Platform • secura.io</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <h2 className="text-2xl font-black tracking-tight text-neutral-950 uppercase">INVOICE</h2>
                  <p className="font-mono text-xs font-bold text-neutral-600 mt-0.5">{showPrintPreview.invoiceNumber}</p>
                  <div className="mt-1.5">
                    {showPrintPreview.status === "Paid" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-mono font-bold uppercase">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-mono font-bold uppercase">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-column Billing Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs border-y border-neutral-150 py-5">
                <div>
                  <p className="font-mono uppercase text-[9px] text-neutral-400 font-bold tracking-wider mb-1.5">Billed From:</p>
                  <p className="font-bold text-neutral-900">Secura Platform Account</p>
                  <p className="text-neutral-600 mt-0.5 font-mono break-all">{user?.email || "verified-account@secura.io"}</p>
                </div>
                <div>
                  <p className="font-mono uppercase text-[9px] text-neutral-400 font-bold tracking-wider mb-1.5">Billed To:</p>
                  <p className="font-black text-neutral-950 text-sm">{showPrintPreview.clientName}</p>
                  <p className="text-neutral-600 mt-0.5 font-mono break-all">{showPrintPreview.clientEmail}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-mono uppercase text-[9px] text-neutral-400 font-bold tracking-wider mb-1.5">Invoice Timeline:</p>
                  <p className="mt-0.5"><span className="text-neutral-400">Date of Issue:</span> <span className="font-bold text-neutral-900 font-mono">{showPrintPreview.issueDate}</span></p>
                  <p className="mt-0.5"><span className="text-neutral-400">Payment Due:</span> <span className="font-bold text-neutral-900 font-mono">{showPrintPreview.dueDate}</span></p>
                </div>
              </div>

              {/* Items List Table */}
              <div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-[9px] uppercase font-mono text-neutral-500 tracking-wider">
                      <th className="py-2.5 px-4 font-bold">Item Description</th>
                      <th className="py-2.5 px-3 w-16 text-center font-bold">QTY</th>
                      <th className="py-2.5 px-4 w-28 text-right font-bold">Unit Price</th>
                      <th className="py-2.5 px-4 w-28 text-right font-bold">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 border-b border-neutral-200">
                    {showPrintPreview.items?.map((it: any, index: number) => {
                      const itemPrice = it.price !== undefined ? it.price : it.rate;
                      return (
                        <tr key={index} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-neutral-800">{it.description}</td>
                          <td className="py-3 px-3 text-center font-mono text-neutral-600">{it.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono text-neutral-650">${itemPrice?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold font-mono text-neutral-900">${(it.quantity * itemPrice)?.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial calculations and notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                
                {/* Notes and payment details */}
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1">Payment Instructions</h4>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      Please remit payment securely via standard wire transfer or check. 
                      Kindly mention the invoice code <span className="font-mono font-bold text-neutral-900">{showPrintPreview.invoiceNumber}</span> on your transaction details.
                    </p>
                  </div>
                </div>

                {/* Subtotal calculations block */}
                <div className="flex justify-end">
                  <div className="w-full max-w-xs bg-neutral-50 rounded-xl border border-neutral-200/60 p-4 flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>Subtotal</span>
                      <span className="font-mono text-neutral-800">${(showPrintPreview.subtotal !== undefined ? showPrintPreview.subtotal : (showPrintPreview.totalAmount || 0))?.toFixed(2)}</span>
                    </div>
                    
                    {((showPrintPreview.discountRate || 0) > 0) && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>Discount ({showPrintPreview.discountRate}%)</span>
                        <span className="font-mono font-bold">-${(((showPrintPreview.subtotal || 0) * (showPrintPreview.discountRate || 0)) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {showPrintPreview.taxRate > 0 && (
                      <div className="flex justify-between items-center text-neutral-500">
                        <span>Tax ({showPrintPreview.taxRate}%)</span>
                        <span className="font-mono text-neutral-800">${(((showPrintPreview.subtotal || 0) - (((showPrintPreview.subtotal || 0) * (showPrintPreview.discountRate || 0)) / 100)) * showPrintPreview.taxRate / 100).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-neutral-200 pt-3 flex justify-between items-center font-bold text-neutral-900">
                      <span className="text-neutral-800">Total Due ({showPrintPreview.currency || "USD"})</span>
                      <span className="font-mono text-sm text-neutral-950 border-b-2 border-neutral-950 pb-0.5">
                        ${showPrintPreview.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Legal disclaimer */}
              <div className="text-center text-[10px] text-neutral-400 border-t border-dashed border-neutral-200 pt-6 mt-4 leading-relaxed">
                <p className="font-medium">Thank you for your business. For any billing questions, please contact the email address listed above.</p>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[9px] text-neutral-450 font-medium">
                  <span>Powered by Secura Invoicing</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/70 backdrop-blur-xs" onClick={() => setInvoiceToDelete(null)} />
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl max-w-sm w-full z-10 animate-in fade-in zoom-in-95 duration-150 relative">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Delete Invoice</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Are you sure you want to delete Invoice <span className="font-mono font-bold text-neutral-900 dark:text-white">{invoiceToDelete.invoiceNumber}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="h-8 px-4 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-350 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteInvoice(invoiceToDelete.id, user.uid);
                    await loadData(user.uid);
                    setInvoiceToDelete(null);
                  } catch (err) {
                    console.error("Delete failed:", err);
                  }
                }}
                className="h-8 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
