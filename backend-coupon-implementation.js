// Enhanced Backend Coupon Implementation with Strict Conditions
// Add this to your existing GET /fetch/:userId/cart endpoint

app.get('/fetch/:userId/cart', async (req, res) => {
  try {
    const { userId } = req.params;
    const { applyCoupon, removeCoupon } = req.query;
    
    // Get current cart items
    const cartItems = await getUserCartItems(userId); // Your existing logic
    
    // Calculate item total (sum of all cart items)
    const itemTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let appliedCoupon = null;
    let discountAmount = 0;
    let totalValue = itemTotal;
    
    // Handle apply coupon with strict validation
    if (applyCoupon) {
      const couponValidation = await validateCouponStrict(applyCoupon, userId, cartItems, itemTotal);
      
      if (couponValidation.isValid) {
        appliedCoupon = couponValidation.coupon;
        discountAmount = couponValidation.discountAmount;
        totalValue = itemTotal - discountAmount;
        
        // Store applied coupon in user's cart
        await storeAppliedCoupon(userId, applyCoupon);
      } else {
        return res.status(400).json({
          success: false,
          message: couponValidation.errorMessage
        });
      }
    }
    
    // Handle remove coupon
    if (removeCoupon === 'true') {
      await removeAppliedCoupon(userId);
      appliedCoupon = null;
      discountAmount = 0;
      totalValue = itemTotal;
    }
    
    // Check if user has a previously applied coupon (if no query params)
    if (!applyCoupon && !removeCoupon) {
      const storedCouponCode = await getUserAppliedCoupon(userId);
      if (storedCouponCode) {
        const couponValidation = await validateCouponStrict(storedCouponCode, userId, cartItems, itemTotal);
        if (couponValidation.isValid) {
          appliedCoupon = couponValidation.coupon;
          discountAmount = couponValidation.discountAmount;
          totalValue = itemTotal - discountAmount;
        } else {
          // Remove invalid stored coupon
          await removeAppliedCoupon(userId);
        }
      }
    }
    
    // Return updated cart response
    res.json({
      message: "Cart fetched successfully.",
      data: {
        cartItems: cartItems,
        itemTotal: itemTotal,           // Sum of all cart items
        appliedCoupon: appliedCoupon,   // Applied coupon object (null if none)
        discountAmount: discountAmount, // Calculated discount amount
        totalValue: totalValue         // Final amount after discount
      }
    });
    
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ 
      message: "Error fetching cart",
      error: error.message 
    });
  }
});

// Strict coupon validation function
async function validateCouponStrict(couponCode, userId, cartItems, itemTotal) {
  try {
    // 1. Check if coupon exists
    const coupon = await db.collection('coupons').findOne({ code: couponCode });
    if (!coupon) {
      return { isValid: false, errorMessage: "Invalid coupon code" };
    }
    
    // 2. Check if coupon is expired
    if (coupon.expirationDate) {
      const expiryDate = new Date(coupon.expirationDate);
      const currentDate = new Date();
      if (currentDate > expiryDate) {
        return { isValid: false, errorMessage: "Coupon has expired" };
      }
    }
    
    // 3. Check minimum order amount
    if (coupon.minOrderAmount && itemTotal < coupon.minOrderAmount) {
      return { 
        isValid: false, 
        errorMessage: `Minimum order amount of ₹${coupon.minOrderAmount} required. Your cart total is ₹${itemTotal}` 
      };
    }
    
    // 4. Check category restrictions
    if (coupon.categoryId) {
      const hasValidCategory = cartItems.some(item => item.categoryId === coupon.categoryId);
      if (!hasValidCategory) {
        const category = await db.collection('categories').findOne({ id: coupon.categoryId });
        return { 
          isValid: false, 
          errorMessage: `This coupon is only valid for ${category?.name || 'specific'} category items` 
        };
      }
    }
    
    // 5. Check usage limits per user
    if (coupon.usageLimit) {
      const userUsageCount = await db.collection('coupon_usage').countDocuments({ 
        userId: userId, 
        couponCode: couponCode 
      });
      if (userUsageCount >= coupon.usageLimit) {
        return { 
          isValid: false, 
          errorMessage: "You have reached the usage limit for this coupon" 
        };
      }
    }
    
    // 6. Check global usage limits
    if (coupon.globalUsageLimit) {
      const globalUsageCount = await db.collection('coupon_usage').countDocuments({ 
        couponCode: couponCode 
      });
      if (globalUsageCount >= coupon.globalUsageLimit) {
        return { 
          isValid: false, 
          errorMessage: "This coupon has reached its usage limit" 
        };
      }
    }
    
    // 7. Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'Flat') {
      discountAmount = coupon.discountAmount;
    } else if (coupon.discountType === 'percentage') {
      discountAmount = (itemTotal * coupon.discountValue) / 100;
    }
    
    // 8. Apply maximum discount limit
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
    
    // 9. Ensure discount doesn't exceed cart total
    if (discountAmount > itemTotal) {
      discountAmount = itemTotal;
    }
    
    return {
      isValid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
        discountValue: coupon.discountValue,
        description: coupon.description || `${coupon.discountAmount || coupon.discountValue} off`
      },
      discountAmount: discountAmount
    };
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    return { isValid: false, errorMessage: "Error validating coupon" };
  }
}

// Store applied coupon for user
async function storeAppliedCoupon(userId, couponCode) {
  await db.collection('user_coupons').updateOne(
    { userId: userId },
    { 
      $set: { 
        appliedCoupon: couponCode, 
        appliedAt: new Date() 
      } 
    },
    { upsert: true }
  );
}

// Remove applied coupon for user
async function removeAppliedCoupon(userId) {
  await db.collection('user_coupons').deleteOne({ userId: userId });
}

// Get user's applied coupon
async function getUserAppliedCoupon(userId) {
  const userCoupon = await db.collection('user_coupons').findOne({ userId: userId });
  return userCoupon ? userCoupon.appliedCoupon : null;
}

// Record coupon usage (call this when order is placed)
async function recordCouponUsage(userId, couponCode, orderId) {
  await db.collection('coupon_usage').insertOne({
    userId: userId,
    couponCode: couponCode,
    orderId: orderId,
    usedAt: new Date()
  });
}
