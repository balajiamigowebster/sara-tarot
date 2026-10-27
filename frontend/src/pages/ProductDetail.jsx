import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { translateProduct } from '../utils/translator';

const FALLBACK_IMAGES = {
  'crystal': '/crystal.jpg',
  'murugar cards': '/card-1.jpg',
  'tarot private consultation': '/tarot.jpg',
  'spiritual healing': '/meditation.jpg',
  'kali pooja': '/card-3.jpg',
  'tarot card reading': '/tarot.jpg',
  'spiritual counseling': '/meditation.jpg',
};

const SLUG_MAP = {
  'crystals': 'crystal',
  'murugar-cards': 'Murugar Cards',
  'tarot-consultation': 'Tarot Private Consultation',
  'spiritual-healing': 'Spiritual Healing',
  'kali-pooja': 'Kali Pooja',
  'tarot-classes': 'Tarot Card Reading',
  'counseling-classes': 'Spiritual Counseling',
};

export default function ProductDetail({ cart = [], setCart, setIsCartOpen }) {
  const { locale, t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [rawProduct, setRawProduct] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [healing, setHealing] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        setRawProduct(res.data);
        if (res.data.sizes && res.data.sizes.length > 0) {
          setSelectedSize(res.data.sizes[0]);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!rawProduct) return;
    setProduct(rawProduct); // Immediate snappy fallback

    let active = true;
    translateProduct(rawProduct, locale).then((res) => {
      if (active) setProduct(res);
    });
    return () => {
      active = false;
    };
  }, [rawProduct, locale]);

  const getImgSrc = () => {
    if (!product) return '/saraa-logo.jpeg';
    if (product.image) return product.image;
    const catLower = (product.category || '').toLowerCase();
    return FALLBACK_IMAGES[catLower] || '/saraa-logo.jpeg';
  };

  const getCategorySlug = () => {
    if (!product) return '/';
    const catLower = (product.category || '').toLowerCase();
    // Check crystal subcategories
    const crystalSlugs = ['rasi', 'bracelet', 'pyrite', 'rings', 'pendants', 'tumbles', 'crystal balls', 'pyrite frames', 'crystal mala', 'crystal tower'];
    if (crystalSlugs.includes(catLower)) return '/products/crystals';
    // Check service categories
    for (const [slug, catName] of Object.entries(SLUG_MAP)) {
      if (catLower === catName.toLowerCase()) return `/products/${slug}`;
    }
    return '/';
  };

  const CRYSTAL_CATEGORIES = ["rasi", "bracelet", "pyrite", "rings", "pendants", "tumbles", "crystal balls", "pyrite frames", "crystal mala", "crystal tower", "crystal"];
  const isCrystal = product && product.category && CRYSTAL_CATEGORIES.includes(product.category.toLowerCase());

  const handleAddToCart = () => {
    if (!setCart || !product) return;

    const hasHealing = isCrystal && healing;
    const finalPrice = product.price + (hasHealing ? 1000 : 0);
    const suffix = hasHealing ? (locale === 'ta' ? ' (+ கூடுதல் குணப்படுத்தும் சக்தி)' : ' (+ Extra Healing Power)') : '';
    const nameWithSuffix = `${product.name}${suffix}`;
    
    const sizeKey = selectedSize ? `-${selectedSize}` : '';
    const healingKey = hasHealing ? '-healing' : '';
    const cartItemId = `${product.id}${sizeKey}${healingKey}`;
    const cartName = selectedSize
      ? `${nameWithSuffix} (${selectedSize})`
      : nameWithSuffix;

    const existingItem = cart.find((item) => item.id === cartItemId);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
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
          image: getImgSrc(),
          quantity,
          category: product.category || '',
          isCrystal: product.category ? ["rasi", "bracelet", "pyrite", "rings", "pendants", "tumbles", "crystal balls", "pyrite frames", "crystal mala", "crystal tower", "crystal"].includes(product.category.toLowerCase()) : false
        }
      ]);
    }

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    if (setIsCartOpen) setIsCartOpen(true);
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#F8F6FF] flex items-center justify-center pt-16">
        <div className="text-sara-gold text-sm tracking-wider">{t('productDetail.loading')}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F6FF] flex flex-col items-center justify-center pt-16 gap-4">
        <div className="text-sara-muted text-lg">{t('productDetail.notFound')}</div>
        <Link to="/" className="text-sara-gold text-sm uppercase tracking-wider no-underline hover:underline">
          {t('productDetail.returnHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6FF] text-[#2A1635] font-sans pt-16 pb-24">
      {/* Header gradient */}
      <div className="bg-[radial-gradient(ellipse_at_center,rgba(161,61,142,0.06)_0%,transparent_70%)] bg-white border-b border-[rgba(214,178,106,0.1)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8 pb-6">
          <div className="mb-6 text-[13px] tracking-[0.5px]">
            <Link to="/" className="text-sara-muted no-underline hover:text-sara-gold transition-colors">{t('productDetail.home')}</Link>
            <span className="text-[rgba(42,22,53,0.2)] mx-2">/</span>
            <Link to={getCategorySlug()} className="text-sara-muted no-underline hover:text-sara-gold transition-colors">{product.category}</Link>
            <span className="text-[rgba(42,22,53,0.2)] mx-2">/</span>
            <span className="text-sara-gold">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div
          data-aos="fade-up"
          className="flex flex-col lg:flex-row gap-10 p-8 sm:p-12 my-10 bg-gradient-to-br from-[#1E0F2B] to-[#0C0614] border border-[rgba(214,178,106,0.2)] rounded-2xl shadow-[0_20px_50px_rgba(161,61,142,0.15)]"
        >
          {/* Image */}
          <div className="flex-[1_1_450px]">
            <div className="relative rounded-lg overflow-hidden border border-[rgba(214,178,106,0.15)] bg-[#12071C]">
              <img
                src={getImgSrc()}
                alt={product.name}
                className="w-full h-[400px] sm:h-[500px] object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_IMAGES[(product.category || '').toLowerCase()] || '/saraa-logo.jpeg';
                }}
              />
              <div className="absolute top-4 right-4 bg-[rgba(30,15,43,0.85)] border border-[rgba(214,178,106,0.25)] px-3 py-1.5 rounded text-[11px] text-sara-gold font-bold uppercase tracking-wider backdrop-blur-sm">
                {product.type}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-[1_1_400px] flex flex-col">
            <span className="text-sara-gold text-[11px] uppercase tracking-[2px] font-semibold mb-2">
              {product.category}
            </span>
            <h1 className="text-white font-serif text-[2rem] sm:text-[2.5rem] font-normal leading-tight mb-4">
              {product.name}
            </h1>
            {product.desc && (
              <ul className="text-[#D3C7DC] text-[0.95rem] leading-7 mb-6 pl-5 m-0 list-disc">
                {product.desc.split('\n').map((point, index) => point.trim() && (
                  <li key={index} className="mb-1.5">{point.trim()}</li>
                ))}
              </ul>
            )}

            <div className="text-sara-gold text-[2rem] font-semibold mb-6">
              Rs. {(product.price + (isCrystal && healing ? 1000 : 0)).toLocaleString('en-IN')}
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-[11px] text-[#D3C7DC] uppercase tracking-[1px] mb-2 font-medium">
                  {t('productDetail.selectSize')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      disabled={product.stock === 0}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                        product.stock === 0
                          ? 'bg-gray-800 text-gray-500 border-gray-700 line-through cursor-not-allowed opacity-50'
                          : selectedSize === size
                            ? 'bg-sara-gold text-[#1E0F2B] border-sara-gold'
                            : 'bg-transparent text-[#D3C7DC] border-[rgba(214,178,106,0.25)] hover:border-sara-gold'
                      }`}
                    >
                      {size} {product.stock === 0 && `(${locale === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock'})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Healing Option for Crystals */}
            {isCrystal && (
              <div className="mb-6">
                <label className="block text-[11px] text-[#D3C7DC] uppercase tracking-[1px] mb-2 font-medium">
                  {locale === 'ta' ? 'குணப்படுத்துதல் விருப்பம்:' : 'Healing Option:'}
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-[#D3C7DC] cursor-pointer">
                    <input 
                      type="radio" 
                      name="detail-healing" 
                      checked={!healing}
                      onChange={() => setHealing(false)}
                      className="w-4 h-4 accent-sara-gold cursor-pointer"
                    />
                    <span>{locale === 'ta' ? 'இல்லை' : 'Without Healing'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-sara-gold font-semibold cursor-pointer">
                    <input 
                      type="radio" 
                      name="detail-healing" 
                      checked={healing}
                      onChange={() => setHealing(true)}
                      className="w-4 h-4 accent-sara-gold cursor-pointer"
                    />
                    <span>{locale === 'ta' ? 'குணப்படுத்துதலுடன் (+ ரூ. 1,000)' : 'With Healing (+ ₹1,000)'}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-[11px] text-[#D3C7DC] uppercase tracking-[1px] mb-2 font-medium">
                {t('productDetail.quantity')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded border border-[rgba(214,178,106,0.25)] bg-transparent text-sara-gold text-lg flex items-center justify-center cursor-pointer transition-all hover:border-sara-gold"
                >
                  -
                </button>
                <span className="text-white text-sm font-medium w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded border border-[rgba(214,178,106,0.25)] bg-transparent text-sara-gold text-lg flex items-center justify-center cursor-pointer transition-all hover:border-sara-gold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Policy & Shipping Notice */}
            <div className="my-6 p-4 rounded-lg bg-[rgba(214,178,106,0.04)] border border-[rgba(214,178,106,0.2)] text-xs text-[#D3C7DC] leading-relaxed">
              <div className="font-semibold text-sara-gold uppercase tracking-[1px] mb-1.5">{t('productDetail.policyTitle')}</div>
              <ul className="list-disc pl-4 m-0 flex flex-col gap-1 text-[#D3C7DC]">
                <li>{t('productDetail.policyNoRefund')}</li>
                <li>{t('productDetail.policyTimeline')}</li>
              </ul>
            </div>

            {/* Stock Alerts */}
            {product.stock !== null && product.stock !== undefined && (
              <div className="mb-4 font-sans text-[14px]">
                {product.stock === 0 ? (
                  <div className="text-[#ef5350] font-bold uppercase tracking-[1px] flex items-center gap-1.5">
                    ● Out of Stock
                  </div>
                ) : product.stock <= 5 ? (
                  <div className="text-amber-500 font-bold text-[18px] tracking-[0.5px] flex items-center gap-1.5 animate-pulse">
                    ⚠️ Only {product.stock} left in stock!
                  </div>
                ) : null}
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full py-3.5 rounded text-xs font-bold uppercase tracking-[1.5px] cursor-pointer transition-all duration-300 mb-6 ${
                product.stock === 0
                  ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed opacity-60'
                  : addedToCart
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gradient-to-r from-sara-gold to-sara-goldSoft text-sara-textDark border-none hover:shadow-[0_4px_20px_rgba(214,178,106,0.3)] hover:-translate-y-0.5'
              }`}
            >
              {product.stock === 0 
                ? (locale === 'ta' ? 'இருப்பு இல்லை' : 'Out of Stock') 
                : (addedToCart ? t('productDetail.addedToCart') : t('productDetail.addToCart'))}
            </button>


          </div>
        </div>

        {/* Back link */}
        <div className="border-t border-[rgba(214,178,106,0.1)] pt-8 mt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sara-gold text-[11px] uppercase tracking-[1.5px] font-semibold bg-transparent border border-[rgba(214,178,106,0.3)] px-5 py-2.5 rounded-sm cursor-pointer transition-all hover:bg-[rgba(214,178,106,0.1)] hover:border-sara-gold"
          >
            {t('productDetail.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
