const STORAGE_KEY = 'sb_elevator_spare_parts';
const DELETED_IDS_KEY = 'sb_deleted_part_ids';
const CLEARED_FLAG_KEY = 'sb_catalog_cleared';

// Track deleted IDs, codes, and titles in localStorage so deleted parts stay permanently removed
export const getDeletedIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addDeletedIdentifier = (idOrCode) => {
  try {
    const clean = String(idOrCode || '').trim();
    if (!clean) return;
    const existing = getDeletedIds();
    if (!existing.includes(clean)) {
      existing.push(clean);
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(existing));
    }
  } catch {}
};

export const removeDeletedIdentifier = (idOrCode) => {
  try {
    const clean = String(idOrCode || '').trim();
    if (!clean) return;
    const existing = getDeletedIds();
    const filtered = existing.filter(item => item !== clean);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(filtered));
  } catch {}
};

// Helper to flatten and unwrap parts from any API / JSON response structure
export const unwrapParts = (data) => {
  if (!data) return [];
  const list = [];
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item && item.bulk && Array.isArray(item.bulk)) {
        list.push(...item.bulk);
      } else if (item && typeof item === 'object') {
        list.push(item);
      }
    });
  } else if (data && data.bulk && Array.isArray(data.bulk)) {
    list.push(...data.bulk);
  } else if (data && Array.isArray(data.data)) {
    list.push(...data.data);
  }
  return list;
};

export const normalizePart = (p) => {
  const codeVal = p.code !== undefined && p.code !== null && String(p.code).trim() !== ''
    ? String(p.code).trim()
    : (p.itemCode ? String(p.itemCode).trim() : (p.id ? String(p.id).trim() : `SB-${Date.now()}`));

  const titleVal = p.title !== undefined && p.title !== null && String(p.title).trim() !== ''
    ? String(p.title).trim()
    : (p.name ? String(p.name).trim() : 'Elevator Spare Part');

  const idVal = p.id ? String(p.id).trim() : codeVal;

  // Helper to check if URL is the generic placeholder image
  const isDefaultUnsplash = (url) => {
    return typeof url === 'string' && url.includes('photo-1581092160607-ee22621dd758');
  };

  // Process multiple images array
  let imagesVal = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    imagesVal = p.images.filter(img => typeof img === 'string' && img.trim() && !isDefaultUnsplash(img));
  } else if (typeof p.images === 'string' && p.images.trim()) {
    imagesVal = p.images.split(',').map(s => s.trim()).filter(img => Boolean(img) && !isDefaultUnsplash(img));
  }
  if (p.image && typeof p.image === 'string' && p.image.trim() && !isDefaultUnsplash(p.image) && !imagesVal.includes(p.image.trim())) {
    imagesVal.unshift(p.image.trim());
  }
  const primaryImage = imagesVal[0] || (typeof p.image === 'string' && !isDefaultUnsplash(p.image) ? p.image.trim() : '');

  return {
    ...p,
    id: idVal,
    itemCode: codeVal,
    code: codeVal,
    title: titleVal,
    price: p.price !== undefined && p.price !== null && p.price !== '' ? (Number(p.price) || 0) : 0,
    priceUnit: p.priceUnit || p.unit || 'Piece',
    unit: p.unit || p.priceUnit || 'Piece',
    category: p.category ? String(p.category).trim() : 'General Elevator Spares',
    minOrder: p.minOrder || (p.moq ? (parseInt(p.moq) || 1) : 1),
    moq: p.moq || `${p.minOrder || 1} ${p.priceUnit || 'Piece'}`,
    specs: (p.specs || []).map(s => ({
      label: s.label || s.parameter || 'Specification',
      parameter: s.parameter || s.label || 'Specification',
      value: s.value || '',
      standard: s.standard || ''
    })),
    image: primaryImage,
    images: imagesVal.length > 0 ? imagesVal : (primaryImage ? [primaryImage] : []),
    rating: Number(p.rating) || 4.8,
    reviewsCount: Number(p.reviewsCount) || 24,
    inStock: p.inStock !== false,
    stockCount: Number(p.stockCount) || 10
  };
};

export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api/parts.php';
};

export const getUploadApiUrl = () => {
  if (import.meta.env.VITE_UPLOAD_API_URL) {
    return import.meta.env.VITE_UPLOAD_API_URL;
  }
  return '/api/upload.php';
};

/**
 * Upload an image file to the server (/api/upload.php)
 * Saves file physically into /api/uploads/ and returns public URL
 */
export const uploadImageFile = async (file) => {
  if (!file) {
    return { success: false, error: 'No image file provided' };
  }

  // 1. Try real server multipart/form-data upload
  try {
    const formData = new FormData();
    formData.append('image', file);

    const uploadEndpoint = getUploadApiUrl();
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.url) {
        return {
          success: true,
          url: data.url,
          fileName: data.fileName,
          isServerUpload: true
        };
      }
    }
  } catch (err) {
    console.warn('Server upload to /api/upload.php failed, falling back to local base64:', err);
  }

  // 2. Fallback to base64 reader if server endpoint is temporarily unavailable
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        success: true,
        url: e.target.result,
        isBase64: true
      });
    };
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read image file'
      });
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Fetch cached parts from localStorage
 */
