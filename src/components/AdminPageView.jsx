import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft,
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
  Copy,
  ExternalLink,
  Download,
  FolderUp,
  Table,
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
  LogOut
} from 'lucide-react';
import { uploadPart, updatePart, bulkUploadParts, deletePart, clearAllParts, uploadImageFile } from '../services/apiService';

const ADMIN_PIN = 'sbelevators@2026';

// Pre-filled realistic elevator spare parts template rows
const templateSampleRows = [
  {
    code: 'SB-MTR-101',
    title: 'PMSM Gearless Traction Machine 1000kg 1.5m/s',
    category: 'Traction & Motors',
    price: 185000,
    unit: 'Set',
    moq: '1 Set',
    badge: 'Best Seller',
    inStock: 'TRUE',
    stockCount: 12,
    leadTime: 'Same Day Dispatch',
    warranty: '24 Months OEM Warranty',
    compliance: 'EN 81-20 / IS 14665',
    image: '',
    description: 'Synchronous permanent magnet gearless elevator machine, high efficiency, low vibration, 415V 3-Phase.'
  },
  {
    code: 'SB-DO-301',
    title: 'VVVF Telescopic Center Opening Door Operator',
    category: 'Door Systems',
    price: 48000,
    unit: 'Unit',
    moq: '1 Unit',
    badge: 'OEM Standard',
    inStock: 'TRUE',
    stockCount: 20,
    leadTime: 'Same Day Dispatch',
    warranty: '18 Months Warranty',
    compliance: 'EN 81-20',
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
    description: 'Variable frequency door controller with integrated encoder and DC brushless motor.'
  },
  {
    code: 'SB-LC-128',
    title: 'Infrared Multi-Beam Elevator Light Curtain (128 Beams)',
    category: 'Door Systems',
    price: 12500,
    unit: 'Set',
    moq: '1 Set',
    badge: 'Top Safety',
    inStock: 'TRUE',
    stockCount: 35,
    leadTime: 'Immediate Ready Stock',
    warranty: '12 Months Warranty',
    compliance: 'EN 81-20 / IP65',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
    description: 'Full door height optical detector with 128 infrared beams to prevent door pinching.'
  },
  {
    code: 'SB-GOV-250',
    title: 'Bi-Directional Overspeed Governor with Remote Trip',
    category: 'Safety & Overspeed Governors',
    price: 24500,
    unit: 'Piece',
    moq: '1 Piece',
    badge: 'CE Certified',
    inStock: 'TRUE',
    stockCount: 15,
    leadTime: 'Same Day Dispatch',
    warranty: '24 Months Warranty',
    compliance: 'EN 81-20 / IS 14665',
    image: '',
    description: 'Cast iron overspeed governor with electrical safety contact and test pulley, rated 1.5 - 2.5 m/s.'
  },
  {
    code: 'SB-ARD-415',
    title: 'Automatic Rescue Device (ARD) Unit 415V 3-Phase',
    category: 'ARD & Power Backup',
    price: 58000,
    unit: 'Unit',
    moq: '1 Unit',
    badge: 'Emergency Essential',
    inStock: 'TRUE',
    stockCount: 18,
    leadTime: 'Same Day Dispatch',
    warranty: '24 Months Warranty',
    compliance: 'IS 14665',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
    description: 'Emergency rescue unit with microprocessor monitoring and SMF battery bank to rescue stranded passengers to nearest floor.'
  }
];

