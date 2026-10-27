import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import ProductDetailModal from '../components/ProductDetailModal';
import { useLanguage } from '../context/LanguageContext';
import { translateProduct } from '../utils/translator';

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] }
  }
};

const CATEGORY_SECTIONS = [
  { title: 'Saraa Healing Crystals', viewAllPath: '/products/crystals', filterType: 'crystal' },
  { title: 'Tarot Card Reading', viewAllPath: '/products/tarot-classes', categoryName: 'Tarot Card Reading' },
  { title: 'Tarot Private Consultation', viewAllPath: '/products/tarot-consultation', categoryName: 'Tarot Private Consultation' },
  { title: 'Murugar Card Deck', viewAllPath: '/products/murugar-cards', categoryName: 'Murugar Cards' },
  { title: 'Spiritual Healing', viewAllPath: '/products/spiritual-healing', categoryName: 'Spiritual Healing' },
  { title: 'Kali Pooja', viewAllPath: '/products/kali-pooja', categoryName: 'Kali Pooja' },
  { title: 'Spiritual Counseling', viewAllPath: '/products/counseling-classes', categoryName: 'Spiritual Counseling' },
];

const FALLBACK_IMAGES = {
  'crystal': '/crystal.jpg',
  'murugar cards': '/card-1.jpg',
  'tarot private consultation': '/tarot.jpg',
  'spiritual healing': '/meditation.jpg',
  'kali pooja': '/card-3.jpg',
  'tarot card reading': '/tarot.jpg',
  'spiritual counseling': '/meditation.jpg',
};

