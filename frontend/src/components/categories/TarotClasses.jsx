import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslatedList } from '../../utils/translator';
import ProductDetailModal from '../../components/ProductDetailModal';
import WelfareTrust from '../../components/WelfareTrust';

export default function TarotClasses({ cart = [], setCart, setIsCartOpen }) {
  const { locale, t } = useLanguage();
  const [activeProduct, setActiveProduct] = useState(null);
  const [items, setItems] = useState([]);
  const translatedItems = useTranslatedList(items, locale);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products?category=Tarot Card Reading`);
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch Tarot classes products. Using fallback.', err);
        setItems(t('tarotClasses.items'));
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleAddToCart = (item) => {
    if (!setCart) return;

    const existingItem = cart.find((c) => c.id === item.id);

    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image || '/saraa-logo.jpeg',
          quantity: 1,
          category: item.category || 'Tarot Card Reading'
        }
      ]);
    }

    if (setIsCartOpen) {
      setIsCartOpen(true);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-[#F8F6FF] text-[#2A1635] font-sans pt-16 pb-24 px-4 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumbs */}
        <div className="mb-10 text-[13px] tracking-[0.5px]">
          <Link to="/" className="text-sara-muted no-underline">{t('categoryCommon.home')}</Link>
          <span className="text-[rgba(207,207,207,0.3)] mx-2">/</span>
          <span className="text-[#000000]">{t('tarotClasses.title')}</span>
        </div>

        {/* Header Section */}
        <div data-aos="fade-up" className="mb-16 border-b border-[rgba(214,178,106,0.15)] pb-10 bg-white -mx-4 sm:-mx-8 px-4 sm:px-8 pt-16 pb-10 bg-[radial-gradient(ellipse_at_center,rgba(161,61,142,0.06)_0%,transparent_70%)]">
          <span className="text-sara-gold tracking-[2px] text-xs font-semibold uppercase">
            {t('tarotClasses.badge')}
          </span>
          <h1 className="text-[#000000] font-serif text-[2.8rem] font-semibold mt-2 mb-6 uppercase tracking-[1px] leading-tight">
            {t('tarotClasses.title')}
          </h1>
          <p className="text-sara-muted text-[1.05rem] leading-7 max-w-[800px] m-0">
            {t('tarotClasses.description')}
          </p>
        </div>

        <div className="flex flex-row gap-12 flex-wrap">
          
          {/* Items Listing Column */}
          <div className="flex-[2_1_600px]">
            <h3 data-aos="fade-up" className="text-sara-gold font-serif text-1.5rem mb-8 border-b border-[rgba(214,178,106,0.1)] pb-2 tracking-[1.5px] uppercase">
              {t('categoryCommon.availableBookings')}
            </h3>

            <div className="flex flex-col gap-6">
              {loading ? (
                <div className="text-center py-12 text-sara-gold">
                  {t('categoryCommon.loading')}
                </div>
              ) : translatedItems.length === 0 ? (
                <div className="text-center py-12 text-sara-muted">
                  {t('categoryCommon.empty')}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    {translatedItems.slice(0, visibleCount).map((item, idx) => (
                  <div 
                    key={item.id}
                    data-aos="fade-up"
                    data-aos-delay={idx * 100}
                    onClick={() => setActiveProduct(item)}
                    className="bg-gradient-to-br from-[#1E0F2B] to-[#0C0614] border border-[rgba(214,178,106,0.2)] rounded p-8 flex flex-row gap-6 flex-wrap items-center justify-between transition-all duration-300 hover:border-sara-gold hover:shadow-[0_4px_25px_rgba(161,61,142,0.15)] cursor-pointer"
                  >
                    {item.image && (
                      <div className="w-[70px] h-[70px] shrink-0">
                        <img
                          src={item.image?.startsWith('/uploads') ? `${API_BASE_URL.replace(/\/$/, '')}${item.image}` : item.image}
                          alt={item.name}
                          className="w-full h-full object-contain rounded-lg border border-[rgba(214,178,106,0.2)] bg-black/40 p-1"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                    )}
                    <div className="flex-[1_1_280px]">
                      <div className="text-sara-gold text-[11px] uppercase tracking-[1px] font-semibold">
                        {item.type}
                      </div>
                      <h4 className="text-white text-[1.35rem] mt-1 mb-2 font-bold">
                        {item.name}
                      </h4>
                      <p className="text-[#D3C7DC] text-[0.9rem] leading-5 m-0">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-3 min-w-[150px]">
                      <div className="text-sara-gold text-[1.75rem] font-semibold">
                        ₹{item.price.toLocaleString('en-IN')}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                        className="bg-transparent text-sara-gold border border-[rgba(214,178,106,0.4)] rounded-sm py-3 px-6 text-xs font-bold uppercase tracking-[1px] cursor-pointer transition-all w-full hover:bg-sara-gold hover:text-[#1E0F2B] hover:border-sara-gold"
                      >
                        {t('categoryCommon.bookAdd')}
                      </button>
                    </div>
                  </div>
                ))}
                  </div>
                  {translatedItems.length > visibleCount && (
                    <div className="flex justify-center mt-12 mb-4">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 9)}
                        className="bg-transparent border border-sara-gold text-sara-gold px-8 py-3 rounded text-[13px] font-semibold uppercase tracking-[1.5px] hover:bg-sara-gold hover:text-sara-dark transition-all duration-300 shadow-[0_0_15px_rgba(214,178,106,0.1)] hover:shadow-[0_0_20px_rgba(214,178,106,0.3)]"
                      >
                        View More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Guidelines Sidebar Column */}
          <div className="flex-[1_1_300px]" data-aos="fade-left">
            <div className="bg-white border border-[rgba(214,178,106,0.25)] rounded-md p-8 sticky top-[120px] bg-gradient-to-b from-[rgba(214,178,106,0.02)] to-transparent">
              <h4 className="text-sara-gold font-serif text-[1.25rem] mb-5 border-b border-[rgba(214,178,106,0.1)] pb-2 tracking-[1px] uppercase">
                {t('categoryCommon.importantNotes')}
              </h4>
              <p className="text-sara-muted text-[0.95rem] leading-6 mb-6">
                {t('tarotClasses.policyIntro')}
              </p>
              
              <ul className="pl-5 m-0 text-sara-muted leading-7 text-[0.9rem]">
                  <li className="mb-3 list-square">{t('tarotClasses.policy1')}</li>
                  <li className="mb-3 list-square">{t('tarotClasses.policy2')}</li>
                  <li className="mb-3 list-square">{t('tarotClasses.policy3')}</li>
              </ul>

              <div className="border-t border-[rgba(214,178,106,0.15)] mt-8 pt-6 text-center">
                <span className="text-xs text-sara-muted block mb-4">
                  {t('categoryCommon.prePayment')}
                </span>
                <Link 
                  to="/checkout" 
                  className="block bg-transparent text-sara-gold border border-[rgba(214,178,106,0.5)] py-3 no-underline text-xs font-semibold uppercase tracking-[1px] transition-all hover:bg-[rgba(214,178,106,0.1)] hover:border-sara-gold"
                >
                  {t('categoryCommon.viewCart')}
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={(item) => handleAddToCart(item)}
        />
      )}

      <WelfareTrust />
    </>
  );
}
