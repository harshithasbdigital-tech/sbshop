import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Upload, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  KeyRound, 
  Sparkles,
  FileSpreadsheet,
  Layers,
  Search,
  Package,
  Check,
  RefreshCw,
  Copy
} from 'lucide-react';
import { uploadPart, bulkUploadParts, deletePart, clearAllParts, uploadImageFile } from '../services/apiService';

const ADMIN_PIN = 'sbelevators@2026';

export const AdminPanelModal = ({ isOpen, onClose, parts = [], onPartsUpdated, onShowToast }) => {
  if (!isOpen) return null;

  // PIN Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('sb_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Admin Tab: 'single' | 'bulk' | 'manage'
  const [activeTab, setActiveTab] = useState('single');

  // ── Tab 1: Single Part Form State ──
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    category: 'Traction & Motors',
    price: '',
    unit: 'Piece',
    moq: '1 Piece',
    badge: 'OEM Standard',
    inStock: true,
    stockCount: 10,
    leadTime: 'Same Day Dispatch',
    warranty: '24 Months OEM Warranty',
    compliance: 'EN 81-20 / IS 14665',
    description: '',
    image: '',
  });

  const [specRows, setSpecRows] = useState([
    { parameter: 'Rated Duty Load', value: '1000 kg', standard: 'EN 81-20' },
    { parameter: 'Operating Voltage', value: '415V AC 3-Phase', standard: 'IS 14665' },
  ]);

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // ── Tab 2: Bulk Upload State ──
  const [bulkInput, setBulkInput] = useState('');
  const [bulkParsedCount, setBulkParsedCount] = useState(0);
  const [bulkError, setBulkError] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // ── Tab 3: Manage Catalog State ──
  const [manageSearch, setManageSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Categories list
  const categoriesList = [
    'Traction & Motors',
    'Door Systems',
    'Control Systems & Inverters',
    'Safety & Governors',
    'COP & LOP Displays',
    'Guide Rails & Mechanical',
    'Ropes & Cables',
    'Hydraulic Components',
    'Accessories & Maintenance'
  ];

  // Verify PIN
  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('sb_admin_auth', 'true');
      setPinError('');
    } else {
      setPinError('Invalid Admin PIN. Please check authorization.');
    }
  };

  // Image Upload handler
  const handleImageFile = async (file) => {
    if (!file.type.match('image.*')) {
      alert('Please upload a valid image file (PNG, JPG, or WEBP)');
      return;
    }
    try {
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
    } catch {}

    const res = await uploadImageFile(file);
    if (res && res.success && res.url) {
      setImagePreview(res.url);
      setFormData(prev => ({ ...prev, image: res.url }));
    }
  };

  // Submit Single Part
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim() || !formData.price) {
      alert('Item Code, Title, and Price are required fields.');
      return;
    }

    setIsSubmitting(true);
    const filteredSpecs = specRows.filter(s => s.parameter.trim() !== '' && s.value.trim() !== '');

    const newPart = {
      ...formData,
      id: formData.code.toUpperCase().trim(),
      code: formData.code.toUpperCase().trim(),
      price: parseFloat(formData.price) || 0,
      stockCount: parseInt(formData.stockCount) || 10,
      image: formData.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      specs: filteredSpecs.length > 0 ? filteredSpecs : [
        { parameter: 'Quality Standard', value: 'Factory Tested OEM', standard: 'ISO 9001' }
      ]
    };

    try {
      await uploadPart(newPart);
      onPartsUpdated && onPartsUpdated();
      onShowToast && onShowToast(`Part [${newPart.code}] saved and live on store!`);
      // Reset form
      setFormData({
        code: '',
        title: '',
        category: 'Traction & Motors',
        price: '',
        unit: 'Piece',
        moq: '1 Piece',
        badge: 'OEM Standard',
        inStock: true,
        stockCount: 10,
        leadTime: 'Same Day Dispatch',
        warranty: '24 Months OEM Warranty',
        compliance: 'EN 81-20 / IS 14665',
        description: '',
        image: '',
      });
      setImagePreview(null);
      alert(`Success! Part ${newPart.code} added to store.`);
    } catch (err) {
      alert('Failed to save part. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Upload Parsing
  const handleBulkParseAndUpload = async () => {
    setBulkError('');
    if (!bulkInput.trim()) {
      setBulkError('Please paste CSV or JSON data to upload.');
      return;
    }

    let parsedList = [];

    // Attempt JSON parsing first
    try {
      const json = JSON.parse(bulkInput.trim());
      if (Array.isArray(json)) {
        parsedList = json;
      } else if (json.parts && Array.isArray(json.parts)) {
        parsedList = json.parts;
      }
    } catch {
      // Attempt CSV parsing
      const lines = bulkInput.trim().split('\n');
      if (lines.length > 1) {
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 3 && cols[0] && cols[1]) {
            parsedList.push({
              code: cols[0],
              id: cols[0],
              title: cols[1],
              price: parseFloat(cols[2]) || 0,
              category: cols[3] || 'Traction & Motors',
              unit: cols[4] || 'Piece',
              moq: cols[5] || '1 Piece',
              inStock: true,
              image: cols[6] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
            });
          }
        }
      }
    }

    if (parsedList.length === 0) {
      setBulkError('Could not parse parts. Please format as valid JSON array or CSV.');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const res = await bulkUploadParts(parsedList);
      onPartsUpdated && onPartsUpdated();
      alert(`Success! Bulk uploaded ${res.count} parts to the store catalog.`);
      setBulkInput('');
      setActiveTab('manage');
    } catch (err) {
      setBulkError('Bulk upload failed. Please try again.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Sample CSV template
  const sampleCSV = `code,title,price,category,unit,moq,image
SB-MTR-101,Heavy Duty Traction Motor 7.5kW,185000,Traction & Motors,Set,1 Set,https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80
SB-DO-301,VVVF Telescopic Door Operator,48000,Door Systems,Unit,1 Unit,https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80
SB-LC-128,Door Light Curtain Sensor 128-Beam,12500,Door Systems,Set,1 Set,https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80`;

  // Delete a single part
  const handleDeletePart = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete part "${title}" (${id}) from the store?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deletePart(id);
      onPartsUpdated && onPartsUpdated();
      onShowToast && onShowToast(`Deleted [${id}]`);
    } catch (err) {
      alert('Failed to delete part.');
    } finally {
      setDeletingId(null);
    }
  };

  // Clear all mock parts
  const handleClearCatalog = async () => {
    if (!window.confirm('⚠️ DANGER: This will delete ALL parts in the store catalog. Are you sure you want to start fresh?')) {
      return;
    }
    try {
      await clearAllParts();
      onPartsUpdated && onPartsUpdated();
      alert('All parts have been cleared. Catalog is now empty.');
    } catch (err) {
      alert('Failed to clear catalog.');
    }
  };

  // Filtered parts in manage tab
  const managedParts = parts.filter(p => {
    if (!manageSearch.trim()) return true;
    const q = manageSearch.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 animate-fadeIn">
      <div 
        className="relative bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="bg-[#0745A7] text-white px-5 sm:px-7 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
              {isAuthenticated ? <Unlock size={16} className="text-amber-300" /> : <Lock size={16} className="text-white" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>SB Elevators Store Admin</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Central Catalog
                </span>
              </h3>
              <span className="text-[11px] text-white/70">
                Direct sync with /api/parts.php & parts.json • Open anytime via <code className="bg-white/20 px-1 rounded font-mono">#admin</code> or <code className="bg-white/20 px-1 rounded font-mono">Ctrl+Shift+A</code>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center space-y-5 my-auto">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <KeyRound size={28} />
            </div>

            <div>
              <h4 className="font-extrabold text-xl text-slate-900">
                Store Admin Authorization
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Enter your administrative PIN to manage parts, bulk upload, and delete catalog items.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="max-w-xs mx-auto space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Security PIN..."
                autoFocus
                className="w-full text-center tracking-widest font-mono text-base px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
              />

              {pinError && (
                <div className="text-xs text-rose-600 font-semibold flex items-center justify-center gap-1">
                  <AlertCircle size={13} />
                  <span>{pinError}</span>
                </div>
              )}

              <div 
                onClick={() => { setPinInput('sbelevators@2026'); }}
                className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-[11px] text-slate-600 cursor-pointer transition-colors"
                title="Click to auto-fill PIN"
              >
                Default PIN: <code className="font-mono font-bold text-[#0745A7] underline">sbelevators@2026</code> (click to auto-fill)
              </div>

              <button
                type="submit"
                className="w-full bg-[#0745A7] hover:bg-[#053787] text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer"
              >
                Unlock Admin Console
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Workstation */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-7 flex items-center justify-between shrink-0 overflow-x-auto">
              <div className="flex items-center gap-2 py-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('single')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'single'
                      ? 'bg-[#0745A7] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Plus size={14} />
                  <span>Add Single Part</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('bulk')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'bulk'
                      ? 'bg-[#0745A7] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  <span>Bulk Upload (CSV/JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'manage'
                      ? 'bg-[#0745A7] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Layers size={14} />
                  <span>Manage & Delete Parts ({parts.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClearCatalog}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors shrink-0 cursor-pointer ml-2 whitespace-nowrap"
                title="Wipe all parts in database"
              >
                Clear All Parts
              </button>
            </div>

            {/* Tab 1: Single Part Upload Form */}
            {activeTab === 'single' && (
              <form onSubmit={handleSingleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
                
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                    1. Basic Product Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Part Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SB-MTR-450"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-semibold focus:outline-none focus:border-[#0745A7]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">
                        Part Title / Commercial Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Heavy Duty Geared Traction Motor (450mm Sheave)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-[#0745A7]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-[#0745A7]"
                      >
                        {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Unit Price (₹ INR) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                        placeholder="185000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:border-[#0745A7]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Unit Type
                      </label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                        placeholder="Piece / Set / Meter"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0745A7]"
                      />
                    </div>
                  </div>
                </div>

                {/* Logistics & Stock */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                    2. Stock & Logistics
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Min Order Qty (MOQ)</label>
                      <input
                        type="text"
                        value={formData.moq}
                        onChange={(e) => setFormData(p => ({ ...p, moq: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Lead Time</label>
                      <input
                        type="text"
                        value={formData.leadTime}
                        onChange={(e) => setFormData(p => ({ ...p, leadTime: e.target.value }))}
                        placeholder="Same Day Dispatch"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Warranty</label>
                      <input
                        type="text"
                        value={formData.warranty}
                        onChange={(e) => setFormData(p => ({ ...p, warranty: e.target.value }))}
                        placeholder="24 Months OEM"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Stock Count</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stockCount}
                        onChange={(e) => setFormData(p => ({ ...p, stockCount: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Photo & Image URL */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                    3. Product Image
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs items-center">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Paste Image URL</label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => {
                          setFormData(p => ({ ...p, image: e.target.value }));
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://... (PNG/JPG URL)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#0745A7]"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Or drag & drop photo into upload box on the right</span>
                    </div>

                    {/* Drag and Drop Box */}
                    <div
                      onDragEnter={() => setDragActive(true)}
                      onDragLeave={() => setDragActive(false)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors flex items-center justify-center gap-3 ${
                        dragActive ? 'border-[#0745A7] bg-blue-50' : 'border-slate-300 hover:border-[#0745A7]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { if (e.target.files[0]) handleImageFile(e.target.files[0]); }}
                      />
                      {imagePreview ? (
                        <div className="flex items-center gap-3">
                          <img src={imagePreview} alt="Preview" className="w-14 h-14 object-contain rounded border border-slate-200" />
                          <span className="text-emerald-700 font-bold text-xs">Photo attached ✓</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Upload size={16} />
                          <span>Click to upload photo from computer</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#0745A7] hover:bg-[#053787] text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{isSubmitting ? 'Saving to Database...' : 'Save Part to Store'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* Tab 2: Bulk Upload */}
            {activeTab === 'bulk' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
                  <strong>⚡ Bulk Upload Parts via CSV or JSON</strong>
                  <p className="text-blue-800 leading-relaxed">
                    Import multiple elevator spare parts in seconds. Paste your CSV list or JSON array below.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Paste CSV or JSON Data:</label>
                    <button
                      type="button"
                      onClick={() => setBulkInput(sampleCSV)}
                      className="text-xs font-bold text-[#0745A7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Insert Sample CSV Template</span>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="code,title,price,category,unit,moq,image&#10;SB-01,Traction Motor,185000,Traction & Motors,Set,1,https://...&#10;SB-02,Door Sensor,12500,Door Systems,Set,1,https://..."
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0745A7]"
                  />
                </div>

                {bulkError && (
                  <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{bulkError}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleBulkParseAndUpload}
                    disabled={isBulkSubmitting}
                    className="bg-[#0745A7] hover:bg-[#053787] text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>{isBulkSubmitting ? 'Importing Parts...' : 'Run Bulk Import'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Manage & Delete Parts */}
            {activeTab === 'manage' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={manageSearch}
                    onChange={(e) => setManageSearch(e.target.value)}
                    placeholder="Search by part code, title, or category to edit/delete..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#0745A7]"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Parts Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Price</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {managedParts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            No parts currently found in catalog. Use "+ Add Single Part" or "Bulk Upload" above.
                          </td>
                        </tr>
                      ) : (
                        managedParts.map((part, idx) => (
                          <tr key={`${part.id || part.code || 'admin-modal'}-${idx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-slate-900">{part.code || part.id}</td>
                            <td className="p-2.5 font-semibold text-slate-800 max-w-xs truncate">{part.title}</td>
                            <td className="p-2.5 text-slate-600">{part.category}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">₹{Number(part.price).toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                disabled={deletingId === (part.id || part.code)}
                                onClick={() => handleDeletePart(part.id || part.code, part.title)}
                                className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Delete this part from database"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