export const AdminPageView = ({ onBackToStore, parts = [], onPartsUpdated, onShowToast }) => {
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
    badge: '',
    inStock: true,
    stockCount: 10,
    leadTime: 'Same Day Dispatch',
    warranty: '24 Months OEM Warranty',
    compliance: 'EN 81-20 / IS 14665',
    description: '',
    image: '',
    images: [],
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [editImageUrlInput, setEditImageUrlInput] = useState('');

  const [specRows, setSpecRows] = useState([
    { parameter: 'Rated Duty Load', value: '1000 kg', standard: 'EN 81-20' },
    { parameter: 'Operating Voltage', value: '415V AC 3-Phase', standard: 'IS 14665' },
  ]);

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // ── Tab 2: Excel Template & Bulk Upload State ──
  const [parsedPartsList, setParsedPartsList] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isExcelDragging, setIsExcelDragging] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const excelFileInputRef = useRef(null);

  // ── Tab 3: Manage Catalog State ──
  const [manageSearch, setManageSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSpecRows, setEditSpecRows] = useState([]);
  const [editDragActive, setEditDragActive] = useState(false);
  const editFileInputRef = useRef(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Categories list
  const categoriesList = [
    'Traction & Motors',
    'Door Systems',
    'Control Systems & Inverters',
    'Safety & Overspeed Governors',
    'Cabin & Landing Fixtures',
    'Ropes, Pulleys & Belts',
    'Guide Rails & Brackets',
    'ARD & Power Backup',
    'Emergency Breakdown'
  ];

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('sb_admin_auth', 'true');
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Default PIN: sbelevators@2026');
    }
  };

  const handleAutoFillPin = () => {
    setPinInput(ADMIN_PIN);
    setIsAuthenticated(true);
    sessionStorage.setItem('sb_admin_auth', 'true');
    setPinError('');
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    sessionStorage.removeItem('sb_admin_auth');
    setIsAuthenticated(false);
    setPinInput('');
    setShowLogoutConfirm(false);
    onBackToStore?.();
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState('');

  // Handle uploading multiple image files for Add Single Part
  const handleMultipleImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      alert('Please upload valid image files (PNG, JPG, WEBP).');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadStatus(`Uploading ${fileList.length} image(s)...`);

    const uploadedUrls = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const uploadRes = await uploadImageFile(file);
        if (uploadRes && uploadRes.success && uploadRes.url) {
          uploadedUrls.push(uploadRes.url);
        } else {
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        }
      } catch (err) {
        try {
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        } catch {}
      }
    }

    setFormData(prev => {
      const existing = Array.isArray(prev.images) && prev.images.length > 0
        ? prev.images
        : (prev.image ? [prev.image] : []);
      const combined = [...existing, ...uploadedUrls].filter(Boolean);
      return {
        ...prev,
        image: combined[0] || '',
        images: combined
      };
    });

    setImageUploadStatus(`✓ ${uploadedUrls.length} image(s) uploaded successfully`);
    setIsUploadingImage(false);
  };

  const handleRemoveImage = (idxToRemove) => {
    setFormData(prev => {
      const nextImages = (prev.images || []).filter((_, idx) => idx !== idxToRemove);
      return {
        ...prev,
        image: nextImages[0] || '',
        images: nextImages
      };
    });
  };

  const handleSetCoverImage = (idxToCover) => {
    setFormData(prev => {
      const current = [...(prev.images || [])];
      if (idxToCover < 0 || idxToCover >= current.length) return prev;
      const [selected] = current.splice(idxToCover, 1);
      const reordered = [selected, ...current];
      return {
        ...prev,
        image: reordered[0] || '',
        images: reordered
      };
    });
  };

  const handleAddImageUrl = () => {
    const trimmed = (imageUrlInput || '').trim();
    if (!trimmed) return;
    setFormData(prev => {
      const existing = Array.isArray(prev.images) && prev.images.length > 0
        ? prev.images
        : (prev.image ? [prev.image] : []);
      const combined = [...existing, trimmed];
      return {
        ...prev,
        image: combined[0] || '',
        images: combined
      };
    });
    setImageUrlInput('');
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleImageFiles(e.dataTransfer.files);
    }
  };

  // Technical Specs Row Add/Remove
  const addSpecRow = () => {
    setSpecRows(prev => [...prev, { parameter: '', value: '', standard: '' }]);
  };

  const removeSpecRow = (idx) => {
    setSpecRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSpecRow = (idx, field, val) => {
    setSpecRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  };

  // Submit Single Part
  const handleSinglePartSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Product title / part name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedSpecs = specRows.filter(r => r.parameter.trim() && r.value.trim());
      const rawPrice = formData.price !== '' && !isNaN(formData.price) ? Number(formData.price) : 0;
      const finalCode = formData.code.trim() || `SB-${Date.now().toString().slice(-6)}`;
      const finalTitle = formData.title.trim();

      const finalImages = Array.isArray(formData.images) && formData.images.length > 0
        ? formData.images
        : (formData.image ? [formData.image] : []);

      const partToSave = {
        ...formData,
        id: finalCode,
        code: finalCode,
        itemCode: finalCode,
        title: finalTitle,
        price: rawPrice,
        image: finalImages[0] || formData.image || '',
        images: finalImages,
        specs: cleanedSpecs,
        inStock: Boolean(formData.inStock),
        stockCount: Number(formData.stockCount) || 10
      };

      await uploadPart(partToSave);
      if (onPartsUpdated) {
        await onPartsUpdated();
      }
      alert(`Success! Part "${partToSave.title}" (${partToSave.code}) added to the store catalog.`);

      // Reset form
      setFormData({
        code: '',
        title: '',
        category: 'Traction & Motors',
        price: '',
        unit: 'Piece',
        moq: '1 Piece',
        badge: '',
        inStock: true,
        stockCount: 10,
        leadTime: 'Same Day Dispatch',
        warranty: '24 Months OEM Warranty',
        compliance: 'EN 81-20 / IS 14665',
        description: '',
        image: '',
        images: [],
      });
      setImagePreview(null);
      setImageUploadStatus('');
      setImageUrlInput('');
      setActiveTab('manage');
    } catch (err) {
      alert('Failed to save part. Please check server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── EXCEL TEMPLATE GENERATORS ──
  const downloadExcelTemplate = () => {
    try {
      if (window.XLSX) {
        const ws = window.XLSX.utils.json_to_sheet(templateSampleRows);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, 'Elevator_Parts_Template');
        window.XLSX.writeFile(wb, 'SB_Elevators_Parts_Template.xlsx');
        return;
      }
    } catch (e) {
      console.warn('XLSX generation failed, falling back to CSV', e);
    }
    // Fallback to CSV
    downloadCSVTemplate();
  };

  const downloadCSVTemplate = () => {
    const headers = ['code', 'title', 'category', 'price', 'unit', 'moq', 'badge', 'inStock', 'stockCount', 'leadTime', 'warranty', 'compliance', 'image', 'description'];
    const rows = templateSampleRows.map(r => 
      headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SB_Elevators_Parts_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── EXCEL & CSV FILE PARSER ──
  const handleExcelFileSelect = (file) => {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      setBulkError('Please upload an Excel spreadsheet (.xlsx, .xls) or a .csv file.');
      return;
    }

    setUploadedFileName(file.name);
    setBulkError('');

    const reader = new FileReader();

    if (fileName.endsWith('.csv')) {
      reader.onload = (e) => {
        parseCSVText(e.target.result);
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          if (window.XLSX) {
            const workbook = window.XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            processParsedData(json);
          } else {
            setBulkError('Excel reader is initializing. Please try again or upload as CSV.');
          }
        } catch (err) {
          setBulkError('Failed to parse Excel file. Please ensure it follows the template format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Parse raw CSV text
  const parseCSVText = (text) => {
    try {
      if (window.XLSX) {
        const workbook = window.XLSX.read(text, { type: 'string' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processParsedData(json);
        return;
      }
    } catch (e) {
      console.warn('XLSX text parse fallback:', e);
    }

    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) {
      setBulkError('The file appears to be empty or missing data rows.');
      setParsedPartsList([]);
      return;
    }

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]);
    const rawRows = lines.slice(1).map(line => {
      const cols = parseLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] !== undefined ? cols[i] : '';
      });
      return obj;
    });

    processParsedData(rawRows);
  };

  // Normalize parsed rows into store part objects PRESERVING EXACT EXCEL PART NAME & CODE
  const processParsedData = (rawRows) => {
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      setBulkError('No rows found in the uploaded file.');
      setParsedPartsList([]);
      return;
    }

    const cleanKey = (k) => String(k || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const cleaned = rawRows.map((row, idx) => {
      // Find value matching any alias
      const getVal = (aliases) => {
        const rowKeys = Object.keys(row);
        for (const k of rowKeys) {
          const cleanedK = cleanKey(k);
          if (aliases.some(alias => cleanKey(alias) === cleanedK)) {
            const val = row[k];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return String(val).trim();
            }
          }
        }
        return '';
      };

      // 1. Part Title / Name: Exact match from Excel (Part Name, Item Name, Particulars, Description, etc.)
      let title = getVal([
        'title', 'name', 'partname', 'part_name', 'itemname', 'item_name',
        'productname', 'product_name', 'producttitle', 'particulars',
        'sparepartname', 'sparepart', 'part', 'parts', 'materialdescription',
        'material_description', 'itemdescription', 'item_description',
        'partdescription', 'part_description', 'description', 'desc', 'modelname'
      ]);

      // 2. Part Code: Exact match from Excel (Part Code, Part No, Item Code, SKU, Code, etc.)
      let code = getVal([
        'code', 'partcode', 'part_code', 'partno', 'part_no', 'partnumber', 'part_number',
        'partnum', 'itemcode', 'item_code', 'itemno', 'item_no', 'itemnumber',
        'sku', 'productcode', 'product_code', 'materialcode', 'material_code',
        'materialno', 'material_no', 'modelno', 'model_no', 'model', 'refno',
        'referenceno', 'slno', 'sno', 'serialno'
      ]);

      // If code was not found by aliases, search keys containing 'code' or 'no'
      if (!code) {
        for (const k of Object.keys(row)) {
          const ck = cleanKey(k);
          if (ck.includes('code') || ck.includes('partno') || ck.includes('itemno')) {
            const v = String(row[k] || '').trim();
            if (v) { code = v; break; }
          }
        }
      }

      // If title was not found by aliases, search keys containing 'name' or 'desc' or 'title'
      if (!title) {
        for (const k of Object.keys(row)) {
          const ck = cleanKey(k);
          if (ck.includes('name') || ck.includes('title') || ck.includes('particular')) {
            const v = String(row[k] || '').trim();
            if (v) { title = v; break; }
          }
        }
      }

      // Fallback: If title is still empty, pick the first non-numeric text column
      if (!title) {
        const textCols = Object.values(row).map(v => String(v || '').trim()).filter(v => v.length > 0 && isNaN(v));
        if (textCols.length > 0) {
          title = textCols[0];
        }
      }

      // Fallback for code: Only generate if user truly didn't have any code in the file
      if (!code) {
        code = `SB-${Date.now().toString().slice(-5)}-${idx + 1}`;
      }

      // 3. Price: Completely optional! Can be 0 or empty ("Price on Request")
      const rawPrice = getVal([
        'price', 'rate', 'unitprice', 'unit_price', 'amount', 'cost',
        'priceinr', 'pricers', 'rateinr', 'raters', 'unitrate'
      ]);
      const cleanPriceStr = String(rawPrice || '').replace(/[^\d.]/g, '');
      const price = cleanPriceStr ? Number(cleanPriceStr) : 0;

      // 4. Category
      const rawCat = getVal([
        'category', 'cat', 'group', 'classification', 'type', 'department', 'dept'
      ]);
      const category = rawCat || 'Traction & Motors';

      // 5. Unit / UOM
      const rawUnit = getVal(['unit', 'uom', 'priceunit', 'price_unit', 'per']);
      const unit = rawUnit || 'Piece';

      // 6. MOQ
      const rawMoq = getVal(['moq', 'minorder', 'min_order_qty', 'minimumorder']);
      const moq = rawMoq || '1 Unit';

      // 7. Badge
      const rawBadge = getVal(['badge', 'tag', 'label']);
      const badge = rawBadge || '';

      // 8. InStock
      const rawInStock = getVal(['instock', 'in_stock', 'stockstatus', 'stock_status', 'available']).toLowerCase();
      const inStock = rawInStock === 'false' || rawInStock === '0' || rawInStock === 'no' ? false : true;

      // 9. Stock Count
      const rawStockCount = getVal(['stockcount', 'stock_count', 'stock', 'qty', 'quantity']).replace(/[^\d]/g, '');
      const stockCount = rawStockCount ? Number(rawStockCount) : 10;

      // 10. Lead Time
      const rawLead = getVal(['leadtime', 'lead_time', 'dispatch', 'delivery']);
      const leadTime = rawLead || 'Same Day Dispatch';

      // 11. Warranty
      const rawWarranty = getVal(['warranty', 'guarantee']);
      const warranty = rawWarranty || '24 Months OEM Warranty';

      // 12. Compliance
      const rawCompliance = getVal(['compliance', 'standard', 'certification']);
      const compliance = rawCompliance || 'EN 81-20 / IS 14665';

      // 13. Image
      const rawImg = getVal(['image', 'photo', 'picture', 'imageurl', 'image_url', 'img']);
      const isBadImg = rawImg && rawImg.includes('photo-1581092160607-ee22621dd758');
      const image = (!isBadImg && rawImg) ? rawImg : '';

      // 14. Description
      const rawDesc = getVal(['description', 'desc', 'notes', 'specifications', 'remarks', 'specs']);
      const description = rawDesc || '';

      return {
        id: `${code}-${idx + 1}`, // Guarantee unique id per item
        code: code, // EXACT PART CODE FROM EXCEL PRESERVED
        itemCode: code,
        title: title, // EXACT PART NAME FROM EXCEL PRESERVED
        price,
        category,
        unit,
        priceUnit: unit,
        moq,
        badge,
        inStock,
        stockCount,
        leadTime,
        warranty,
        compliance,
        image,
        description,
        specs: []
      };
    }).filter(p => p.title && p.title.trim() !== '');

    if (cleaned.length === 0) {
      setBulkError('Could not find valid product rows. Please ensure your file has at least a column with part names/titles.');
      setParsedPartsList([]);
    } else {
      setParsedPartsList(cleaned);
      setBulkError('');
    }
  };

  // Submit Bulk Upload
  const handleBulkSubmit = async () => {
    if (parsedPartsList.length === 0) {
      setBulkError('Please upload an Excel file or insert valid parts first.');
      return;
    }

    setIsBulkSubmitting(true);
    setBulkError('');
    try {
      const res = await bulkUploadParts(parsedPartsList);
      if (onPartsUpdated) {
        await onPartsUpdated();
      }
      alert(`Success! Bulk uploaded ${res.count} parts with their original names and codes to the store catalog.`);
      setParsedPartsList([]);
      setUploadedFileName('');
      setBulkInput('');
      setActiveTab('manage');
    } catch (err) {
      setBulkError('Bulk upload failed. Please try again.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // ── EDIT PART HANDLERS ──
  const handleStartEdit = (part) => {
    setEditingPart(part);
    setEditFormData({
      id: part.id || part.code,
      originalCode: part.code || part.id,
      code: part.code || '',
      title: part.title || '',
      category: part.category || 'Traction & Motors',
      price: part.price !== undefined && part.price !== null && Number(part.price) > 0 ? String(part.price) : '',
      unit: part.unit || part.priceUnit || 'Piece',
      moq: part.moq || '1 Unit',
      badge: part.badge || '',
      inStock: part.inStock !== false,
      stockCount: part.stockCount !== undefined ? part.stockCount : 10,
      leadTime: part.leadTime || 'Same Day Dispatch',
      warranty: part.warranty || '24 Months OEM Warranty',
      compliance: part.compliance || 'EN 81-20 / IS 14665',
      description: part.description || '',
      image: (part.image && !part.image.includes('photo-1581092160607-ee22621dd758')) ? part.image : '',
      images: (Array.isArray(part.images) && part.images.length > 0
        ? part.images
        : (part.image ? [part.image] : [])).filter(img => img && !img.includes('photo-1581092160607-ee22621dd758')),
    });
    setEditSpecRows(
      Array.isArray(part.specs) && part.specs.length > 0
        ? part.specs.map(s => ({
            parameter: s.parameter || s.label || '',
            value: s.value || '',
            standard: s.standard || ''
          }))
        : [
            { parameter: 'Material / Spec', value: 'Standard Machined', standard: 'EN 81-20' }
          ]
    );
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData || !editFormData.title.trim()) {
      alert('Product title / part name is required.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const rawPrice = editFormData.price !== '' && !isNaN(editFormData.price) ? Number(editFormData.price) : 0;
      const finalCode = editFormData.code.trim() || editFormData.originalCode || `SB-${Date.now().toString().slice(-6)}`;
      const cleanedSpecs = editSpecRows.filter(r => r.parameter.trim() && r.value.trim());

      const finalImages = Array.isArray(editFormData.images) && editFormData.images.length > 0
        ? editFormData.images
        : (editFormData.image ? [editFormData.image] : []);

      const updated = {
        ...editFormData,
        id: finalCode,
        code: finalCode,
        itemCode: finalCode,
        title: editFormData.title.trim(),
        price: rawPrice,
        image: finalImages[0] || editFormData.image || '',
        images: finalImages,
        specs: cleanedSpecs,
        inStock: Boolean(editFormData.inStock),
        stockCount: Number(editFormData.stockCount) || 10
      };

      await updatePart(updated, editFormData.originalCode);
      if (onPartsUpdated) {
        await onPartsUpdated();
      }
      if (onShowToast) {
        onShowToast(`Updated [${finalCode}] successfully!`);
      }
      alert(`Success! Part "${updated.title}" (${finalCode}) updated successfully.`);
      setEditingPart(null);
      setEditFormData(null);
      setEditImageUrlInput('');
    } catch (err) {
      console.error('Save edit error:', err);
      alert('Failed to update part. Please check server connection.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPart(null);
    setEditFormData(null);
    setEditImageUrlInput('');
  };

  const [isEditingUploadingImage, setIsEditingUploadingImage] = useState(false);
  const [editImageUploadStatus, setEditImageUploadStatus] = useState('');

  const handleEditMultipleImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      alert('Please upload valid image files (PNG, JPG, WEBP).');
      return;
    }

    setIsEditingUploadingImage(true);
    setEditImageUploadStatus(`Uploading ${fileList.length} image(s)...`);

    const uploadedUrls = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const uploadRes = await uploadImageFile(file);
        if (uploadRes && uploadRes.success && uploadRes.url) {
          uploadedUrls.push(uploadRes.url);
        } else {
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        }
      } catch (err) {
        try {
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        } catch {}
      }
    }

    setEditFormData(prev => {
      const existing = Array.isArray(prev.images) && prev.images.length > 0
        ? prev.images
        : (prev.image ? [prev.image] : []);
      const combined = [...existing, ...uploadedUrls].filter(Boolean);
      return {
        ...prev,
        image: combined[0] || '',
        images: combined
      };
    });

    setEditImageUploadStatus(`✓ ${uploadedUrls.length} image(s) uploaded successfully`);
    setIsEditingUploadingImage(false);
  };

  const handleEditRemoveImage = (idxToRemove) => {
    setEditFormData(prev => {
      const nextImages = (prev.images || []).filter((_, idx) => idx !== idxToRemove);
      return {
        ...prev,
        image: nextImages[0] || '',
        images: nextImages
      };
    });
  };

  const handleEditSetCoverImage = (idxToCover) => {
    setEditFormData(prev => {
      const current = [...(prev.images || [])];
      if (idxToCover < 0 || idxToCover >= current.length) return prev;
      const [selected] = current.splice(idxToCover, 1);
      const reordered = [selected, ...current];
      return {
        ...prev,
        image: reordered[0] || '',
        images: reordered
      };
    });
  };

  const handleEditAddImageUrl = () => {
    const trimmed = (editImageUrlInput || '').trim();
    if (!trimmed) return;
    setEditFormData(prev => {
      const existing = Array.isArray(prev.images) && prev.images.length > 0
        ? prev.images
        : (prev.image ? [prev.image] : []);
      const combined = [...existing, trimmed];
      return {
        ...prev,
        image: combined[0] || '',
        images: combined
      };
    });
    setEditImageUrlInput('');
  };

  const addEditSpecRow = () => {
    setEditSpecRows(prev => [...prev, { parameter: '', value: '', standard: '' }]);
  };

  const removeEditSpecRow = (idx) => {
    setEditSpecRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateEditSpecRow = (idx, field, val) => {
    setEditSpecRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  };

  // Filtered parts in manage tab (Deduplicated)
  const managedParts = React.useMemo(() => {
    const seen = new Set();
    const unique = [];
    (parts || []).forEach(p => {
      const key = String(p.code || p.id || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(p);
      } else if (!key) {
        unique.push(p);
      }
    });

    return unique.filter(p => {
      if (!manageSearch.trim()) return true;
      const q = manageSearch.toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    });
  }, [parts, manageSearch]);

  const handleOpenClearModal = () => {
    setClearConfirmText('');
    setShowClearAllModal(true);
  };

  const handleClearCatalog = handleOpenClearModal;

  const handleCloseClearModal = () => {
    if (isClearingAll) return;
    setShowClearAllModal(false);
    setClearConfirmText('');
  };

  const handleConfirmClearAll = async () => {
    if (clearConfirmText.trim().toLowerCase() !== 'delete') return;
    setIsClearingAll(true);
    try {
      await clearAllParts();
      if (onPartsUpdated) {
        await onPartsUpdated();
      }
      onShowToast?.('Catalog cleared: All parts have been deleted.');
      setShowClearAllModal(false);
      setClearConfirmText('');
    } catch (err) {
      console.error('Failed to clear catalog:', err);
      alert('Failed to clear catalog. Please try again.');
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleDeletePart = async (part, partTitle) => {
    const partCode = part.code || part.id;
    if (!window.confirm(`Are you sure you want to permanently delete "${partTitle || partCode}"?`)) {
      return;
    }
    setDeletingId(part.id || part.code);
    try {
      await deletePart(part);
      if (onPartsUpdated) {
        await onPartsUpdated();
      }
      onShowToast?.(`Deleted [${partCode}] permanently.`);
    } catch (err) {
      console.error('Error deleting part:', err);
      alert('Could not delete part. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full bg-white min-h-full flex flex-col">
      
      {/* Top Header Bar */}
      <div className="w-full bg-[#0745A7] text-white px-4 sm:px-8 py-2.5 sm:py-3 border-t border-white/10 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToStore}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-white/20 whitespace-nowrap"
            title="Return to Shop"
          >
            <ArrowLeft size={14} />
            <span>Back to Shop</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="text-xs bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs"
            title="Log out of Admin Workstation"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-16 text-center space-y-5 max-w-md mx-auto">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <KeyRound size={28} />
            </div>

            <div>
              <h3 className="font-extrabold text-2xl text-slate-900">
                Store Admin Authorization
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your administrative PIN to add parts, bulk upload, or delete catalog items.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Security PIN..."
                autoFocus
                className="w-full text-center tracking-widest font-mono text-base px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
              >
              </input>

              {pinError && (
                <p className="text-xs text-rose-600 font-semibold">{pinError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#0745A7] hover:bg-[#053787] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                Unlock Admin Workstation
              </button>

              <button
                type="button"
                onClick={handleAutoFillPin}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                1-Click Auto-Fill PIN ({ADMIN_PIN})
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Workstation */
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 flex flex-col">
            
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'single'
                    ? 'bg-[#0745A7] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus size={15} />
                <span>Add Single Part</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'bulk'
                    ? 'bg-[#0745A7] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet size={15} className="text-emerald-500" />
                <span>Bulk Excel Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'manage'
                    ? 'bg-[#0745A7] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers size={15} />
                <span>Manage & Delete Parts ({parts.length})</span>
              </button>

              <div className="shrink-0 pl-1">
                <button
                  type="button"
                  onClick={handleOpenClearModal}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-rose-200 font-bold whitespace-nowrap shrink-0"
                  title="Wipe database and start completely fresh"
                >
                  <Trash2 size={13} />
                  <span>Clear All Parts</span>
                </button>
              </div>
            </div>

            {/* ── TAB 1: ADD SINGLE PART ── */}
            {activeTab === 'single' && (
              <form onSubmit={handleSinglePartSubmit} className="space-y-6">
                
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Part Title */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Part Title / Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Heavy Duty PMSM Gearless Traction Motor 1.5m/s"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Part Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Part Code (SKU)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., SB-TM-450"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Price (INR ₹) <span className="text-slate-400 font-normal lowercase tracking-normal">(optional - can upload later)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 185000 (or leave blank for Quote)"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none font-mono font-bold"
                    />
                  </div>

                  {/* Pricing Unit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Unit (e.g. Piece, Set, Meter)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Set"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Highlight Badge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Best Seller, OEM Standard, Hot Deal"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* MOQ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Min Order Qty (MOQ)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 1 Unit"
                      value={formData.moq}
                      onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Lead Time */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Dispatch Lead Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Same Day Dispatch"
                      value={formData.leadTime}
                      onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Image Upload Box (Supports Multiple Images for Carousel) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Product Images (Upload Multiple for Card Carousel)
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {(formData.images || []).length} image(s) selected
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Drag-and-drop zone with multiple files support */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                        dragActive ? 'border-[#0745A7] bg-blue-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleMultipleImageFiles(e.target.files)}
                      />
                      {isUploadingImage ? (
                        <div className="py-2">
                          <RefreshCw size={24} className="mx-auto text-[#0745A7] mb-2 animate-spin" />
                          <p className="text-xs font-bold text-[#0745A7]">{imageUploadStatus || 'Uploading images...'}</p>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                          <p className="text-xs font-bold text-slate-700">Click to upload multiple images or drag files here</p>
                          <p className="text-[11px] text-slate-400 mt-1">Select one or multiple images (PNG, JPG, WEBP) to create a carousel</p>
                        </>
                      )}
                      {imageUploadStatus && (
                        <p className={`text-[11px] font-semibold mt-1.5 ${imageUploadStatus.includes('✓') ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {imageUploadStatus}
                        </p>
                      )}
                    </div>

                    {/* Or paste direct image URL */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Or paste direct image URL (https://...)"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-4 py-2 bg-[#0745A7] hover:bg-[#053787] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs whitespace-nowrap transition-colors"
                      >
                        + Add URL
                      </button>
                    </div>

                    {/* Uploaded Images Gallery / Thumbnails */}
                    {formData.images && formData.images.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Carousel Image Gallery ({formData.images.length})</span>
                          <span className="text-[11px] text-slate-400 font-normal">First image is the primary cover</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                          {formData.images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              className={`relative group bg-white border rounded-xl p-1 overflow-hidden shadow-2xs aspect-square flex items-center justify-center ${
                                imgIdx === 0 ? 'border-[#0745A7] ring-2 ring-[#0745A7]/30' : 'border-slate-200'
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`Part view ${imgIdx + 1}`}
                                className="w-full h-full object-contain"
                              />

                              {/* Primary Cover Badge */}
                              {imgIdx === 0 && (
                                <span className="absolute top-1 left-1 bg-[#0745A7] text-white text-[8px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                                  Cover
                                </span>
                              )}

                              {/* Action controls on hover */}
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                {imgIdx !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetCoverImage(imgIdx)}
                                    className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded text-[9px] font-bold shadow-xs cursor-pointer"
                                    title="Set as Main Cover"
                                  >
                                    Main
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(imgIdx)}
                                  className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded shadow-xs cursor-pointer"
                                  title="Remove image"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
                        <AlertCircle size={14} className="shrink-0 text-slate-300" />
                        <span>No images uploaded yet. Default OEM illustration will be used.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Specifications Dynamic Rows */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Technical Specifications & Parameters
                    </label>
                    <button
                      type="button"
                      onClick={addSpecRow}
                      className="text-xs font-bold text-[#0745A7] hover:text-[#053787] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add Spec Row</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {specRows.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Parameter (e.g. Rated Load)"
                          value={spec.parameter}
                          onChange={(e) => updateSpecRow(idx, 'parameter', e.target.value)}
                          className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0745A7]"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 1000 kg)"
                          value={spec.value}
                          onChange={(e) => updateSpecRow(idx, 'value', e.target.value)}
                          className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0745A7]"
                        />
                        <input
                          type="text"
                          placeholder="Standard (e.g. EN 81-20)"
                          value={spec.standard}
                          onChange={(e) => updateSpecRow(idx, 'standard', e.target.value)}
                          className="w-32 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0745A7]"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Product Description / Engineering Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed technical description, compatibility with Schindler/Otis/KONE/Johnson lifts..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#0745A7] hover:bg-[#053787] text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>{isSubmitting ? 'Saving to Database...' : 'Save Part to Store Catalog'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* ── TAB 2: EXCEL TEMPLATE & BULK UPLOAD ── */}
            {activeTab === 'bulk' && (
              <div className="space-y-6">
                
                {/* ── STEP 1: DOWNLOAD EXCEL TEMPLATE CARD ── */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <FileSpreadsheet size={16} />
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900">
                          Step 1: Download Official Excel Template
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={downloadExcelTemplate}
                        className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                        title="Download standard Excel .xlsx spreadsheet"
                      >
                        <Download size={15} />
                        <span>Download Excel Template (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={downloadCSVTemplate}
                        className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                        title="Download as CSV spreadsheet"
                      >
                        <Download size={14} className="text-slate-500" />
                        <span>Download .CSV</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── STEP 2: UPLOAD COMPLETED EXCEL FILE ── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#0745A7] text-white flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                        Step 2: Upload Your Filled Excel File
                      </h4>
                    </div>

                    {uploadedFileName && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>{uploadedFileName}</span>
                      </span>
                    )}
                  </div>

                  {/* Drag-and-drop zone for Excel */}
                  <div
                    onDragEnter={(e) => { e.preventDefault(); setIsExcelDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsExcelDragging(false); }}
                    onDragOver={(e) => { e.preventDefault(); setIsExcelDragging(true); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsExcelDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleExcelFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => excelFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                      isExcelDragging
                        ? 'border-emerald-600 bg-emerald-50/70 scale-[0.99]'
                        : uploadedFileName
                        ? 'border-emerald-500/80 bg-emerald-50/20 hover:bg-emerald-50/40'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <input
                      ref={excelFileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={(e) => e.target.files && handleExcelFileSelect(e.target.files[0])}
                    />

                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-emerald-600 mb-3 shadow-xs">
                      <FolderUp size={24} />
                    </div>

                    <p className="text-sm font-bold text-slate-800">
                      {uploadedFileName ? 'Choose a different Excel file' : 'Click to browse or drag & drop your Excel file here'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files exported from Microsoft Excel or Google Sheets
                    </p>
                  </div>

                  {bulkError && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{bulkError}</span>
                    </div>
                  )}
                </div>

                {/* ── STEP 3: PARSED PARTS PREVIEW & CONFIRMATION ── */}
                {parsedPartsList.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-emerald-600" />
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                            Step 3: Verification & Live Preview
                          </h4>
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                            {parsedPartsList.length} Parts Detected
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Review parsed items below. Clicking upload will store them permanently into the live catalog.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isBulkSubmitting}
                        onClick={handleBulkSubmit}
                        className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                      >
                        <Upload size={15} />
                        <span>{isBulkSubmitting ? 'Uploading to Database...' : `Upload ${parsedPartsList.length} Parts to Catalog`}</span>
                      </button>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs max-h-80 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Part Title</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Price</th>
                            <th className="p-2.5">Unit</th>
                            <th className="p-2.5">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {parsedPartsList.slice(0, 20).map((part, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">{part.code}</td>
                              <td className="p-2.5 font-semibold text-slate-800 max-w-xs truncate">{part.title}</td>
                              <td className="p-2.5 text-slate-600">{part.category}</td>
                              <td className="p-2.5">
                                {Number(part.price) > 0 ? (
                                  <span className="font-mono font-bold text-[#0745A7]">₹{Number(part.price).toLocaleString('en-IN')}</span>
                                ) : (
                                  <span className="inline-block bg-blue-50 text-[#0745A7] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                                    Price on Request
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-500">{part.unit}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${part.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {part.inStock ? `${part.stockCount} in stock` : 'Out of Stock'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {parsedPartsList.length > 20 && (
                      <p className="text-xs text-slate-400 text-center">
                        + {parsedPartsList.length - 20} more parts included in this upload batch.
                      </p>
                    )}
                  </div>
                )}

                {/* ── EXPANDABLE MANUAL CSV / JSON TEXT PASTE OPTION ── */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowManualPaste(!showManualPaste)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    {showManualPaste ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>Prefer to paste raw CSV or JSON text directly?</span>
                  </button>

                  {showManualPaste && (
                    <div className="mt-3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-medium">Paste CSV or JSON array:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const sampleCSV = `code,title,price,category,unit,moq\n` +
                              templateSampleRows.map(r => `${r.code},"${r.title}",${r.price},${r.category},${r.unit},${r.moq}`).join('\n');
                            setBulkInput(sampleCSV);
                            parseCSVText(sampleCSV);
                          }}
                          className="text-xs font-bold text-[#0745A7] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy size={12} />
                          <span>Insert Sample CSV Rows</span>
                        </button>
                      </div>

                      <textarea
                        rows={6}
                        value={bulkInput}
                        onChange={(e) => {
                          setBulkInput(e.target.value);
                          if (e.target.value.trim().startsWith('[')) {
                            try {
                              const json = JSON.parse(e.target.value);
                              processParsedData(json);
                            } catch (_) {}
                          } else {
                            parseCSVText(e.target.value);
                          }
                        }}
                        placeholder={`code,title,price,category,unit\nSB-101,Traction Machine 1000kg,185000,Traction & Motors,Set`}
                        className="w-full font-mono text-xs p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0745A7]"
                      />
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── TAB 3: MANAGE & DELETE PARTS ── */}
            {activeTab === 'manage' && (
              <div className="space-y-4">
                
                {/* Search Bar & Danger Clear Button */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Search parts by title, code, or category..."
                      value={manageSearch}
                      onChange={(e) => setManageSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0745A7]"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      Showing <strong>{managedParts.length}</strong> of {parts.length} parts
                    </span>
                    {parts.length > 0 && (
                      <button
                        type="button"
                        onClick={handleOpenClearModal}
                        className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Clear all parts from catalog"
                      >
                        <Trash2 size={13} />
                        <span>Clear All Parts</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Parts Table */}
                <div className="border border-slate-300 rounded-xl overflow-x-auto shadow-2xs bg-white">
                  <table className="w-full min-w-[550px] text-xs text-left border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2.5 sm:p-3 border border-slate-300">Code</th>
                        <th className="p-2.5 sm:p-3 border border-slate-300">Title</th>
                        <th className="p-2.5 sm:p-3 border border-slate-300">Category</th>
                        <th className="p-2.5 sm:p-3 border border-slate-300">Price</th>
                        <th className="p-2.5 sm:p-3 border border-slate-300 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managedParts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 border border-slate-300">
                            No parts currently found in catalog. Use "Add Single Part" or "Bulk Excel Upload" above.
                          </td>
                        </tr>
                      ) : (
                        managedParts.map((part, idx) => (
                          <tr key={`${part.id || part.code || 'part'}-${idx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 sm:p-3 border border-slate-300 font-mono font-bold text-slate-900">{part.code || part.id}</td>
                            <td className="p-2.5 sm:p-3 border border-slate-300 font-semibold text-slate-800 max-w-xs truncate">{part.title}</td>
                            <td className="p-2.5 sm:p-3 border border-slate-300 text-slate-600">{part.category}</td>
                            <td className="p-2.5 sm:p-3 border border-slate-300">
                              {Number(part.price) > 0 ? (
                                <span className="font-mono font-bold text-slate-900">₹{Number(part.price).toLocaleString('en-IN')}</span>
                              ) : (
                                <span className="text-[#0745A7] text-xs font-semibold">
                                  Price on Request
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 sm:p-3 border border-slate-300 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(part)}
                                  className="text-[#0745A7] hover:text-blue-900 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title="Edit part information and price"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingId === (part.id || part.code)}
                                  onClick={() => handleDeletePart(part, part.title)}
                                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title="Permanently delete this part from database"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── EDIT PART IN-PAGE MODAL ── */}
                {editingPart && editFormData && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
                      
                      {/* Modal Header */}
                      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0745A7] flex items-center justify-center">
                            <Edit3 size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                              Edit Part Information
                            </h3>
                            <p className="text-xs text-slate-500 font-mono">
                              Code: <strong>{editFormData.originalCode}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Modal Form Body */}
                      <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-5 sm:p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Part Title */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Part Title / Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={editFormData.title}
                              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Part Code */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Part Code (SKU)
                            </label>
                            <input
                              type="text"
                              value={editFormData.code}
                              onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none font-mono"
                            />
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Category
                            </label>
                            <select
                              value={editFormData.category}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            >
                              {categoriesList.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Price (INR ₹) <span className="text-slate-400 font-normal lowercase">(optional - leave blank for Quote)</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0 (Price on Request)"
                              value={editFormData.price}
                              onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none font-mono font-bold"
                            />
                          </div>

                          {/* Unit */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Unit (e.g. Piece, Set)
                            </label>
                            <input
                              type="text"
                              value={editFormData.unit}
                              onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* MOQ */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Minimum Order Quantity (MOQ)
                            </label>
                            <input
                              type="text"
                              value={editFormData.moq}
                              onChange={(e) => setEditFormData({ ...editFormData, moq: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Badge */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Classification Badge
                            </label>
                            <input
                              type="text"
                              value={editFormData.badge}
                              onChange={(e) => setEditFormData({ ...editFormData, badge: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Stock Status & Count */}
                          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={editFormData.inStock}
                                onChange={(e) => setEditFormData({ ...editFormData, inStock: e.target.checked })}
                                className="w-4 h-4 text-[#0745A7] rounded"
                              />
                              <span>In Stock</span>
                            </label>
                            <div className="flex-1">
                              <input
                                type="number"
                                min="0"
                                placeholder="Qty"
                                value={editFormData.stockCount}
                                onChange={(e) => setEditFormData({ ...editFormData, stockCount: e.target.value })}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Lead Time */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Lead Time
                            </label>
                            <input
                              type="text"
                              value={editFormData.leadTime}
                              onChange={(e) => setEditFormData({ ...editFormData, leadTime: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Warranty */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Warranty
                            </label>
                            <input
                              type="text"
                              value={editFormData.warranty}
                              onChange={(e) => setEditFormData({ ...editFormData, warranty: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Compliance */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Compliance Standard
                            </label>
                            <input
                              type="text"
                              value={editFormData.compliance}
                              onChange={(e) => setEditFormData({ ...editFormData, compliance: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Image Upload Box (Supports Multiple Images for Carousel) */}
                          <div className="sm:col-span-2 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700 uppercase">
                                Product Images (Upload Multiple for Card Carousel)
                              </label>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {(editFormData.images || []).length} image(s) selected
                              </span>
                            </div>

                            <div className="space-y-3">
                              {/* Drag & Drop File Upload Box */}
                              <div
                                onDragEnter={(e) => { e.preventDefault(); setEditDragActive(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setEditDragActive(false); }}
                                onDragOver={(e) => { e.preventDefault(); setEditDragActive(true); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setEditDragActive(false);
                                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    handleEditMultipleImageFiles(e.dataTransfer.files);
                                  }
                                }}
                                onClick={() => editFileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                                  editDragActive
                                    ? 'border-[#0745A7] bg-blue-50/70 scale-[0.99]'
                                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#0745A7]/60'
                                }`}
                              >
                                <input
                                  ref={editFileInputRef}
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => e.target.files && handleEditMultipleImageFiles(e.target.files)}
                                />
                                {isEditingUploadingImage ? (
                                  <div className="py-2">
                                    <RefreshCw size={20} className="mx-auto text-[#0745A7] mb-2 animate-spin" />
                                    <p className="text-xs font-bold text-[#0745A7]">{editImageUploadStatus || 'Saving images...'}</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-[#0745A7] mb-2 shadow-2xs">
                                      <Upload size={18} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-800">
                                      Click to upload multiple images or drag files here
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      PNG, JPG, WEBP automatically saved to uploads folder
                                    </p>
                                  </>
                                )}
                                {editImageUploadStatus && (
                                  <p className={`text-[11px] font-semibold mt-1.5 ${editImageUploadStatus.includes('✓') ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {editImageUploadStatus}
                                  </p>
                                )}
                              </div>

                              {/* Paste direct web image link */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Or paste web image link (https://...)"
                                  value={editImageUrlInput}
                                  onChange={(e) => setEditImageUrlInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleEditAddImageUrl();
                                    }
                                  }}
                                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleEditAddImageUrl}
                                  className="px-4 py-2 bg-[#0745A7] hover:bg-[#053787] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs whitespace-nowrap transition-colors"
                                >
                                  + Add URL
                                </button>
                              </div>

                              {/* Uploaded Images Gallery Thumbnails */}
                              {editFormData.images && editFormData.images.length > 0 ? (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span>Carousel Images ({editFormData.images.length})</span>
                                    <span className="text-[11px] text-slate-400 font-normal">First image is the primary cover</span>
                                  </div>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                    {editFormData.images.map((imgUrl, imgIdx) => (
                                      <div
                                        key={imgIdx}
                                        className={`relative group bg-white border rounded-xl p-1 overflow-hidden shadow-2xs aspect-square flex items-center justify-center ${
                                          imgIdx === 0 ? 'border-[#0745A7] ring-2 ring-[#0745A7]/30' : 'border-slate-200'
                                        }`}
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Part view ${imgIdx + 1}`}
                                          className="w-full h-full object-contain"
                                        />

                                        {/* Cover badge */}
                                        {imgIdx === 0 && (
                                          <span className="absolute top-1 left-1 bg-[#0745A7] text-white text-[8px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                                            Cover
                                          </span>
                                        )}

                                        {/* Action buttons on hover */}
                                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                          {imgIdx !== 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleEditSetCoverImage(imgIdx)}
                                              className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded text-[9px] font-bold shadow-xs cursor-pointer"
                                              title="Set as Main Cover"
                                            >
                                              Main
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleEditRemoveImage(imgIdx)}
                                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded shadow-xs cursor-pointer"
                                            title="Remove image"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
                                  <AlertCircle size={14} className="shrink-0 text-slate-300" />
                                  <span>No image selected. Default OEM illustration will be used.</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Description & Technical Notes
                            </label>
                            <textarea
                              rows={3}
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0745A7] focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Technical Specs */}
                          <div className="sm:col-span-2 border-t border-slate-200 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-700 uppercase">
                                Technical Specifications
                              </span>
                              <button
                                type="button"
                                onClick={addEditSpecRow}
                                className="text-xs font-bold text-[#0745A7] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={13} />
                                <span>Add Parameter</span>
                              </button>
                            </div>

                            {editSpecRows.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No technical parameters added yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {editSpecRows.map((spec, sIdx) => (
                                  <div key={sIdx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Parameter (e.g. Voltage)"
                                      value={spec.parameter}
                                      onChange={(e) => updateEditSpecRow(sIdx, 'parameter', e.target.value)}
                                      className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Value (e.g. 415V AC)"
                                      value={spec.value}
                                      onChange={(e) => updateEditSpecRow(sIdx, 'value', e.target.value)}
                                      className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Standard (e.g. EN 81-20)"
                                      value={spec.standard}
                                      onChange={(e) => updateEditSpecRow(sIdx, 'standard', e.target.value)}
                                      className="w-28 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeEditSpecRow(sIdx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Modal Footer Controls */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingEdit}
                            className="bg-[#0745A7] hover:bg-[#053787] active:scale-95 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Save size={14} />
                            <span>{isSavingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
                          </button>
                        </div>
                      </form>

                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      {/* Logout Confirmation Modal Dialog */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-center space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
              <LogOut size={26} />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">Confirm Logout</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to log out of the SB Elevators Admin Panel?
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0745A7] hover:bg-[#053787] active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM CLEAR ALL PARTS DIALOG MODAL ── */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Clear All Parts from Catalog?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This will permanently delete all <strong>{parts.length}</strong> catalog items from the database. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                To confirm, please type <strong className="text-rose-600 font-mono">delete</strong> below:
              </label>
              <input
                type="text"
                autoFocus
                placeholder='Type "delete"'
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && clearConfirmText.trim().toLowerCase() === 'delete') {
                    e.preventDefault();
                    handleConfirmClearAll();
                  }
                }}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseClearModal}
                disabled={isClearingAll}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearConfirmText.trim().toLowerCase() !== 'delete' || isClearingAll}
                onClick={handleConfirmClearAll}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  clearConfirmText.trim().toLowerCase() === 'delete' && !isClearingAll
                    ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isClearingAll ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Clearing Catalog...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Permanently Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
