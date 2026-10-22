import React, { useState, useRef } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { uploadPart, uploadImageFile } from '../services/apiService';

const ADMIN_PIN = 'sbelevators@2026';

export const UploadPartModal = ({ isOpen, onClose, onPartAdded, onShowToast }) => {
  if (!isOpen) return null;

  // PIN Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    category: 'Traction & Motors',
    price: '',
    unit: 'Unit',
    moq: '1 Unit',
    badge: 'OEM Standard',
    inStock: true,
    stockCount: 10,
    leadTime: 'Same Day Dispatch',
    warranty: '24 Months OEM Warranty',
    compliance: 'EN 81-20 / IS 14665',
    description: '',
    image: '',
  });

  // Specifications rows builder state
  const [specRows, setSpecRows] = useState([
    { parameter: 'Rated Duty Load', value: '1000 kg', standard: 'EN 81-20' },
    { parameter: 'Operating Voltage', value: '415V AC 3-Phase', standard: 'IS 14665' },
    { parameter: 'Rated Speed', value: '1.5 m/s', standard: 'ISO 4190' },
  ]);

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Preset image library for quick selection
  const sampleImages = [
    { label: 'Traction Motor', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' },
    { label: 'Door Operator', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80' },
    { label: 'Control Inverter', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
    { label: 'COP Display Panel', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80' },
  ];

  // Verify PIN
  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid Admin PIN. Please check authorization.');
    }
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

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

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Spec row builder methods
  const addSpecRow = () => {
    setSpecRows(prev => [...prev, { parameter: '', value: '', standard: '' }]);
  };

  const updateSpecRow = (index, field, val) => {
    setSpecRows(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const removeSpecRow = (index) => {
    setSpecRows(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit new part
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.title.trim() || !formData.price) {
      alert('Item Code, Title, and Price are required fields.');
      return;
    }

    setIsSubmitting(true);

    const filteredSpecs = specRows.filter(s => s.parameter.trim() !== '' && s.value.trim() !== '');

    const finalPart = {
      ...formData,
      id: formData.code.toUpperCase(),
      code: formData.code.toUpperCase(),
      price: parseFloat(formData.price) || 0,
      stockCount: parseInt(formData.stockCount) || 10,
      image: formData.image || sampleImages[0].url,
      specs: filteredSpecs.length > 0 ? filteredSpecs : [
        { parameter: 'Standard Specification', value: 'OEM Factory Standard', standard: 'ISO 9001' }
      ]
    };

    try {
      const result = await uploadPart(finalPart);
      onPartAdded(finalPart);
      onShowToast?.(`Item [${finalPart.code}] uploaded successfully! Synced to central API.`);
      onClose();
    } catch (err) {
      console.error('Error during uploadPart:', err);
      alert('Failed to upload part. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              {isAuthenticated ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-white">
                Shop Admin / Upload Component Portal
              </h3>
              <span className="text-[11px] text-brand-200">
                {isAuthenticated ? 'Live sync to Central PHP API (api/parts.php)' : 'Authorized Personnel Access Only'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto">
              <h4 className="font-display font-bold text-xl text-slate-900">
                Enter Shop Admin PIN
              </h4>
              <p className="text-xs text-slate-500 mt-1.5">
                Restricted to SB Elevators store administrators and authorized catalog managers.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="max-w-xs mx-auto space-y-3">
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Security PIN..."
                  autoFocus
                  className="w-full text-center tracking-widest font-mono text-base px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 focus:bg-white"
                />
              </div>

              {pinError && (
                <div className="text-xs text-rose-600 font-semibold flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}

              <div 
                onClick={() => { setPinInput('sbelevators@2026'); }}
                className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-[11px] text-slate-600 cursor-pointer transition-colors"
                title="Click to auto-fill PIN"
              >
                Default authorization PIN: <code className="font-mono font-bold text-[#0745A7] underline">sbelevators@2026</code> (click to auto-fill)
              </div>

              <button
                type="submit"
                className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow cursor-pointer"
              >
                Unlock Upload Portal
              </button>
            </form>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Basic Info Grid */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-200 pb-1">
                1. Basic Component Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Item Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SB-COP-901"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold uppercase focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Component Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Stainless Steel Touchless COP Operating Panel"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="Traction & Motors">Traction & Motors</option>
                    <option value="Door Systems">Door Systems</option>
                    <option value="Control Systems & Inverters">Control Systems & Inverters</option>
                    <option value="Safety & Governors">Safety & Governors</option>
                    <option value="COP & LOP Displays">COP & LOP Displays</option>
                    <option value="Guide Rails & Mechanical">Guide Rails & Mechanical</option>
                    <option value="Ropes & Cables">Ropes & Cables</option>
                    <option value="Hydraulic Components">Hydraulic Components</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Unit Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 42000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="Unit">Unit</option>
                    <option value="Set">Set</option>
                    <option value="Piece">Piece</option>
                    <option value="Pair">Pair</option>
                    <option value="Spool">Spool (500m)</option>
                    <option value="Roll">Roll</option>
                    <option value="Meter">Meter</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Order Quantity (MOQ)</label>
                  <input
                    type="text"
                    value={formData.moq}
                    onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                    placeholder="e.g. 1 Unit / 2 Sets"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Promotional Badge</label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="OEM Standard">OEM Standard</option>
                    <option value="Ready Stock">Ready Stock</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Heavy Duty">Heavy Duty</option>
                    <option value="Imported">Imported</option>
                    <option value="Fire Rated">Fire Rated</option>
                    <option value="Emergency Essential">Emergency Essential</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Availability</label>
                  <div className="flex items-center gap-3 h-9">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.inStock}
                        onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="font-medium text-slate-800">In Stock</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="font-semibold text-slate-700 block mb-1">Engineering Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of application, duty cycle, casing, and standard features..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>
            </div>

            {/* Component Image Upload Dropzone */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-200 pb-1">
                2. Component Image Upload Dropzone
              </span>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  dragActive 
                    ? 'border-brand-600 bg-brand-50/60' 
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="component-image-upload"
                />

                {imagePreview ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-md">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Component Image Loaded</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-brand-700 hover:bg-brand-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-400 border border-slate-200">
                      <Upload className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Drag and drop component photo here, or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-brand-700 hover:underline cursor-pointer"
                        >
                          browse files
                        </button>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, or WEBP (Max 5MB)</p>
                    </div>

                    {/* Or pick from preset sample images */}
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 block mb-1.5">Or choose a sample elevator component visual:</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {sampleImages.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImagePreview(s.url);
                              setFormData(prev => ({ ...prev, image: s.url }));
                            }}
                            className="bg-white border border-slate-300 hover:border-brand-600 px-2 py-1 rounded text-[11px] text-slate-700 font-medium"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Key/Value Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  3. Technical Specifications & Parameters Builder
                </span>
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Spec Row</span>
                </button>
              </div>

              <div className="space-y-2">
                {specRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-400 font-bold w-6 text-center">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={row.parameter}
                      onChange={(e) => updateSpecRow(index, 'parameter', e.target.value)}
                      placeholder="Parameter Name (e.g. Rated Load)"
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600"
                    />
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateSpecRow(index, 'value', e.target.value)}
                      placeholder="Value / Rating (e.g. 1000 kg)"
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-brand-600"
                    />
                    <input
                      type="text"
                      value={row.standard}
                      onChange={(e) => updateSpecRow(index, 'standard', e.target.value)}
                      placeholder="Standard (e.g. EN 81-20)"
                      className="w-28 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-500 focus:ring-1 focus:ring-brand-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecRow(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Commercial terms & Submission */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Submitting posts to central API <code className="font-mono text-slate-700 font-bold">/api/parts.php</code></span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-brand-700 hover:bg-brand-800 disabled:bg-slate-400 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Uploading to API...' : 'Publish to Catalog'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
