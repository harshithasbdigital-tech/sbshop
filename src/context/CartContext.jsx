import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'sb_elevator_rfq_cart';
const BUYER_STORAGE_KEY = 'sb_elevator_buyer_details';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [buyerInfo, setBuyerInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(BUYER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        companyName: '',
        contactPerson: '',
        phone: '',
        gstin: '',
        deliveryLocation: '',
        notes: ''
      };
    } catch {
      return {
        companyName: '',
        contactPerson: '',
        phone: '',
        gstin: '',
        deliveryLocation: '',
        notes: ''
      };
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Sync buyer info to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify(buyerInfo));
    } catch (e) {
      console.warn('Failed to save buyer info to localStorage', e);
    }
  }, [buyerInfo]);

  const updateBuyerInfo = (field, value) => {
    setBuyerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addToCart = (part, quantity = 1) => {
    // Parse MOQ if integer
    const moqNumber = parseInt(part.moq) || 1;
    const addQty = Math.max(quantity, moqNumber);

    setCartItems(prev => {
      const existing = prev.find(item => item.part.id === part.id || item.part.code === part.code);
      if (existing) {
        return prev.map(item => 
          (item.part.id === part.id || item.part.code === part.code)
            ? { ...item, quantity: item.quantity + addQty }
            : item
        );
      }
      return [...prev, { part, quantity: addQty }];
    });
  };

  const updateQuantity = (partCode, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(partCode);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.part.code === partCode ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (partCode) => {
    setCartItems(prev => prev.filter(item => item.part.code !== partCode));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const itemCount = cartItems.length;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.part.price * item.quantity), 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount;

  // Format currency in Indian numbering (e.g. ₹ 1,85,000)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Generate standardized itemized Bill of Materials (BOM) quote
  const generateBOMText = () => {
    const timestamp = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const rfqRef = `RFQ-SB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let text = `*SB ELEVATORS | OFFICIAL B2B RFQ QUOTATION*\n`;
    text += `*Elevator Spare Parts & OEM Components Division*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📄 *RFQ Reference:* ${rfqRef}\n`;
    text += `⏱️ *Generated:* ${timestamp}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🏢 *PROCUREMENT / CONTRACTOR DETAILS:*\n`;
    text += `• *Company:* ${buyerInfo.companyName || 'Not Specified (Direct Buyer)'}\n`;
    if (buyerInfo.contactPerson) text += `• *Contact Person:* ${buyerInfo.contactPerson}\n`;
    if (buyerInfo.phone) text += `• *Phone:* ${buyerInfo.phone}\n`;
    if (buyerInfo.gstin) text += `• *GSTIN:* ${buyerInfo.gstin.toUpperCase()}\n`;
    if (buyerInfo.deliveryLocation) text += `• *Delivery Location / PIN:* ${buyerInfo.deliveryLocation}\n`;
    text += `\n`;

    text += `📦 *ITEMIZED BILL OF MATERIALS (BOM):*\n`;
    cartItems.forEach((item, index) => {
      const lineTotal = item.part.price * item.quantity;
      text += `${index + 1}. *[${item.part.code}]* ${item.part.title}\n`;
      text += `   • Category: ${item.part.category}\n`;
      text += `   • Quantity: *${item.quantity} ${item.part.unit || 'Units'}*\n`;
      text += `   • Unit Price: ${formatCurrency(item.part.price)} (Excl. GST)\n`;
      text += `   • Line Total: *${formatCurrency(lineTotal)}*\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📊 *COMMERCIAL SUMMARY:*\n`;
    text += `• Total Items: ${itemCount} line items (${totalQuantity} units)\n`;
    text += `• Subtotal: *${formatCurrency(subtotal)}*\n`;
    text += `• Est. GST (18%): ${formatCurrency(gstAmount)}\n`;
    text += `• *TOTAL ESTIMATED RFQ VALUE:* *${formatCurrency(grandTotal)}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🚚 *Fulfillment Terms:*\n`;
    text += `• Lead Time: Immediate Same-Day Dispatch / 24-48h\n`;
    text += `• All parts OEM tested with test certificates\n`;
    text += `• Please confirm lead time and formal commercial proforma invoice.\n`;

    if (buyerInfo.notes) {
      text += `\n📝 *Special Contractor Notes:*\n${buyerInfo.notes}\n`;
    }

    return text;
  };

  const openWhatsAppCheckout = () => {
    const bomText = generateBOMText();
    const encodedText = encodeURIComponent(bomText);
    const whatsappUrl = `https://wa.me/918048956234?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        buyerInfo,
        updateBuyerInfo,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        itemCount,
        totalQuantity,
        subtotal,
        gstAmount,
        grandTotal,
        formatCurrency,
        generateBOMText,
        openWhatsAppCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