function ScrollableCarousel({ children }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          onClick={() => scrollByAmount(-300)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-[rgba(214,178,106,0.2)] text-[#1E0F2B] hover:bg-sara-gold hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center -ml-4"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scrollByAmount(300)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-[rgba(214,178,106,0.2)] text-[#1E0F2B] hover:bg-sara-gold hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center -mr-4"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}

function getProductImage(product, categoryFallbacks) {
  if (product.image && !product.image.startsWith('/') && !product.image.endsWith('.png')) {
    return product.image;
  }
  if (product.image) {
    return product.image;
  }
  const catLower = (product.category || '').toLowerCase();
  return categoryFallbacks[catLower] || '/saraa-logo.jpeg';
}

export default function Products({ cart = [], setCart, setIsCartOpen }) {
  const { locale, t } = useLanguage();
  const [allProducts, setAllProducts] = useState([]);
  const [translatedProducts, setTranslatedProducts] = useState([]);
  const [crystalCategoryNames, setCrystalCategoryNames] = useState([]);
  const [categories, setCategories] = useState([]); // ADDED CATEGORIES STATE
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState(null);
  const [cardHealing, setCardHealing] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products`),
          axios.get(`${API_BASE_URL}/api/categories`)
        ]);
        const products = Array.isArray(prodRes.data) ? prodRes.data : [];
        const categoriesData = Array.isArray(catRes.data) ? catRes.data : [];
        setAllProducts(products);
        setCategories(categoriesData); // STORE IN STATE
        const crystalNames = categoriesData
          .filter(c => c.type === 'crystal')
          .map(c => c.name.toLowerCase());
        setCrystalCategoryNames(crystalNames);
      } catch (err) {
        console.error('Failed to fetch products for homepage:', err);
        setAllProducts([]);
        setCrystalCategoryNames([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (allProducts.length === 0) return;
    setTranslatedProducts(allProducts); // Immediately show original text

    let active = true;
    const translateAll = async () => {
      const translated = await Promise.all(
        allProducts.map(p => translateProduct(p, locale))
      );
      if (active) {
        setTranslatedProducts(translated);
      }
    };
    translateAll();
    return () => {
      active = false;
    };
  }, [allProducts, locale]);

  const getProductsForSection = (section) => {
    let prods = [];
    if (section.filterType === 'crystal') {
      const allCrystals = translatedProducts.filter(p =>
        p.category && crystalCategoryNames.includes(p.category.toLowerCase())
      );
      
      const grouped = {};
      allCrystals.forEach(p => {
        const cat = p.category.toLowerCase();
        if (!grouped[cat]) grouped[cat] = [];
        if (grouped[cat].length < 2) {
          grouped[cat].push(p);
        }
      });
      
      prods = Object.values(grouped).flat();
    } else {
      prods = translatedProducts.filter(p =>
        p.category && p.category.toLowerCase() === (section.categoryName || '').toLowerCase()
      );
    }

    if (categories.length > 0) {
      prods.sort((a, b) => {
        const catA = categories.find(c => c.name.toLowerCase() === (a.category || '').toLowerCase());
        const catB = categories.find(c => c.name.toLowerCase() === (b.category || '').toLowerCase());
        const orderA = catA && catA.order !== undefined ? catA.order : 999;
        const orderB = catB && catB.order !== undefined ? catB.order : 999;
        return orderA - orderB;
      });
    }

    return prods.slice(0, 12);
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (!setCart) return;

    const qty = product._quantity || 1;
    const size = product._selectedSize || null;

    const isCrystal = product.category && crystalCategoryNames.includes(product.category.toLowerCase());
    const hasHealing = product._healing !== undefined ? product._healing : (isCrystal && !!cardHealing[product.id]);

    let finalPrice = product.price;
    let finalName = product.name;
    if (hasHealing) {
      finalPrice += 1000;
      const suffix = locale === 'ta' ? ' (+ கூடுதல் குணப்படுத்தும் சக்தி)' : ' (+ Extra Healing Power)';
      finalName = `${product.name}${suffix}`;
    }

    const sizeKey = size ? `-${size}` : '';
    const healingKey = hasHealing ? '-healing' : '';
    const cartItemId = `${product.id}${sizeKey}${healingKey}`;
    const cartName = size ? `${finalName} (${size})` : finalName;

    const existingItem = cart.find((item) => item.id === cartItemId);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: cartItemId,
          name: cartName,
          price: finalPrice,
          image: getProductImage(product, FALLBACK_IMAGES),
          quantity: qty,
          category: product.category || '',
          isCrystal: !!isCrystal
        }
      ]);
    }
    if (setIsCartOpen) {
      setIsCartOpen(true);
    }
  };

  const translateSectionTitle = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('crystals') || lower.includes('crystal')) return t('crystalsPage.title');
    if (lower.includes('murugar')) return t('categories.murugar.title');
    if (lower.includes('private consultation') || lower.includes('tarot consultation')) return t('categories.tarot.title');
    if (lower.includes('spiritual healing') || lower.includes('healing')) return t('categories.healing.title');
    if (lower.includes('kali pooja') || lower.includes('pooja')) return t('categories.pooja.title');
    if (lower.includes('tarot card reading') || lower.includes('tarot reading') || lower.includes('tarot classes')) return t('categories.tarotClasses.title');
    if (lower.includes('spiritual counseling') || lower.includes('counseling')) return t('categories.counselingClasses.title');
    return title;
  };

  return (
    <div id="products-section" className="relative font-sans py-20 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(161,61,142,0.05)_0%,transparent_70%),linear-gradient(180deg,#FDFCFF_0%,#F8F6FF_50%,#F5EEFF_100%)]">

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUpVariants}
        className="max-w-[1240px] mx-auto px-8 mb-14 text-center"
      >
        <h1 className="text-sara-gold text-4xl font-bold uppercase tracking-[2px] mb-2 font-serif">
          {t('products.title')}
        </h1>
        <p className="text-sara-muted text-base tracking-[0.5px]">
          {t('products.description')}
        </p>
      </motion.div>

      {loading ? (
        <div className="text-center py-20 text-sara-gold text-sm tracking-wider">
          {t('products.loading')}
        </div>
      ) : (
        (() => {
          // Clone the default sections
          let sortedSections = [...CATEGORY_SECTIONS];
          
          // Try to sort them based on the categories fetched from backend
          // We removed this sorting logic to respect the frontend-defined order.

          return sortedSections.map((section, sIdx) => {
            const sectionProducts = getProductsForSection(section);
            if (sectionProducts.length === 0) return null;

            return (
              <motion.div
              key={section.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
              variants={fadeInUpVariants}
              className="max-w-[1240px] mx-auto px-8 mb-14"
            >
              <div className="flex items-end justify-between mb-6 border-b border-[rgba(214,178,106,0.15)] pb-4">
                <h2 className="text-black text-2xl font-light uppercase tracking-[1.5px] m-0 font-serif">
                  {translateSectionTitle(section.title)}
                </h2>
                <Link
                  to={section.viewAllPath}
                  className="bg-[rgba(214,178,106,0.1)] text-sara-gold text-[12px] font-bold uppercase tracking-[1.5px] no-underline border border-sara-gold px-5 py-2.5 rounded shadow-[0_0_10px_rgba(214,178,106,0.15)] transition-all duration-300 hover:bg-sara-gold hover:text-[#1E0F2B] hover:shadow-[0_0_15px_rgba(214,178,106,0.4)]"
                >
                  {t('products.viewAll')}
                </Link>
              </div>

              <ScrollableCarousel>
                {sectionProducts.map((product, idx) => {
                  const imgSrc = getProductImage(product, FALLBACK_IMAGES);
                  const isCrystal = product.category && crystalCategoryNames.includes(product.category.toLowerCase());
                  const hasHealing = isCrystal && !!cardHealing[product.id];

                  return (
                    <div
                      key={product.id}
                      data-aos="fade-up"
                      data-aos-delay={(idx % 10) * 100}
                      onClick={() => setActiveProduct(product)}
                      className="min-w-[260px] max-w-[260px] bg-gradient-to-br from-[#1E0F2B] to-[#0C0614] border border-[rgba(214,178,106,0.2)] rounded-lg overflow-hidden flex flex-col flex-shrink-0 transition-all duration-300 hover:border-sara-gold hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(161,61,142,0.15)] select-none cursor-pointer"
                    >
                      <div className="w-full h-[180px] overflow-hidden relative bg-[#12071C]">
                        <img
                          src={imgSrc}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-contain p-2 transition-transform duration-500 hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGES[(product.category || '').toLowerCase()] || '/saraa-logo.jpeg';
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1E0F2B] to-transparent" />
                        <div className="absolute top-3 right-3 bg-[rgba(30,15,43,0.85)] border border-[rgba(214,178,106,0.25)] px-2.5 py-1 rounded text-[10px] text-sara-gold font-bold uppercase tracking-wider backdrop-blur-sm">
                          {product.type}
                        </div>
                      </div>

                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="text-white text-[15px] font-medium leading-tight m-0 mb-1 line-clamp-2">
                            {product.name}
                          </h3>
                          {product.desc && (
                            <ul className="text-[#D3C7DC] text-[12px] m-0 mb-2 pl-4 list-disc line-clamp-2 leading-relaxed">
                              {product.desc.split('\n').map((point, i) => point.trim() && (
                                <li key={i}>{point.trim()}</li>
                              ))}
                            </ul>
                          )}

                          {/* Stock Status Alerts on Home Cards */}
                          {product.stock !== null && product.stock !== undefined && (
                            <div className="text-left font-sans text-xs font-semibold mb-2" onClick={(e) => e.stopPropagation()}>
                              {product.stock === 0 ? (
                                <span className="text-[#ef5350] font-bold uppercase tracking-[0.5px]">● Out of Stock</span>
                              ) : product.stock <= 5 ? (
                                <span className="text-amber-500 font-bold text-[15px] animate-pulse block">⚠️ Only {product.stock} left in stock!</span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div>
                          {isCrystal && (
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
                                    name={`healing-${product.id}`}
                                    checked={!cardHealing[product.id]}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setCardHealing(prev => ({ ...prev, [product.id]: false }));
                                    }}
                                    className="w-3.5 h-3.5 accent-sara-gold cursor-pointer"
                                  />
                                  <span>{locale === 'ta' ? 'இல்லை' : 'No Healing'}</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-[11px] text-sara-gold font-semibold cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`healing-${product.id}`}
                                    checked={!!cardHealing[product.id]}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setCardHealing(prev => ({ ...prev, [product.id]: true }));
                                    }}
                                    className="w-3.5 h-3.5 accent-sara-gold cursor-pointer"
                                  />
                                  <span>{locale === 'ta' ? 'குணப்படுத்துதலுடன் (+ ₹1,000)' : 'With Healing (+ ₹1,000)'}</span>
                                </label>
                              </div>
                            </div>
                          )}

                          <div className="text-sara-gold text-xl font-semibold my-3">
                            Rs. {(product.price + (hasHealing ? 1000 : 0)).toLocaleString('en-IN')}
                          </div>
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={product.stock === 0}
                            className={`w-full py-2.5 text-[11px] font-semibold uppercase tracking-[1px] cursor-pointer transition-all duration-200 rounded-sm flex items-center justify-center gap-1.5 ${product.stock === 0
                                ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed opacity-60'
                                : 'bg-transparent text-sara-gold border border-[rgba(214,178,106,0.4)] hover:bg-sara-gold hover:text-[#1E0F2B] hover:border-sara-gold'
                              }`}
                          >
                            <span>{product.stock === 0 ? (locale === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock') : t('products.addToCart')}</span>
                            {product.stock !== 0 && <span className="text-[13px] font-normal leading-none">→</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ScrollableCarousel>
            </motion.div>
          );
          });
        })()
      )}

      {/* Product Detail Modal */}
      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={(p) => handleAddToCart(p)}
        />
      )}
    </div>
  );
}