export const getCachedParts = () => {
  try {
    const isCleared = localStorage.getItem(CLEARED_FLAG_KEY) === 'true';
    if (isCleared) return [];

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        const deletedIds = getDeletedIds();
        const seen = new Set();
        const active = [];

        parsed.forEach(p => {
          const pid = String(p.id || '').trim();
          const pcode = String(p.code || '').trim();
          const pitem = String(p.itemCode || '').trim();
          const ptitle = String(p.title || '').trim().toLowerCase();

          if (pid && deletedIds.includes(pid)) return;
          if (pcode && deletedIds.includes(pcode)) return;
          if (pitem && deletedIds.includes(pitem)) return;
          if (ptitle && deletedIds.includes(ptitle)) return;

          // Automatically purge legacy dummy parts with giant base64 dummy data
          if (pcode === 'GDB2LR-600' || (typeof p.image === 'string' && p.image.length > 50000)) return;

          const key = pcode || pid;
          if (key && seen.has(key)) return;
          if (key) seen.add(key);
          active.push(normalizePart(p));
        });

        // If duplicates or deleted parts were found in localStorage, purge them immediately
        if (active.length !== parsed.length) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
          } catch {}
        }

        return active;
      }
    }
  } catch (err) {
    console.warn('Could not read from localStorage:', err);
  }
  return [];
};

export const getStoredParts = getCachedParts;

/**
 * Save parts directly to localStorage
 */
export const saveCachedParts = (parts) => {
  try {
    const deletedIds = getDeletedIds();
    const seen = new Set();
    const deduped = [];

    parts.forEach(p => {
      const pid = String(p.id || '').trim();
      const pcode = String(p.code || '').trim();
      const pitem = String(p.itemCode || '').trim();
      const ptitle = String(p.title || '').trim().toLowerCase();

      if (pid && deletedIds.includes(pid)) return;
      if (pcode && deletedIds.includes(pcode)) return;
      if (pitem && deletedIds.includes(pitem)) return;
      if (ptitle && deletedIds.includes(ptitle)) return;

      // Do not re-save legacy dummy parts with giant base64 dummy data
      if (pcode === 'GDB2LR-600' || (typeof p.image === 'string' && p.image.length > 50000)) return;

      const key = pcode || pid;
      if (key && seen.has(key)) return;
      if (key) seen.add(key);

      deduped.push(p);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    window.dispatchEvent(new Event('parts_updated'));
  } catch (err) {
    console.warn('Could not write to localStorage:', err);
  }
};

/**
 * Fetch live parts from the Central API or parts.json
 */
export const fetchLiveParts = async () => {
  // If user explicitly cleared catalog, honor it unless new parts exist in cache
  if (localStorage.getItem(CLEARED_FLAG_KEY) === 'true') {
    return { parts: [], source: 'cleared' };
  }

  const primaryUrl = getApiUrl();
  const endpoints = [primaryUrl, '/api/parts.json'];
  const deletedIds = getDeletedIds();

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          const unwrapped = unwrapParts(data);
          
          if (unwrapped.length > 0) {
            const seen = new Set();
            const filtered = [];

            unwrapped.forEach(p => {
              const pid = String(p.id || '').trim();
              const pcode = String(p.code || '').trim();
              const pitem = String(p.itemCode || '').trim();
              const ptitle = String(p.title || '').trim().toLowerCase();

              if (pid && deletedIds.includes(pid)) return;
              if (pcode && deletedIds.includes(pcode)) return;
              if (pitem && deletedIds.includes(pitem)) return;
              if (ptitle && deletedIds.includes(ptitle)) return;

              const key = pcode || pid;
              if (key && seen.has(key)) return;
              if (key) seen.add(key);

              filtered.push(normalizePart(p));
            });

            saveCachedParts(filtered);
            return { parts: filtered, source: 'api' };
          } else if (Array.isArray(data) || (data && Array.isArray(data.data))) {
            // Server catalog is clean/empty - wipe stale cache so dummy parts do not resurrect
            saveCachedParts([]);
            return { parts: [], source: 'api' };
          }
        } catch {
          // Continue to next endpoint
        }
      }
    } catch {
      // Continue to next endpoint
    }
  }

  const cached = getCachedParts();
  return { parts: cached, source: 'cache' };
};

/**
 * Upload single part to Central API & local state
 */
export const uploadPart = async (newPart) => {
  localStorage.removeItem(CLEARED_FLAG_KEY);
  const normalized = normalizePart(newPart);

  // If this part ID or code or title was previously marked deleted, un-mark it
  removeDeletedIdentifier(normalized.id);
  removeDeletedIdentifier(normalized.code);
  removeDeletedIdentifier(normalized.title.toLowerCase());

  const apiUrl = getApiUrl();
  let apiSuccess = false;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalized),
    });

    if (response.ok) {
      apiSuccess = true;
    }
  } catch (err) {
    console.warn(`Could not sync to remote API ${apiUrl}:`, err);
  }

  const current = getCachedParts();
  const updated = [
    normalized,
    ...current.filter(p => p.id !== normalized.id && p.code !== normalized.code)
  ];
  saveCachedParts(updated);

  return {
    success: true,
    part: normalized,
    syncedToApi: apiSuccess
  };
};

