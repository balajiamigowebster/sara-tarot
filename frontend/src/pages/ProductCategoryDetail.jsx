import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import ProductDetailModal from '../components/ProductDetailModal';
import WelfareTrust from '../components/WelfareTrust';
import { useTranslatedList, useTranslatedText } from '../utils/translator';

function TranslatedCategoryName({ name, locale }) {
  const translated = useTranslatedText(name, locale);
  return <>{translated}</>;
}


import TarotConsultation from '../components/categories/TarotConsultation';
import SpiritualHealing from '../components/categories/SpiritualHealing';
import Crystals from '../components/categories/Crystals';
import MurugarCards from '../components/categories/MurugarCards';
import TarotClasses from '../components/categories/TarotClasses';
import CounselingClasses from '../components/categories/CounselingClasses';
import KaliPooja from '../components/categories/KaliPooja';

export default function ProductCategoryDetail({ cart = [], setCart, setIsCartOpen }) {
  const { locale, t } = useLanguage();
  const { category } = useParams();
  const [categories, setCategories] = useState([]);
  const [dynamicCat, setDynamicCat] = useState(null);
  const [products, setProducts] = useState([]);
  const translatedProducts = useTranslatedList(products, locale);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState(null);
  const [cardHealing, setCardHealing] = useState({});

  useEffect(() => {
    const fetchCategoriesAndProducts = async () => {
      setLoading(true);
      try {
        const catRes = await axios.get(`${API_BASE_URL}/api/categories`);
        const catData = Array.isArray(catRes.data) ? catRes.data : [];
        setCategories(catData);

        const matched = catData.find(c => c.slug === category);
        if (matched) {
          setDynamicCat(matched);
          const prodRes = await axios.get(`${API_BASE_URL}/api/products`);
          const prodData = Array.isArray(prodRes.data) ? prodRes.data : [];
          const filtered = prodData.filter(p => p.category && p.category.toLowerCase() === matched.name.toLowerCase());
          setProducts(filtered);
        } else {
          setDynamicCat(null);
        }
      } catch (err) {
        console.error('Failed to fetch categories / products in detail view:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndProducts();
  }, [category]);

  const handleAddToCart = (item) => {
    if (!setCart) return;

    const qty = item._quantity || 1;
    const size = item._selectedSize || null;
    const cartItemId = size ? `${item.id}-${size}` : item.id;
    const cartName = size ? `${item.name} (${size})` : item.name;

    const hasHealing = dynamicCat?.type === 'crystal' && !!cardHealing[item.id];
    let finalPrice = item.price;
    let finalName = cartName;

    if (hasHealing) {
      finalPrice += 1000;
      const suffix = locale === 'ta' ? ' (+ கூடுதல் குணப்படுத்தும் சக்தி)' : ' (+ Extra Healing Power)';
      finalName = `${finalName}${suffix}`;
    }

    const healingKey = hasHealing ? '-healing' : '';
    const cartItemIdWithHealing = `${cartItemId}${healingKey}`;

    const existingItem = cart.find((c) => c.id === cartItemIdWithHealing);

    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === cartItemIdWithHealing
            ? { ...c, quantity: c.quantity + qty }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: cartItemIdWithHealing,
          name: finalName,
          price: finalPrice,
          image: item.image || '/saraa-logo.jpeg',
          quantity: qty,
          category: item.category || dynamicCat?.name || '',
          isCrystal: dynamicCat?.type === 'crystal' || (item.category && item.category.toLowerCase() === 'crystal')
        }
      ]);
    }

    if (setIsCartOpen) {
      setIsCartOpen(true);
    }
  };

  switch (category) {
    case 'tarot-consultation':
      return <TarotConsultation cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} />;
    case 'spiritual-healing':
      return <SpiritualHealing cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} />;
    case 'crystals':
      return <Crystals cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} />;
    case 'murugar-cards':
      return <MurugarCards cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} />;
    case 'tarot-classes':
      return <TarotClasses cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} />;
    case 'counseling-classes':
      return <CounselingClasses cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} />;
    case 'kali-pooja':
      return <KaliPooja cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} />;
    default:
      if (loading) {
        return (
          <div className="bg-[#F8F6FF] min-h-screen flex justify-center items-center text-sara-gold">
            <p className="font-[Cinzel] text-[1.5rem] tracking-[1px]">{t('productCategoryDetail.loading')}</p>
          </div>
        );
      }

      if (dynamicCat) {
        return (
          <>
          <div className="bg-[#F8F6FF] min-h-screen text-[#2A1635] font-sans pt-16 pb-24 px-8 max-lg:py-8 max-lg:px-4">
            <div className="max-w-[1200px] mx-auto">

              <div className="mb-10 text-[13px] tracking-[0.5px]">
                <Link to="/" className="text-sara-muted no-underline hover:text-sara-gold transition-colors">{t('productCategoryDetail.home')}</Link>
                <span className="text-[rgba(42,22,53,0.2)] mx-2">/</span>
                <span className="text-sara-gold"><TranslatedCategoryName name={dynamicCat.name} locale={locale} /></span>
              </div>

              <div data-aos="fade-up" className="mb-16 border-b border-[rgba(214,178,106,0.15)] bg-white -mx-4 sm:-mx-8 px-4 sm:px-8 pt-16 pb-10 bg-[radial-gradient(ellipse_at_center,rgba(161,61,142,0.06)_0%,transparent_70%)]">
                <span className="text-sara-gold tracking-[2px] text-xs font-semibold uppercase">
                  {dynamicCat.type === 'crystal' ? t('productCategoryDetail.crystalType') : t('productCategoryDetail.divineType')}
                </span>
                <h1 className="text-[#000000] font-serif text-[2.8rem] font-semibold mt-2 mb-6 uppercase tracking-[1px] leading-tight">
                  <TranslatedCategoryName name={dynamicCat.name} locale={locale} />
                </h1>
                <p className="text-sara-muted text-[1.05rem] leading-7 max-w-[800px] m-0">
                  {dynamicCat.desc ? <TranslatedCategoryName name={dynamicCat.desc} locale={locale} /> : t('productCategoryDetail.fallbackDesc')}
                </p>
              </div>

              <div className="flex flex-row gap-12 flex-wrap">
                <div className="flex-[2_1_600px]">
                  <h3 data-aos="fade-up" className="text-sara-gold font-[Cinzel] text-[1.5rem] mb-8 border-b border-[rgba(214,178,106,0.1)] pb-2 tracking-[1.5px] uppercase">
                    {t('productCategoryDetail.availableBookings')}
                  </h3>

                  <div className="flex flex-col gap-6">
                    {translatedProducts.length === 0 ? (
                      <div className="text-center py-12 text-sara-muted">
                        No offerings available at the moment. Please check back later.
                      </div>
                    ) : (
                       translatedProducts.map((item, idx) => (
                        <div
                          key={item.id}
                          data-aos="fade-up"
                          data-aos-delay={idx * 100}
                          onClick={() => setActiveProduct(item)}
                          className="bg-gradient-to-br from-[#1E0F2B] to-[#0C0614] border border-[rgba(214,178,106,0.2)] rounded p-8 flex flex-row gap-6 flex-wrap items-center justify-between transition-all duration-300 hover:border-sara-gold hover:shadow-[0_4px_25px_rgba(161,61,142,0.15)] cursor-pointer"
                        >
                          {item.image && (
                            <div className="w-[120px] h-[120px] rounded overflow-hidden border border-[rgba(214,178,106,0.2)] bg-[#12071C] flex-shrink-0">
                              <img src={item.image?.startsWith('/uploads') ? `${API_BASE_URL.replace(/\/$/, '')}${item.image}` : item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                            </div>
                          )}
                          <div className="flex-[1_1_280px]">
                            <div className="text-sara-gold text-[11px] uppercase tracking-[1px] font-semibold">
                              {item.type}
                            </div>
                            <h4 className="text-white text-[1.35rem] my-1 mb-2 font-medium">
                              {item.name}
                            </h4>
                            {item.desc && (
                              <ul className="text-[#D3C7DC] text-[0.9rem] leading-[1.5] m-0 pl-4 list-disc space-y-1">
                                {item.desc.split('\n').map((point, i) => point.trim() && (
                                  <li key={i}>{point.trim()}</li>
                                ))}
                              </ul>
                            )}

                            {dynamicCat?.type === 'crystal' && (
                              <div
                                className="flex flex-col gap-1.5 mt-4 border-t border-[rgba(214,178,106,0.15)] pt-3 mb-2 select-none"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-[10px] text-[rgba(255,255,255,0.45)] uppercase tracking-[0.5px] font-semibold">
                                  {locale === 'ta' ? 'குணப்படுத்துதல் விருப்பம்:' : 'Healing Option:'}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="flex items-center gap-2 text-[12px] text-[#D3C7DC] cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`healing-${item.id}`}
                                      checked={!cardHealing[item.id]}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setCardHealing(prev => ({ ...prev, [item.id]: false }));
                                      }}
                                      className="w-4 h-4 accent-sara-gold cursor-pointer"
                                    />
                                    <span>{locale === 'ta' ? 'இல்லை' : 'Without Healing'}</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-[12px] text-sara-gold font-semibold cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`healing-${item.id}`}
                                      checked={!!cardHealing[item.id]}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setCardHealing(prev => ({ ...prev, [item.id]: true }));
                                      }}
                                      className="w-4 h-4 accent-sara-gold cursor-pointer"
                                    />
                                    <span>{locale === 'ta' ? 'குணப்படுத்துதலுடன் (+ ₹1,000)' : 'With Healing (+ ₹1,000)'}</span>
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end justify-center gap-3 min-w-[150px]">
                            <div className="text-sara-gold text-[1.75rem] font-semibold">
                              ₹{(item.price + (cardHealing[item.id] ? 1000 : 0)).toLocaleString('en-IN')}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                              className="bg-transparent text-sara-gold border border-[rgba(214,178,106,0.4)] py-[0.6rem] px-6 rounded text-[12px] font-semibold cursor-pointer transition-all duration-300 uppercase tracking-[0.5px] hover:bg-sara-gold hover:text-[#1E0F2B] hover:border-sara-gold"
                            >
                              Add To Cart
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Product Detail Modal */}
          {activeProduct && (
            <ProductDetailModal
              product={activeProduct}
              onClose={() => setActiveProduct(null)}
              onAddToCart={(p) => handleAddToCart(p)}
            />
          )}
          <WelfareTrust />
        </>
        );
      }

      return (
        <div className="bg-[#F8F6FF] min-h-[80vh] flex flex-col items-center justify-center text-[#2A1635] font-sans">
          <h2 className="text-sara-gold font-[Cinzel] text-[2rem] mb-4">Category Not Found</h2>
          <Link to="/" className="text-sara-gold no-underline border border-sara-gold py-3 px-6 rounded hover:bg-sara-gold hover:text-sara-textDark transition-colors">Back to Home</Link>
        </div>
      );
  }
}
