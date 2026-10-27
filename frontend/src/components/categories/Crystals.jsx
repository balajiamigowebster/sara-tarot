import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslatedList, useTranslatedText } from '../../utils/translator';
import WelfareTrust from '../../components/WelfareTrust';

function TranslatedCategoryName({ name, locale }) {
  const translated = useTranslatedText(name, locale);
  return <>{translated}</>;
}


const CRYSTAL_IMAGES = [
  '/Raw-Amethyst-Geode.png',
  '/Rose-Quartz-Love-Bowl-Tumbles.png',
  '/Golden-Pyrite-Cluster.png',
  '/crystal.jpg',
  '/Clear-Quartz-Generator-Point.png',
  '/Raw-Black-Tourmaline-Shield.png',
  '/Clear-Quartz-Generator-Point.png',
  '/Golden-Pyrite-Cluster.png',
  '/crystal.jpg',
  '/Raw-Amethyst-Geode.png'
];

export default function Crystals({ cart = [], setCart, setIsCartOpen }) {
  const { locale, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const subcategoryParam = searchParams.get('subcategory');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [items, setItems] = useState([]);
  const translatedItems = useTranslatedList(items, locale);
  const [loading, setLoading] = useState(true);
  const [cardHealing, setCardHealing] = useState({});
  const [crystalCategories, setCrystalCategories] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    if (subcategoryParam) {
      setSelectedCategory(subcategoryParam);
    } else {
      setSelectedCategory(null);
    }
    setVisibleCount(9);
  }, [subcategoryParam]);

  useEffect(() => {
    const fetchCrystals = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products`),
          axios.get(`${API_BASE_URL}/api/categories`)
        ]);

        const crystalsList = Array.isArray(catRes.data) ? catRes.data.filter(c => c.type === 'crystal') : [];
        setCrystalCategories(crystalsList);

        const crystalCatNames = crystalsList.map(c => c.name.toLowerCase());
        const crystalItems = Array.isArray(prodRes.data) ? prodRes.data.filter(item => 
          item.category && crystalCatNames.includes(item.category.toLowerCase())
        ) : [];
        setItems(crystalItems);
      } catch (err) {
        console.error('Failed to load crystals from database. Using fallback seed data.', err);
        const fallbackCats = t('crystalsPage.categories');
        const fallbackList = fallbackCats.map((cat, idx) => ({
          ...cat,
          image: CRYSTAL_IMAGES[idx] || '/saraa-logo.jpeg'
        }));
        setCrystalCategories(fallbackList);
        const fallbacks = fallbackList.map((cat, idx) => ({
          id: `fallback-${idx}`,
          name: `${cat.name} Crystal Product`,
          price: 1500 + idx * 100,
          type: 'Blessed & Energized',
          category: cat.name,
          desc: cat.desc,
          image: cat.image,
          inclusions: ['Cleansed & energized', 'Sacred prasadham included']
        }));
        setItems(fallbacks);
      } finally {
        setLoading(false);
      }
    };
    fetchCrystals();
  }, []);

  const handleAddToCart = (item) => {
    if (!setCart) return;

    let finalPrice = item.price;
    let nameSuffix = '';
    const selectedSize = selectedSizes[item.id] || '';
    const hasHealing = !!cardHealing[item.id];

    if (hasHealing) {
      finalPrice += 1000;
      nameSuffix = locale === 'ta' ? ' (+ கூடுதல் குணப்படுத்தும் சக்தி)' : ' (+ Extra Healing Power)';
    }

    const sizeKey = selectedSize ? `-${selectedSize}` : '';
    const cartItemId = hasHealing ? `${item.id}${sizeKey}-healing` : `${item.id}${sizeKey}`;
    const existingItem = cart.find((c) => c.id === cartItemId);

    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === cartItemId
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: cartItemId || `crystal-${item.name.toLowerCase().replace(/\s+/g, '-')}${selectedSize ? `-${selectedSize.toLowerCase().replace(/\s+/g, '-')}` : ''}${hasHealing ? '-healing' : ''}`,
          name: `${item.name}${selectedSize ? ` (${selectedSize})` : ''}${nameSuffix}`,
          price: finalPrice,
          image: item.image || '/saraa-logo.jpeg',
          quantity: 1,
          category: item.category || 'crystal',
          isCrystal: true
        }
      ]);
    }

    if (setIsCartOpen) {
      setIsCartOpen(true);
    }
  };

  const handleOpenPopup = (itemId, e) => {
    e.stopPropagation();
    setActiveItemId(itemId);
    const item = translatedItems.find(i => i.id === itemId);
    if (item && Array.isArray(item.sizes) && item.sizes.length > 0) {
      setSelectedSizes(prev => ({ ...prev, [itemId]: item.sizes[0] }));
    }
  };

  const handleClosePopup = () => {
    setActiveItemId(null);
  };

  const filteredItems = selectedCategory
    ? translatedItems.filter(item => item.category && item.category.toLowerCase() === selectedCategory.toLowerCase())
    : translatedItems;

  const currentItem = translatedItems.find((item) => item.id === activeItemId);

  return (
    <>
    <div className="min-h-screen bg-[#F8F6FF] text-[#2A1635] font-sans pt-16 pb-24 px-4 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumbs */}
        <div className="mb-10 text-[13px] tracking-[0.5px]">
          <Link to="/" className="text-sara-muted no-underline">{t('categoryCommon.home')}</Link>
          <span className="text-[rgba(207,207,207,0.3)] mx-2">/</span>
          {selectedCategory ? (
            <>
              <span 
                onClick={() => setSearchParams({})} 
                className="text-sara-muted cursor-pointer underline"
              >
                {t('crystalsPage.title')}
              </span>
              <span className="text-[rgba(207,207,207,0.3)] mx-2">/</span>
              <span className="text-[#000000]"><TranslatedCategoryName name={selectedCategory} locale={locale} /></span>
            </>
          ) : (
            <span className="text-[#000000]">{t('crystalsPage.title')}</span>
          )}
        </div>

        {/* Header Section */}
        <div data-aos="fade-up" className="mb-12 border-b border-[rgba(214,178,106,0.15)] pb-10 bg-white -mx-4 sm:-mx-8 px-4 sm:px-8 pt-16 pb-10 bg-[radial-gradient(ellipse_at_center,rgba(161,61,142,0.06)_0%,transparent_70%)]">
          <span className="text-sara-gold tracking-[2px] text-xs font-semibold uppercase">
            {t('crystalsPage.badge')}
          </span>
          <h1 className="text-[#000000] font-serif text-[2.8rem] font-semibold mt-2 mb-6 uppercase tracking-[1px] leading-tight">
            {selectedCategory ? <><TranslatedCategoryName name={selectedCategory} locale={locale} /> {t('crystalsPage.collection')}</> : t('crystalsPage.title')}
          </h1>
          <p className="text-sara-muted text-[1.05rem] leading-7 max-w-[800px] mb-8">
            {(() => {
              const catData = crystalCategories.find(c => c.name.toLowerCase() === (selectedCategory || '').toLowerCase());
              return catData ? <TranslatedCategoryName name={catData.desc} locale={locale} /> : t('crystalsPage.description');
            })()}
          </p>

          {/* Category Selector Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setSearchParams({})}
              className={
                selectedCategory === null
                  ? 'bg-sara-gold text-sara-dark border border-[rgba(214,178,106,0.3)] py-2.5 px-5 rounded-[20px] text-xs font-semibold cursor-pointer transition-all duration-300 uppercase tracking-[0.5px]'
                  : 'bg-[rgba(214,178,106,0.05)] text-sara-gold border border-[rgba(214,178,106,0.3)] py-2.5 px-5 rounded-[20px] text-xs font-semibold cursor-pointer transition-all duration-300 uppercase tracking-[0.5px] hover:bg-[rgba(214,178,106,0.15)]'
              }
            >
              {t('crystalsPage.allCrystals')}
            </button>
            {crystalCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSearchParams({ subcategory: cat.name })}
                className={
                  selectedCategory === cat.name
                    ? 'bg-sara-gold text-sara-dark border border-[rgba(214,178,106,0.3)] py-2.5 px-5 rounded-[20px] text-xs font-semibold cursor-pointer transition-all duration-300 uppercase tracking-[0.5px]'
                    : 'bg-[rgba(214,178,106,0.05)] text-sara-gold border border-[rgba(214,178,106,0.3)] py-2.5 px-5 rounded-[20px] text-xs font-semibold cursor-pointer transition-all duration-300 uppercase tracking-[0.5px] hover:bg-[rgba(214,178,106,0.15)]'
                }
              >
                <TranslatedCategoryName name={cat.name} locale={locale} />
              </button>
            ))}
          </div>

        </div>

        {/* Main Content Grid */}
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="text-sara-gold text-[15px] tracking-[1px]">{t('crystalsPage.loading')}</span>
            </div>
          ) : (
            <>
              {filteredItems.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-[rgba(214,178,106,0.15)] rounded">
                  <p className="text-[rgba(207,207,207,0.6)] m-0">{t('crystalsPage.empty')}</p>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-8">
                  {filteredItems.slice(0, visibleCount).map((item, idx) => (
                    <div 
                      key={item.id}
                      data-aos="fade-up"
                      data-aos-delay={idx * 100}
                      onClick={(e) => handleOpenPopup(item.id, e)}
                      className="bg-gradient-to-br from-[#1E0F2B] to-[#0C0614] border border-[rgba(214,178,106,0.2)] rounded overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between hover:border-sara-gold hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(161,61,142,0.15)]"
                    >
                      {/* Card Image */}
                      {item.image && (
                        <div className="w-full h-[200px] overflow-hidden relative bg-[#12071C]">
                           <img 
                             src={item.image?.startsWith('/uploads') ? `${API_BASE_URL.replace(/\/$/, '')}${item.image}` : item.image} 
                             alt={item.name} 
                             className="w-full h-full object-cover" 
                             onError={(e) => {
                               e.target.onerror = null; 
                               e.target.src = '/images/saraa-logo.jpeg';
                             }}
                           />
                           <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1E0F2B] to-transparent" />
                        </div>
                      )}
                      
                      {/* Card Content */}
                      <div className="p-5 grow flex flex-col justify-between">
                        <div>
                          <div className="text-sara-gold text-[10px] uppercase tracking-[1px] font-semibold mb-1">
                            {item.type}
                          </div>
                          <h4 className="text-white text-[1.15rem] mb-2 font-bold leading-snug">
                            {item.name}
                          </h4>
                          {item.desc && (
                            <ul className="text-[#D3C7DC] text-[0.85rem] leading-5 mb-4 pl-4 m-0 list-disc text-left">
                              {item.desc.split('\n').map((point, index) => point.trim() && (
                                <li key={index} className="mb-1">{point.trim()}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        
                        <div>
                          {/* Healing Radio Selection */}
                          <div 
                            className="flex flex-col gap-1.5 mt-2 border-t border-[rgba(214,178,106,0.15)] pt-2.5 mb-2 select-none" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="text-[9px] text-[rgba(255,255,255,0.45)] uppercase tracking-[0.5px] font-semibold">
                              {locale === 'ta' ? 'குணப்படுத்துதல் விருப்பம்:' : 'Healing Option:'}
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="flex items-center gap-1.5 text-[11px] text-[#D3C7DC] cursor-pointer">
                                <input
                                  type="radio"
                                  name={`healing-${item.id}`}
                                  checked={!cardHealing[item.id]}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setCardHealing(prev => ({ ...prev, [item.id]: false }));
                                  }}
                                  className="w-3.5 h-3.5 accent-sara-gold cursor-pointer"
                                />
                                <span>{locale === 'ta' ? 'இல்லை' : 'No Healing'}</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px] text-sara-gold font-semibold cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`healing-${item.id}`}
                                    checked={!!cardHealing[item.id]}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setCardHealing(prev => ({ ...prev, [item.id]: true }));
                                    }}
                                    className="w-3.5 h-3.5 accent-sara-gold cursor-pointer"
                                  />
                                <span>{locale === 'ta' ? 'குணப்படுத்துதலுடன் (+ ரூ. 1,000)' : 'With Healing (+ ₹1,000)'}</span>
                              </label>
                            </div>
                          </div>

                          <div className="text-sara-gold text-[1.4rem] font-semibold my-3">
                            ₹{(item.price + (cardHealing[item.id] ? 1000 : 0)).toLocaleString('en-IN')}
                          </div>
 
                          {/* Size Selection */}
                          {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                            <div className="my-2">
                              <div className="text-[10px] text-[rgba(255,255,255,0.45)] uppercase tracking-[1px] font-semibold mb-1.5">
                                {t('crystalsPage.selectSize')}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.sizes.map((size, idx) => (
                                  <button
                                    key={idx}
                                    disabled={item.stock === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSizes(prev => ({ ...prev, [item.id]: size }));
                                    }}
                                    className={
                                      item.stock === 0
                                        ? 'bg-gray-800 text-gray-500 border border-gray-700 py-1 px-2.5 rounded-full text-[11px] font-semibold line-through cursor-not-allowed opacity-50'
                                        : selectedSizes[item.id] === size
                                          ? 'bg-sara-gold text-[#1E0F2B] border border-sara-gold py-1 px-2.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all'
                                          : 'bg-transparent text-[#D3C7DC] border border-[rgba(214,178,106,0.25)] py-1 px-2.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all hover:border-sara-gold'
                                    }
                                  >
                                    {size} {item.stock === 0 && `(${locale === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock'})`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Stock Status */}
                          {item.stock !== null && item.stock !== undefined && (
                            <div className="text-[11px] font-medium mt-2 font-sans">
                              {item.stock === 0 ? (
                                <span className="text-[#ef5350] font-bold uppercase tracking-[0.5px]">● Out of Stock</span>
                              ) : item.stock <= 5 ? (
                                <span className="text-amber-500 font-bold text-[15px] animate-pulse block">⚠️ Only {item.stock} left!</span>
                              ) : null}
                            </div>
                          )}

                          <div className="flex gap-3 mt-3">
                            <button 
                              onClick={(e) => handleOpenPopup(item.id, e)}
                              className="flex-1 bg-transparent text-sara-gold border border-[rgba(214,178,106,0.4)] py-2 text-[0.75rem] font-semibold uppercase tracking-[1px] cursor-pointer transition-all hover:bg-sara-gold hover:text-[#1E0F2B] hover:border-sara-gold"
                            >
                              {t('crystalsPage.details')}
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item);
                              }}
                              disabled={item.stock === 0}
                              className={`flex-1 bg-transparent py-2 text-[0.75rem] font-semibold uppercase tracking-[1px] cursor-pointer transition-all ${
                                item.stock === 0
                                  ? 'text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
                                  : 'text-sara-gold border border-[rgba(214,178,106,0.4)] hover:bg-sara-gold hover:text-[#1E0F2B] hover:border-sara-gold'
                              }`}
                            >
                              {item.stock === 0 ? (locale === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock') : t('crystalsPage.addToCart')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredItems.length > visibleCount && (
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
            </>
          )}
        </div>

      </div>

      {/* --- DETAILS MODAL POPUP --- */}
      {activeItemId && currentItem && (
        <div 
          onClick={handleClosePopup}
          className="fixed inset-0 bg-[rgba(11,18,37,0.85)] backdrop-blur-[6px] flex items-center justify-center z-[2000] p-4"
        >
          {/* Modal Container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#1E0F2B] to-[#0C0614] border border-[rgba(214,178,106,0.25)] rounded-lg max-w-[900px] w-full max-h-[90vh] overflow-y-auto relative p-10 shadow-[0_20px_50px_rgba(161,61,142,0.15)]"
          >
            {/* Close Button */}
            <button 
              onClick={handleClosePopup}
              className="absolute top-4 right-6 bg-transparent border-none text-sara-gold text-2xl font-light cursor-pointer leading-none p-1 transition-transform hover:scale-[1.15]"
            >
              &times;
            </button>

            {/* Content Split Layout */}
            <div className="flex flex-row gap-10 flex-wrap mt-2">
              
              {/* Left Column: Image */}
              {currentItem.image && (
                <div className="flex-[1_1_350px]">
                  <img 
                    src={currentItem.image?.startsWith('/uploads') ? `${API_BASE_URL.replace(/\/$/, '')}${currentItem.image}` : currentItem.image} 
                    alt={currentItem.name} 
                    className="w-full rounded border border-[rgba(214,178,106,0.15)] bg-[#12071C] object-cover h-full min-h-[300px] max-h-[400px]"
                  />
                </div>
              )}

              {/* Right Column: Text & Pricing Info */}
              <div className="flex-[1_2_400px] flex flex-col justify-between">
                <div>
                  <span className="text-sara-gold uppercase text-[0.8rem] tracking-[2px] font-semibold">
                    {currentItem.type}
                  </span>
                  <h2 className="text-white text-[1.8rem] font-medium mt-2 mb-3 leading-snug">
                    {currentItem.name}
                  </h2>
                  <div className="text-sara-gold text-[1.75rem] font-semibold mb-5">
                    ₹{(currentItem.price + (cardHealing[currentItem.id] ? 1000 : 0)).toLocaleString('en-IN')}
                  </div>

                  {/* Size Selection in Modal */}
                  {Array.isArray(currentItem.sizes) && currentItem.sizes.length > 0 && (
                    <div className="mb-5">
                      <div className="text-[11px] text-[#D3C7DC] uppercase tracking-[1.5px] font-semibold mb-2">
                        {t('crystalsPage.selectSize')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentItem.sizes.map((size, idx) => (
                          <button
                            key={idx}
                            disabled={currentItem.stock === 0}
                            onClick={() => setSelectedSizes(prev => ({ ...prev, [currentItem.id]: size }))}
                            className={
                              currentItem.stock === 0
                                ? 'bg-gray-800 text-gray-500 border border-gray-700 py-1.5 px-4 rounded-2xl text-xs font-semibold line-through cursor-not-allowed opacity-50'
                                : selectedSizes[currentItem.id] === size
                                  ? 'bg-sara-gold text-[#1E0F2B] border border-sara-gold py-1.5 px-4 rounded-2xl text-xs font-semibold cursor-pointer transition-all'
                                  : 'bg-transparent text-[#D3C7DC] border border-[rgba(214,178,106,0.3)] py-1.5 px-4 rounded-2xl text-xs font-semibold cursor-pointer transition-all hover:border-sara-gold'
                            }
                          >
                            {size} {currentItem.stock === 0 && `(${locale === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock'})`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Healing Selection in Modal */}
                  <div className="mb-5">
                    <div className="text-[11px] text-[#D3C7DC] uppercase tracking-[1.5px] font-semibold mb-2">
                      {locale === 'ta' ? 'குணப்படுத்துதல் விருப்பம்:' : 'Healing Option:'}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm text-[#D3C7DC] cursor-pointer">
                        <input 
                          type="radio" 
                          name="modal-healing" 
                          checked={!cardHealing[currentItem.id]}
                          onChange={() => setCardHealing(prev => ({ ...prev, [currentItem.id]: false }))}
                          className="w-4 h-4 accent-sara-gold cursor-pointer"
                        />
                        <span>{locale === 'ta' ? 'இல்லை' : 'Without Healing'}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-sara-gold font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="modal-healing" 
                          checked={!!cardHealing[currentItem.id]}
                          onChange={() => setCardHealing(prev => ({ ...prev, [currentItem.id]: true }))}
                          className="w-4 h-4 accent-sara-gold cursor-pointer"
                        />
                        <span>{locale === 'ta' ? 'குணப்படுத்துதலுடன் (+ ரூ. 1,000)' : 'With Healing (+ ₹1,000)'}</span>
                      </label>
                    </div>
                  </div>
                  
                  <hr className="border-none border-t border-[rgba(214,178,106,0.15)] my-4" />
                  
                  {currentItem.desc && (
                    <ul className="text-[#D3C7DC] leading-6 text-[0.95rem] mb-6 pl-5 m-0 list-disc text-left">
                      {currentItem.desc.split('\n').map((point, index) => point.trim() && (
                        <li key={index} className="mb-1.5">{point.trim()}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <button 
                  onClick={(e) => {
                    handleAddToCart(currentItem);
                    handleClosePopup();
                  }}
                  disabled={currentItem.stock === 0}
                  className={`border-none py-4 px-8 text-[0.95rem] font-semibold uppercase tracking-[1.5px] cursor-pointer w-full rounded-sm transition-all ${
                    currentItem.stock === 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60 border border-gray-600'
                      : 'bg-gradient-to-r from-sara-gold to-sara-goldSoft text-[#1E0F2B] hover:opacity-90'
                  }`}
                >
                  {currentItem.stock === 0 ? (locale === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock') : t('crystalsPage.addToCart')}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>

    <WelfareTrust />
    </>
  );
}