/**
 * Update an existing part
 */
export const updatePart = async (updatedPart, originalCode = null) => {
  localStorage.removeItem(CLEARED_FLAG_KEY);
  const normalized = normalizePart(updatedPart);

  if (originalCode && originalCode !== normalized.code) {
    removeDeletedIdentifier(originalCode);
  }
  removeDeletedIdentifier(normalized.id);
  removeDeletedIdentifier(normalized.code);
  removeDeletedIdentifier(normalized.title.toLowerCase());

  const apiUrl = getApiUrl();
  let apiSuccess = false;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalized),
    });

    if (response.ok) {
      apiSuccess = true;
    }
  } catch (err) {
    console.warn(`Could not sync update to remote API ${apiUrl}:`, err);
  }

  const current = getCachedParts();
  const oldKey = originalCode || normalized.code || normalized.id;
  const filtered = current.filter(p => p.id !== oldKey && p.code !== oldKey && p.itemCode !== oldKey && p.id !== normalized.id && p.code !== normalized.code);
  const updated = [normalized, ...filtered];
  saveCachedParts(updated);

  return {
    success: true,
    part: normalized,
    syncedToApi: apiSuccess
  };
};

/**
 * Bulk upload array of parts
 */
export const bulkUploadParts = async (partsArray) => {
  localStorage.removeItem(CLEARED_FLAG_KEY);
  const normalizedList = partsArray.map(normalizePart);

  // Unmark any of these parts if previously marked deleted
  normalizedList.forEach(p => {
    removeDeletedIdentifier(p.id);
    removeDeletedIdentifier(p.code);
    removeDeletedIdentifier(p.title.toLowerCase());
  });

  const apiUrl = getApiUrl();
  let apiSuccess = false;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bulk: normalizedList }),
    });

    if (response.ok) {
      apiSuccess = true;
    }
  } catch (err) {
    console.warn(`Could not sync bulk parts to ${apiUrl}:`, err);
  }

  const current = getCachedParts();
  const updated = [...normalizedList, ...current];
  
  // Deduplicate by code or id
  const seen = new Set();
  const deduped = updated.filter(p => {
    const key = p.code || p.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  saveCachedParts(deduped);

  return {
    success: true,
    count: normalizedList.length,
    parts: deduped,
    syncedToApi: apiSuccess
  };
};

/**
 * Delete a part by object or ID/code permanently
 */
export const deletePart = async (target, maybeCode = null) => {
  const identifiers = new Set();

  if (target && typeof target === 'object') {
    if (target.id) identifiers.add(String(target.id).trim());
    if (target.code) identifiers.add(String(target.code).trim());
    if (target.itemCode) identifiers.add(String(target.itemCode).trim());
    if (target.title) identifiers.add(String(target.title).trim().toLowerCase());
  } else if (target) {
    identifiers.add(String(target).trim());
    if (maybeCode) identifiers.add(String(maybeCode).trim());
  }

  // Register in permanent deletion registry
  identifiers.forEach(id => {
    if (id) addDeletedIdentifier(id);
  });

  // Try remote API delete
  const apiUrl = getApiUrl();
  let apiSuccess = false;

  const targetId = target && typeof target === 'object' ? (target.id || target.code) : target;
  const targetCode = target && typeof target === 'object' ? target.code : maybeCode;

  try {
    let queryParams = `id=${encodeURIComponent(targetId || '')}`;
    if (targetCode) queryParams += `&code=${encodeURIComponent(targetCode)}`;
    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      apiSuccess = true;
    }
  } catch (err) {
    console.warn(`Could not delete part from ${apiUrl}:`, err);
  }

  // Immediate local cache removal
  const current = getCachedParts();
  const updated = current.filter(p => {
    const pid = String(p.id || '').trim();
    const pcode = String(p.code || '').trim();
    const pitem = String(p.itemCode || '').trim();
    const ptitle = String(p.title || '').trim().toLowerCase();

    for (const id of identifiers) {
      if (pid === id || pcode === id || pitem === id || ptitle === id) {
        return false;
      }
    }
    return true;
  });

  saveCachedParts(updated);

  return {
    success: true,
    remainingCount: updated.length,
    parts: updated,
    syncedToApi: apiSuccess
  };
};

/**
 * Clear all parts (Wipe catalog permanently)
 */
export const clearAllParts = async () => {
  localStorage.setItem(CLEARED_FLAG_KEY, 'true');
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DELETED_IDS_KEY);

  const apiUrl = getApiUrl();
  try {
    await fetch(`${apiUrl}?clear_all=true`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Could not clear remote API:', err);
  }

  window.dispatchEvent(new Event('parts_updated'));
  return { success: true, parts: [] };
};
