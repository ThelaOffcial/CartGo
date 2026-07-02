/**
 * CartGo - Shopping Cart Module
 * Handles cart operations: add, remove, update quantity, apply coupons
 */

import {
  auth,
  database,
  readData,
  writeData,
  updateData,
  listenToData,
  logAnalyticsEvent
} from './firebase.js';

import {
  Alert,
  Storage,
  NumUtil,
  ArrUtil
} from './utils.js';

from { getProductById } from './products.js';

// Cart state
let cart = [];
const CART_STORAGE_KEY = 'cartgo_cart';
const GUEST_CART_DB_KEY = 'guest_carts';
let cartUnsubscribe = null;

/**
 * Initialize Cart Module
 */
export const initCart = async () => {
  try {
    console.log('✓ Initializing Cart Module');
    
    const userId = auth.currentUser?.uid;
    if (userId) {
      listenToUserCart(userId);
    } else {
      loadGuestCart();
    }
  } catch (error) {
    console.error('Cart init error:', error);
  }
};

/**
 * Load Guest Cart from LocalStorage
 */
const loadGuestCart = () => {
  const savedCart = Storage.get(CART_STORAGE_KEY);
  cart = savedCart || [];
  console.log(`✓ Loaded guest cart with ${cart.length} items`);
};

/**
 * Listen to User Cart from Database
 */
const listenToUserCart = (userId) => {
  cartUnsubscribe = listenToData(`cart/${userId}`, (data) => {
    cart = data ? Object.values(data) : [];
    console.log(`✓ Synced user cart with ${cart.length} items`);
  });
};

/**
 * Get Cart Items
 */
export const getCart = () => {
  return [...cart];
};

/**
 * Get Cart Item Count
 */
export const getCartCount = () => {
  return cart.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Get Cart Subtotal
 */
export const getCartSubtotal = () => {
  return NumUtil.round(
    cart.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + (price * item.quantity);
    }, 0)
  );
};

/**
 * Get Cart Total with Tax
 */
export const getCartTotal = (taxPercent = 0) => {
  const subtotal = getCartSubtotal();
  const tax = NumUtil.calculateTax(subtotal, taxPercent);
  return NumUtil.round(subtotal + tax);
};

/**
 * Add Item to Cart
 */
