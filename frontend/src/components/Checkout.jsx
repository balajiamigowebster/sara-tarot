import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

const WHATSAPP_PHONE = '919655199507';
const MERCHANT_NAME = 'SARAA TAROT SERVICES';

export default function Checkout({ cartItems = [], setCartItems }) {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const { user } = useSelector(state => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const CRYSTAL_KEYWORDS = [
    "rasi", "bracelet", "bracelets", "pyrite", "rings", "ring", 
    "pendants", "pendant", "tumbles", "tumble", "crystal balls", "crystal ball", 
    "pyrite frames", "pyrite frame", "crystal mala", "crystal tower", 
    "crystal", "crystals", "mala", "tower", "geode", "cluster",
    "amethyst", "moonstone", "quartz", "selenite", "tourmaline", 
    "obsidian", "carnelian", "citrine", "labradorite", "tiger eye", 
    "tigers eye", "lapis", "jade", "aventurine", "hematite", "malachite", 
    "fluorite", "jasper", "agate", "aquamarine", "garnet", "sunstone", 
    "turquoise", "opal", "gemstone", "stone", "raw "
  ];

  const isCrystalProduct = (item) => {
    if (item.isCrystal) return true;
    const catStr = (item.category || '').toLowerCase().trim();
    const nameStr = (item.name || '').toLowerCase().trim();

    // Check category against known crystal categories
    if (CRYSTAL_KEYWORDS.some(kw => catStr.includes(kw))) return true;

    // Check item name against crystal keywords (e.g. "Moonstone Tumbles", "Golden Pyrite", "Raw Amethyst Geode")
    if (CRYSTAL_KEYWORDS.some(kw => nameStr.includes(kw))) return true;

    return false;
  };

  const isAddressRequired = cartItems.some(isCrystalProduct);
  const isClassPurchase = cartItems.some(item => {
    const nameStr = (item.name || '').toLowerCase();
    const catStr = (item.category || '').toLowerCase();
    return (
      nameStr.includes('class') ||
      nameStr.includes('workshop') ||
      nameStr.includes('testing') ||
      nameStr.includes('tarot card reading') ||
      catStr.includes('class') ||
      catStr.includes('tarot card reading')
    );
  });

  const isPhoneRequired = isAddressRequired || isClassPurchase;

  const handlePhoneChange = (e) => {
    // Only accept numeric digits, up to 10 characters, no gaps or spaces
    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(cleanDigits);
  };

  const [lastOrderDetails, setLastOrderDetails] = useState({ items: [], total: 0 });

  const itemsTotalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstAmount = Math.round(itemsTotalAmount * 0.18);
  const grandTotal = itemsTotalAmount + gstAmount;

  const removeItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (isPhoneRequired && !cleanPhone) {
      setError('Please enter your 10-digit phone number.');
      return;
    }
    if (cleanPhone && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (isAddressRequired && !address.trim()) {
      setError(t('checkout.fillDetails') || 'Please enter your delivery address.');
      return;
    }

    setIsProcessing(true);
    setError('');

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Failed to load Razorpay SDK. Please check your network connection.');
      setIsProcessing(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_TKognp49Y6QBem',
      amount: grandTotal * 100, // amount in paisa
      currency: 'INR',
      name: MERCHANT_NAME,
      description: 'Order Payment',
      handler: async function (response) {
        try {
          const res = await api.post(
            '/api/orders',
            {
              items: cartItems,
              total: grandTotal,
              paymentMethod: 'RAZORPAY',
              customerInfo: { name: user.name, email: user.email, phone: cleanPhone, address: address.trim() },
              razorpayPaymentId: response.razorpay_payment_id
            }
          );

          setCartItems([]);

          // For Tarot Card Reading Classes category products: redirect to class portal
          if (isClassPurchase) {
            if (user) {
              const updatedUser = { ...user, hasPurchasedClass: true };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            window.location.href = 'https://tarotclasses.saratarot.in/';
            return;
          }

          const orderId = res.data?.order?.id || 'N/A';
          const orderItems = cartItems.map(item => `${item.name}${item._selectedSize ? ` (Size: ${item._selectedSize})` : ''} x${item.quantity}`);

          setLastOrderDetails({
            id: orderId,
            items: orderItems,
            total: grandTotal,
            customerInfo: { name: user.name, email: user.email, phone: cleanPhone, address: address.trim() },
            razorpayPaymentId: response.razorpay_payment_id
          });

          setIsSuccess(true);

          // Auto-trigger WhatsApp redirect
          const orderItemsText = orderItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
          const messageText = 
`🔮 *SARAA TAROT - ORDER CONFIRMATION* 🔮

Hello Saraa Tarot, I have successfully placed an order. Below are the details as proof of purchase:

• *Order Reference:* #ORD${orderId}
• *Payment ID:* ${response.razorpay_payment_id || 'N/A'}
• *Total Amount Paid:* ₹${grandTotal.toLocaleString('en-IN')}

*Customer Details:*
• *Name:* ${user.name}
• *Email:* ${user.email}
• *Phone:* ${cleanPhone}
• *Delivery Address:* ${address.trim()}

*Items Ordered:*
${orderItemsText}

Please confirm my booking and process it. Thank you!`;

          const waLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(messageText)}`;
          window.open(waLink, '_blank');
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to place order after payment.');
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: cleanPhone ? `+91${cleanPhone}` : undefined,
      },
      theme: {
        color: '#D4B26A',
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
        }
      }
    };

    try {
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      setError('Razorpay SDK failed to open.');
      setIsProcessing(false);
    }
  };



  if (!user) {
    return (
      <div className="bg-[#F8F6FF] min-h-[85vh] flex justify-center items-center text-[#2A1635] font-sans p-8">
        <div className="bg-white border border-[rgba(214,178,106,0.15)] rounded-lg px-12 py-12 max-w-[450px] w-full text-center shadow-[0_15px_30px_rgba(42,22,53,0.08)]">
          <div className="text-[4rem] text-sara-gold mb-4">🔒</div>
          <h2 className="text-[1.6rem] font-normal text-sara-gold mb-4 uppercase tracking-[1px]">
            {t('checkout.loginRequired') || 'Login Required'}
          </h2>
          <p className="text-[#2A1635] text-[14px] leading-relaxed mb-8">
            {t('checkout.loginToCheckout') || 'Please sign in or create an account to proceed with your order.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-sara-gold to-sara-goldSoft text-sara-textDark border-none rounded py-[1rem] px-8 text-[14px] font-bold uppercase tracking-[1px] cursor-pointer transition-opacity hover:opacity-90"
            >
              {t('checkout.signIn') || 'Sign In'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-transparent text-sara-gold border border-[rgba(214,178,106,0.3)] py-[1rem] px-4 text-[13px] font-bold uppercase tracking-[1px] cursor-pointer rounded transition-colors hover:bg-[rgba(214,178,106,0.08)]"
            >
              {t('checkout.continueShopping') || 'Continue Shopping'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    const orderItemsText = lastOrderDetails.items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
    const messageText = 
`🔮 *SARAA TAROT - ORDER CONFIRMATION* 🔮

Hello Saraa Tarot, I have successfully placed an order. Below are the details as proof of purchase:

• *Order Reference:* #ORD${lastOrderDetails.id || 'N/A'}
• *Payment ID:* ${lastOrderDetails.razorpayPaymentId || 'N/A'}
• *Total Amount Paid:* ₹${lastOrderDetails.total.toLocaleString('en-IN')}

*Customer Details:*
• *Name:* ${lastOrderDetails.customerInfo?.name || user.name}
• *Email:* ${lastOrderDetails.customerInfo?.email || user.email}
• *Phone:* ${lastOrderDetails.customerInfo?.phone || ''}
• *Delivery Address:* ${lastOrderDetails.customerInfo?.address || ''}

*Items Ordered:*
${orderItemsText}

Please confirm my booking and process it. Thank you!`;
    const waLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(messageText)}`;

    return (
      <div className="bg-[#F8F6FF] min-h-[85vh] flex justify-center items-center text-[#2A1635] font-sans p-8">
        <div className="bg-white border border-[rgba(214,178,106,0.15)] rounded-lg px-12 py-12 max-w-[500px] w-full text-center shadow-[0_15px_30px_rgba(42,22,53,0.08)]">
          <div className="text-[4.5rem] text-sara-gold mb-4">✓</div>
          <h2 className="text-[1.8rem] font-normal text-sara-gold mb-5 uppercase tracking-[1px]">
            {t('checkout.bookingReceived')}
          </h2>
          <p className="text-[#2A1635] text-[15px] leading-relaxed mb-10">
            {t('checkout.bookingMsg')}
          </p>

          <div className="flex flex-col gap-4 w-full">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white border-none py-[1.1rem] px-8 text-[14px] font-bold uppercase tracking-[1px] no-underline cursor-pointer rounded flex items-center justify-center gap-[10px] transition-opacity hover:opacity-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437 0 9.862-4.414 9.866-9.843.002-2.63-1.023-5.101-2.886-6.968C16.383 1.928 13.911.906 11.282.906c-5.442 0-9.873 4.414-9.877 9.846 0 1.635.489 3.223 1.411 4.61l-.995 3.635 3.731-.977zm11.367-5.463c-.305-.153-1.802-.889-2.08-.99-.278-.101-.48-.153-.68.153-.2.305-.778 1.01-.954 1.21-.176.2-.353.228-.658.076-.305-.153-1.286-.474-2.45-1.512-.906-.809-1.517-1.809-1.695-2.114-.177-.305-.019-.47.133-.621.137-.136.305-.356.458-.533.152-.178.203-.305.305-.508.102-.203.051-.381-.025-.533-.076-.153-.68-1.639-.933-2.247-.246-.593-.497-.513-.68-.522-.176-.008-.378-.01-.58-.01-.202 0-.531.076-.809.381-.278.305-1.062 1.037-1.062 2.531 0 1.493 1.088 2.935 1.238 3.138.15.203 2.14 3.267 5.185 4.578.725.312 1.29.499 1.732.64.73.232 1.393.197 1.917.12.584-.087 1.802-.736 2.057-1.448.255-.713.255-1.323.179-1.448-.076-.125-.278-.203-.584-.356z"/>
              </svg>
              {t('checkout.confirmWhatsApp')}
            </a>

            <button
              onClick={() => navigate('/')}
              className="bg-transparent text-sara-gold border border-[rgba(214,178,106,0.3)] py-4 px-4 text-[13px] font-bold uppercase tracking-[1px] cursor-pointer rounded w-full transition-colors hover:bg-[rgba(214,178,106,0.08)]"
            >
              {t('checkout.backToServices')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F6FF] min-h-[90vh] text-[#2A1635] font-sans py-12 px-8">
      <div className="max-w-[1100px] mx-auto">

        <button
          onClick={() => navigate('/')}
          className="bg-transparent border-none text-sara-gold cursor-pointer text-[14px] font-medium uppercase tracking-[1px] flex items-center gap-2 mb-10 p-0"
        >
          ➔ {t('checkout.backToServices')}
        </button>

        <h1 className="text-sara-gold text-[2.2rem] font-light uppercase tracking-[1.5px] mb-10">
          {t('checkout.secureCheckout')}
        </h1>

        <div className="grid grid-cols-2 gap-12 max-lg:grid-cols-1 max-lg:gap-10">

          <div className="flex flex-col gap-10">

            <div className="bg-white border border-[rgba(214,178,106,0.15)] rounded-md p-10 shadow-[0_4px_20px_rgba(42,22,53,0.06)]">
              <h3 className="text-lg font-medium mb-6 text-sara-gold uppercase tracking-[0.5px]">
                {t('checkout.customerDetails')}
              </h3>

              <div className="mb-8 flex items-center gap-4 bg-[rgba(214,178,106,0.04)] border border-[rgba(214,178,106,0.15)] rounded p-4">
                <div className="w-12 h-12 rounded-full bg-[rgba(214,178,106,0.12)] border border-[rgba(214,178,106,0.3)] flex items-center justify-center text-lg">
                  👤
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2A1635]">{user.name}</div>
                  <div className="text-[13px] text-sara-muted">{user.email}</div>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.5px] text-sara-muted mb-2">
                    {t('checkout.phoneNumber')} {isPhoneRequired && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center w-full border border-[rgba(42,22,53,0.15)] rounded bg-[#FBF9FF] overflow-hidden focus-within:border-sara-gold transition-colors">
                    <span className="bg-[rgba(214,178,106,0.12)] text-[#2A1635] font-semibold text-[14px] px-3.5 py-3 border-r border-[rgba(42,22,53,0.15)] select-none whitespace-nowrap">
                      +91
                    </span>
                    <input
                      type="tel"
                      required={isPhoneRequired}
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      placeholder={t('checkout.phonePlaceholder') || 'Enter 10-digit mobile number'}
                      className="w-full px-4 py-3 text-[14px] text-[#2A1635] outline-none bg-transparent"
                    />
                  </div>
                  {phone && phone.length < 10 && (
                    <p className="text-[11px] text-amber-600 mt-1 mb-0 font-medium">
                      Enter 10 digits ({10 - phone.length} more needed)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.5px] text-sara-muted mb-2">
                    {t('checkout.address')} {isAddressRequired && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    required={isAddressRequired}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('checkout.addressPlaceholder')}
                    rows="3"
                    className="w-full border border-[rgba(42,22,53,0.15)] rounded px-4 py-3 text-[14px] text-[#2A1635] outline-none transition-colors focus:border-sara-gold bg-[#FBF9FF] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[rgba(214,178,106,0.15)] rounded-md p-10 shadow-[0_4px_20px_rgba(42,22,53,0.06)]">
              <h3 className="text-lg font-medium mb-6 text-sara-gold uppercase tracking-[0.5px]">
                {t('checkout.selectPayment') || 'Payment Method'}
              </h3>

              <form onSubmit={handlePay}>
                <div className="text-center mb-8 bg-[rgba(214,178,106,0.02)] border border-[rgba(214,178,106,0.15)] rounded p-6">
                  <div className="text-4xl mb-4">💳</div>
                  <h4 className="text-sara-gold font-semibold text-[16px] mb-2 uppercase tracking-[0.5px]">
                    Razorpay Secure Gateway
                  </h4>
                  <p className="text-[12px] text-sara-muted leading-relaxed max-w-[320px] mx-auto m-0">
                    Pay securely using Cards, Netbanking, UPI, or Wallets. After clicking the payment button, the Razorpay portal will initialize.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded text-center font-semibold font-sans">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || cartItems.length === 0}
                  className={`w-full bg-gradient-to-r from-sara-gold to-sara-goldSoft text-sara-textDark border-none rounded py-[1.1rem] text-[15px] font-bold uppercase tracking-[1px] flex justify-center items-center gap-[10px] transition-opacity ${
                    isProcessing || cartItems.length === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-90'
                  }`}
                >
                  {isProcessing
                    ? t('checkout.processing')
                    : `PAY SECURELY WITH RAZORPAY ₹${grandTotal.toLocaleString('en-IN')}`}
                </button>


              </form>
            </div>

          </div>

          <div className="bg-white border border-[rgba(214,178,106,0.15)] rounded-md p-10 shadow-[0_4px_20px_rgba(42,22,53,0.06)]">
            <h3 className="text-lg font-medium mb-6 text-sara-gold uppercase tracking-[0.5px]">
              {t('checkout.orderSummary')}
            </h3>

            <div className="max-h-[320px] overflow-y-auto mb-6 pr-1">
              {cartItems.length === 0 ? (
                <p className="text-sara-muted text-[14px] text-center py-8">{t('checkout.emptyCart')}</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center justify-between mb-5 border-b border-[rgba(42,22,53,0.06)] pb-5">
                    <div className="flex gap-4 items-center">
                      <img
                        src={item.image || "/placeholder-item.jpg"}
                        alt={item.name}
                        className="w-[50px] h-[50px] object-cover rounded border border-[rgba(214,178,106,0.1)]"
                      />

                      <div>
                        <h4 className="m-0 mb-1 text-[13px] font-medium text-[#2A1635]">{item.name}</h4>
                        <p className="m-0 text-[13px] text-sara-gold font-semibold">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="bg-none border-none text-[#ef5350] cursor-pointer text-[16px] p-1 flex items-center"
                      title={t('nav.removeItem')}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-[rgba(214,178,106,0.15)] pt-6">
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-sara-muted">{t('checkout.itemsTotal')}</span>
                  <span className="text-[#2A1635]">₹{itemsTotalAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-[13px] mb-3">
                  <span className="text-sara-muted">{locale === 'ta' ? 'ஜிஎஸ்டி (18%)' : '18% GST'}</span>
                  <span className="text-[#2A1635]">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-[16px] font-semibold border-t border-dashed border-[rgba(214,178,106,0.2)] pt-4 text-sara-gold">
                  <span>{t('checkout.grandTotal')}</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