export const addToCart = async (product, quantity = 1) => {
  try {
    // Validate inputs
    if (!product || !product.id) {
      Alert.error('Error', 'Invalid product');
      return false;
    }

    if (quantity < 1) {
      Alert.error('Error', 'Quantity must be at least 1');
      return false;
    }

    if (product.stock < quantity) {
      Alert.error('Error', `Only ${product.stock} items available`);
      return false;
    }

    // Check if item already in cart
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        Alert.error('Error', `Only ${product.stock} items available`);
        return false;
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice || null,
        discount: product.discount || 0,
        image: product.images?.[0] || '',
        quantity: quantity,
        stock: product.stock,
        sku: product.sku || '',
        addedAt: new Date().toISOString()
      });
    }

    // Save cart
    await saveCart();

    Alert.success('Success', `${product.name} added to cart!`);

    // Log analytics
    logAnalyticsEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      price: product.price
    });

    return true;
  } catch (error) {
    console.error('Add to cart error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

/**
 * Remove Item from Cart
 */
export const removeFromCart = async (productId) => {
  try {
    const index = cart.findIndex(item => item.id === productId);

    if (index === -1) {
      Alert.error('Error', 'Item not found in cart');
      return false;
    }

    const removedItem = cart[index];
    cart.splice(index, 1);

    await saveCart();

    Alert.success('Success', 'Item removed from cart');

    logAnalyticsEvent('remove_from_cart', {
      productId: productId,
      productName: removedItem.name
    });

    return true;
  } catch (error) {
    console.error('Remove from cart error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

/**
 * Update Cart Item Quantity
 */
export const updateCartQuantity = async (productId, quantity) => {
  try {
    if (quantity < 1) {
      return removeFromCart(productId);
    }

    const item = cart.find(item => item.id === productId);

    if (!item) {
      Alert.error('Error', 'Item not found in cart');
      return false;
    }

    if (item.stock < quantity) {
      Alert.error('Error', `Only ${item.stock} items available`);
      return false;
    }

    item.quantity = quantity;
    await saveCart();

    logAnalyticsEvent('update_cart_quantity', {
      productId: productId,
      quantity: quantity
    });

    return true;
  } catch (error) {
    console.error('Update quantity error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

/**
 * Increase Item Quantity
 */
export const increaseQuantity = async (productId) => {
  const item = cart.find(item => item.id === productId);
  if (item) {
    return updateCartQuantity(productId, item.quantity + 1);
  }
  return false;
};

/**
 * Decrease Item Quantity
 */
export const decreaseQuantity = async (productId) => {
  const item = cart.find(item => item.id === productId);
  if (item) {
    if (item.quantity === 1) {
      return removeFromCart(productId);
    }
    return updateCartQuantity(productId, item.quantity - 1);
  }
  return false;
};

/**
 * Clear Cart
 */
export const clearCart = async () => {
  try {
    const confirmed = await Alert.confirm(
      'Clear Cart',
      'Are you sure you want to clear your cart?'
    );

    if (!confirmed.isConfirmed) {
      return false;
    }

    cart = [];
    await saveCart();

    Alert.success('Success', 'Cart cleared');

    logAnalyticsEvent('cart_cleared');

    return true;
  } catch (error) {
    console.error('Clear cart error:', error);
    return false;
  }
};

/**
 * Save Cart
 */
const saveCart = async () => {
  try {
    const userId = auth.currentUser?.uid;

    if (userId) {
      // Save to database for logged-in user
      const cartData = {};
      cart.forEach((item, index) => {
        cartData[index] = item;
      });
      await writeData(`cart/${userId}`, cartData);
    } else {
      // Save to localStorage for guest
      Storage.set(CART_STORAGE_KEY, cart);
    }
  } catch (error) {
    console.error('Save cart error:', error);
  }
};

/**
 * Sync Guest Cart to User Cart
 */
export const syncGuestCartToUser = async (userId) => {
  try {
    const guestCart = Storage.get(CART_STORAGE_KEY);

    if (guestCart && guestCart.length > 0) {
      const userCart = await readData(`cart/${userId}`);
      let mergedCart = userCart ? Object.values(userCart) : [];

      // Merge guest cart items
      guestCart.forEach(guestItem => {
        const existingItem = mergedCart.find(item => item.id === guestItem.id);
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          mergedCart.push(guestItem);
        }
      });

      // Save merged cart
      const cartData = {};
      mergedCart.forEach((item, index) => {
        cartData[index] = item;
      });
      await writeData(`cart/${userId}`, cartData);

      // Clear guest cart
      Storage.remove(CART_STORAGE_KEY);

      console.log('✓ Guest cart synced to user cart');
    }
  } catch (error) {
    console.error('Sync cart error:', error);
  }
};

/**
 * Get Cart Summary
 */
export const getCartSummary = () => {
  const subtotal = getCartSubtotal();
  const itemCount = getCartCount();

  return {
    itemCount: itemCount,
    itemsCount: cart.length,
    subtotal: subtotal,
    displaySubtotal: NumUtil.formatCurrency(subtotal)
  };
};

/**
 * Apply Coupon
 */
export const applyCoupon = async (couponCode) => {
  try {
    if (!couponCode.trim()) {
      Alert.error('Error', 'Please enter a coupon code');
      return false;
    }

    Alert.loading('Applying coupon...');

    // Get coupon from database
    const coupons = await readData('coupons');
    const coupon = coupons ? Object.values(coupons).find(
      c => c.code.toUpperCase() === couponCode.toUpperCase()
    ) : null;

    if (!coupon) {
      Alert.close();
      Alert.error('Error', 'Coupon code not found');
      return false;
    }

    // Check if coupon is valid
    if (!coupon.active) {
      Alert.close();
      Alert.error('Error', 'Coupon is not active');
      return false;
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      Alert.close();
      Alert.error('Error', 'Coupon has expired');
      return false;
    }

    if (coupon.minPurchase && getCartSubtotal() < coupon.minPurchase) {
      Alert.close();
      Alert.error('Error', `Minimum purchase of ${NumUtil.formatCurrency(coupon.minPurchase)} required`);
      return false;
    }

    if (coupon.maxUses && coupon.used >= coupon.maxUses) {
      Alert.close();
      Alert.error('Error', 'Coupon usage limit reached');
      return false;
    }

    Alert.close();
    Alert.success('Success', `Coupon applied! ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : NumUtil.formatCurrency(coupon.discountValue)} off`);

    logAnalyticsEvent('coupon_applied', {
      couponCode: couponCode,
      discountValue: coupon.discountValue
    });

    return coupon;
  } catch (error) {
    Alert.close();
    console.error('Apply coupon error:', error);
    Alert.error('Error', error.message);
    return false;
  }
};

/**
 * Calculate Discount
 */
export const calculateCouponDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;

  if (coupon.discountType === 'percentage') {
    return NumUtil.round(subtotal * (coupon.discountValue / 100));
  } else {
    return Math.min(coupon.discountValue, subtotal);
  }
};

/**
 * Check Cart Validity
 */
export const isCartValid = () => {
  return cart.length > 0;
};

/**
 * Export Cart as JSON
 */
export const exportCart = () => {
  return JSON.stringify(cart, null, 2);
};

/**
 * Import Cart from JSON
 */
export const importCart = async (jsonData) => {
  try {
    const importedCart = JSON.parse(jsonData);
    if (Array.isArray(importedCart)) {
      cart = importedCart;
      await saveCart();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Import cart error:', error);
    return false;
  }
};

/**
 * Cleanup Cart Module
 */
export const cleanupCart = () => {
  if (cartUnsubscribe) {
    cartUnsubscribe();
  }
};

export default {
  initCart,
  getCart,
  getCartCount,
  getCartSubtotal,
  getCartTotal,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  syncGuestCartToUser,
  getCartSummary,
  applyCoupon,
  calculateCouponDiscount,
  isCartValid,
  exportCart,
  importCart,
  cleanupCart
};