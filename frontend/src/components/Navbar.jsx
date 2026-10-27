import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { logout } from '../store/slices/authSlice';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ cartItems = [], setCartItems, isCartOpen, setIsCartOpen }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [isCrystalsDropdownOpen, setIsCrystalsDropdownOpen] = useState(false);
  const [isMobileCrystalsOpen, setIsMobileCrystalsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const { locale, setLocale, t } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);


  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/categories`)
      .then(res => {
        setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error('Failed to load categories in Navbar:', err);
        setCategories([]);
      });
  }, []);

  const user = useSelector(state => state.auth.user);
  const [hasPurchasedClass, setHasPurchasedClass] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasPurchasedClass(false);
      return;
    }

    if (user.hasPurchasedClass) {
      setHasPurchasedClass(true);
    }

    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_BASE_URL}/api/orders/has-class-purchase`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.data?.hasPurchasedClass) {
          setHasPurchasedClass(true);
        } else {
          setHasPurchasedClass(false);
        }
      })
      .catch(err => {
        console.warn('Failed to check class purchase status:', err?.response?.data?.message || err.message);
      });
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const itemsTotalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstAmount = Math.round(itemsTotalAmount * 0.18);
  const grandTotal = itemsTotalAmount + gstAmount;

  const removeItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const CartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  );

  const getCategoryPath = (cat) => {
    const name = cat.name.toLowerCase();
    if (name.includes('private consultation') || name.includes('consultation')) return '/products/tarot-consultation';
    if (name.includes('spiritual healing') || name.includes('healing')) return '/products/spiritual-healing';
    if (name.includes('murugar')) return '/products/murugar-cards';
    if (name.includes('tarot card reading') || name.includes('tarot reading') || name.includes('tarot classes')) return '/products/tarot-classes';
    if (name.includes('spiritual counseling') || name.includes('counseling')) return '/products/counseling-classes';
    if (name.includes('kali pooja')) return '/products/kali-pooja';
    return `/products/${cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  };

  const getTranslatedLabel = (name) => {
    const lowerName = name.toLowerCase().trim();
    if (lowerName.includes('crystals')) return t('nav.crystals');
    if (lowerName.includes('private consultation') || lowerName.includes('tarot consultation')) return t('categories.tarot.title');
    if (lowerName.includes('spiritual healing') || lowerName.includes('healing')) return t('categories.healing.title');
    if (lowerName.includes('murugar')) return t('categories.murugar.title');
    if (lowerName.includes('tarot card reading') || lowerName.includes('tarot reading') || lowerName.includes('tarot classes')) return t('categories.tarotClasses.title');
    if (lowerName.includes('spiritual counseling') || lowerName.includes('counseling')) return t('categories.counselingClasses.title');
    if (lowerName.includes('kali pooja')) return t('categories.pooja.title');
    
    if (locale === 'ta') {
      if (lowerName === 'bracelet') return 'பிரேஸ்லெட்';
      if (lowerName === 'rasi') return 'ராசி';
      if (lowerName === 'pyrite frames' || lowerName === 'pyrite frame') return 'பைரைட் பிரேம்கள்';
      if (lowerName === 'rings' || lowerName === 'ring') return 'மோதிரங்கள்';
      if (lowerName === 'pendants' || lowerName === 'pendant') return 'பதக்கங்கள்';
      if (lowerName === 'tumbles' || lowerName === 'tumble') return 'டம்பிள்ஸ்';
      if (lowerName === 'crystal prymid' || lowerName === 'crystal pyramid') return 'படிக பிரமிடு';
      if (lowerName === 'pyrite') return 'பைரைட்';
      if (lowerName === 'crystal balls' || lowerName === 'crystal ball') return 'படிக பந்துகள்';
      if (lowerName === 'crystal mala') return 'படிக மாலை';
      if (lowerName === 'crystal tower') return 'படிக கோபுரம்';
    }
  
    return name;
  };

  const serviceCategories = categories.filter(c => c.type === 'service');
  const dropdownItems = [];

  if (serviceCategories.length > 0) {
    serviceCategories.forEach((cat) => {
      dropdownItems.push({ label: getTranslatedLabel(cat.name), path: getCategoryPath(cat) });
    });
  } else {
    dropdownItems.push(
      { label: getTranslatedLabel('Tarot Private Consultation'), path: '/products/tarot-consultation' },
      { label: getTranslatedLabel('Spiritual Healing'), path: '/products/spiritual-healing' },
      { label: getTranslatedLabel('Murugar Cards'), path: '/products/murugar-cards' },
      { label: getTranslatedLabel('Tarot Reading Classes'), path: '/products/tarot-classes' },
      { label: getTranslatedLabel('Spiritual Counseling'), path: '/products/counseling-classes' },
      { label: getTranslatedLabel('Kali Pooja'), path: '/products/kali-pooja' }
    );
  }

  const crystalCategories = categories.filter(c => c.type === 'crystal');
  const crystalDropdownItems = crystalCategories.map(cat => ({
    label: getTranslatedLabel(cat.name),
    path: getCategoryPath(cat)
  }));

  return (
    <nav className="sticky top-0 z-[1000] w-full box-border bg-[#0B1225] border-b border-[rgba(223,186,107,0.15)]">
      <div className="max-w-[1360px] mx-auto px-6 py-2 flex justify-between items-center box-border flex-nowrap">
        {/* Brand Logo Identity */}
        <Link to="/" className="flex items-center cursor-pointer no-underline flex-shrink-0">
          <img
            src="/images/website-logo-main.webp"
            alt="Saraa Tarot Logo"
            className="h-[70px] w-auto block rounded"
          />
        </Link>

        {/* Desktop & Tablet Navigation Menu */}
        <div className="hidden lg:flex items-center gap-6 flex-nowrap">
          <ul className="list-none flex items-center gap-6 m-0 p-0 font-sans text-[13px] font-normal uppercase tracking-[1.5px] flex-nowrap whitespace-nowrap">
            <li>
              <Link
                to="/"
                className="text-white no-underline transition-colors duration-300 hover:text-sara-gold"
              >
                {t('nav.home')}
              </Link>
            </li>

            {/* Products Hover Dropdown */}
            <li
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
              className="relative py-6 cursor-pointer flex-shrink-0"
            >
              <span
                className={`flex items-center gap-1.5 whitespace-nowrap ${isDropdownOpen ? 'text-sara-gold' : 'text-white'} animate-[blinkHighlight_1.2s_ease-in-out_infinite]`}
              >
                {t('nav.services')}
                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#130f24] border border-[rgba(223,186,107,0.25)] rounded w-[280px] py-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)] z-[1100] flex flex-col box-border">
                  {dropdownItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className="px-6 py-3 text-white no-underline text-[11px] uppercase tracking-[1px] transition-colors duration-200 text-left hover:bg-[rgba(223,186,107,0.1)] hover:text-sara-gold"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>

            <li
              onMouseEnter={() => setIsCrystalsDropdownOpen(true)}
              onMouseLeave={() => setIsCrystalsDropdownOpen(false)}
              className="relative py-6 cursor-pointer flex-shrink-0"
            >
              <Link
                to="/products/crystals"
                className={`flex items-center gap-1.5 whitespace-nowrap no-underline transition-colors duration-300 hover:text-sara-gold ${isCrystalsDropdownOpen ? 'text-sara-gold' : 'text-white'}`}
              >
                {t('nav.crystals')}
                {crystalDropdownItems.length > 0 && (
                  <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Link>

              {/* Dropdown Options */}
              {isCrystalsDropdownOpen && crystalDropdownItems.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#130f24] border border-[rgba(223,186,107,0.25)] rounded w-[280px] py-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)] z-[1100] flex flex-col box-border">
                  {crystalDropdownItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className="px-6 py-3 text-white no-underline text-[11px] uppercase tracking-[1px] transition-colors duration-200 text-left hover:bg-[rgba(223,186,107,0.1)] hover:text-sara-gold"
                      onClick={() => setIsCrystalsDropdownOpen(false)}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>

            <li>
              <Link
                to="/about"
                className="text-white no-underline transition-colors duration-300 hover:text-sara-gold"
              >
                {t('nav.about')}
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                className="text-white no-underline transition-colors duration-300 hover:text-sara-gold"
              >
                {t('nav.contact')}
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-4 flex-nowrap whitespace-nowrap">
            {/* Login/Logout Action */}
            {user ? (
              <div className="flex items-center gap-4 flex-nowrap whitespace-nowrap">
                <span className="text-white font-sans text-xs font-medium uppercase tracking-[0.5px] whitespace-nowrap flex-shrink-0">
                  {t('nav.hi')}, {user.name.split(' ')[0]}
                </span>
                {user.role === 'ADMIN' ? (
                  <Link
                    to="/dashboard"
                    className="text-sara-gold no-underline font-sans text-xs font-semibold uppercase tracking-[1px] transition-colors duration-300 hover:text-white flex-shrink-0"
                  >
                    {t('nav.dashboard')}
                  </Link>
                ) : hasPurchasedClass ? (
                  <a
                    href="https://tarotclasses.saratarot.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sara-gold no-underline font-sans text-xs font-semibold uppercase tracking-[1px] transition-colors duration-300 hover:text-white flex-shrink-0 flex items-center gap-1.5"
                  >
                    <span>{t('nav.myClass') || 'MY CLASS'}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                ) : (
                  <Link
                    to="/"
                    className="text-sara-gold no-underline font-sans text-xs font-semibold uppercase tracking-[1px] transition-colors duration-300 hover:text-white flex-shrink-0"
                  >
                    {t('nav.myOrders') || 'My Orders'}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-transparent text-sara-gold border border-[rgba(223,186,107,0.4)] rounded-sm px-4 py-2 font-sans text-xs font-medium uppercase tracking-[1px] cursor-pointer transition-colors duration-300 hover:bg-[rgba(223,186,107,0.1)] whitespace-nowrap flex-shrink-0"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-sara-gold text-[#0B1225] border-0 rounded-sm px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[1px] cursor-pointer transition-colors duration-300 hover:bg-white whitespace-nowrap flex-shrink-0"
              >
                {t('nav.login')}
              </button>
            )}

            {/* Translation Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="bg-[rgba(223,186,107,0.1)] text-sara-gold border border-[rgba(223,186,107,0.3)] rounded-sm px-3.5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[1px] cursor-pointer flex items-center gap-1.5 transition-colors duration-300 hover:bg-[rgba(223,186,107,0.2)]"
              >
                <span className="text-[14px]">🌐</span>
                <span>{locale === 'en' ? 'EN' : 'TA'}</span>
                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 bg-[#130f24] border border-[rgba(223,186,107,0.25)] rounded shadow-[0_12px_30px_rgba(0,0,0,0.6)] z-[1100] flex flex-col w-[120px] py-1 box-border">
                  <button
                    onClick={() => {
                      setLocale('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 text-left bg-transparent border-none text-[11px] uppercase tracking-[1px] cursor-pointer transition-colors duration-200 ${locale === 'en' ? 'text-sara-gold font-bold' : 'text-white hover:text-sara-gold hover:bg-[rgba(223,186,107,0.1)]'}`}
                  >
                    {t('nav.english')}
                  </button>
                  <button
                    onClick={() => {
                      setLocale('ta');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 text-left bg-transparent border-none text-[11px] uppercase tracking-[1px] cursor-pointer transition-colors duration-200 ${locale === 'ta' ? 'text-sara-gold font-bold' : 'text-white hover:text-sara-gold hover:bg-[rgba(223,186,107,0.1)]'}`}
                  >
                    {t('nav.tamil')}
                  </button>
                </div>
              )}
            </div>

            {/* Updated Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-[rgba(223,186,107,0.1)] text-sara-gold border border-[rgba(223,186,107,0.3)] rounded-sm px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-[1px] cursor-pointer flex items-center gap-2 transition-colors duration-300 hover:bg-[rgba(223,186,107,0.2)]"
            >
              <CartIcon />
              <span>{t('nav.cart')}</span>
              <span className="bg-sara-gold text-[#0B1225] rounded-full w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
                {totalItems}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Action Corner */}
        <div className="flex lg:hidden items-center gap-4">
          {/* Mobile Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="bg-transparent text-sara-gold border-none cursor-pointer flex items-center gap-1 p-2 font-sans text-xs font-semibold uppercase tracking-[0.5px]"
            >
              <span className="text-[14px]">🌐</span>
              <span>{locale === 'en' ? 'EN' : 'TA'}</span>
            </button>
            {isLangDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-[#130f24] border border-[rgba(223,186,107,0.25)] rounded shadow-[0_12px_30px_rgba(0,0,0,0.6)] z-[1100] flex flex-col w-[120px] py-1 box-border">
                <button
                  onClick={() => {
                    setLocale('en');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 text-left bg-transparent border-none text-[11px] uppercase tracking-[1px] cursor-pointer transition-colors duration-200 ${locale === 'en' ? 'text-sara-gold font-bold' : 'text-white'}`}
                >
                  {t('nav.english')}
                </button>
                <button
                  onClick={() => {
                    setLocale('ta');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 text-left bg-transparent border-none text-[11px] uppercase tracking-[1px] cursor-pointer transition-colors duration-200 ${locale === 'ta' ? 'text-sara-gold font-bold' : 'text-white'}`}
                >
                  {t('nav.tamil')}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-transparent text-sara-gold border-none cursor-pointer flex items-center relative p-2"
          >
            <CartIcon />
            <span className="absolute -top-0.5 -right-0.5 bg-sara-gold text-[#0B1225] rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
              {totalItems}
            </span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-transparent border-none cursor-pointer text-sara-gold p-1"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-[#130f24] border-b border-[rgba(223,186,107,0.15)] px-8 py-6 absolute top-full left-0 w-full box-border z-[999]">
          <ul className="list-none m-0 p-0 flex flex-col gap-5">
            <li>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="text-white no-underline font-sans text-sm uppercase tracking-[1px] block"
              >
                {t('nav.home')}
              </Link>
            </li>

            {/* Mobile Products Accordion Trigger */}
            <li>
              <button
                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                className="w-full bg-none border-none p-0 text-white font-sans text-sm uppercase tracking-[1px] flex justify-between items-center cursor-pointer text-left animate-[blinkHighlight_1.2s_ease-in-out_infinite]"
              >
                <span>{t('nav.services')}</span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform duration-200 ${isMobileProductsOpen ? 'rotate-180' : 'rotate-0'}`}
                >
                  <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Mobile Products Sub-menu Links */}
              {isMobileProductsOpen && (
                <div className="flex flex-col gap-3.5 py-2 pl-4 border-l border-[rgba(223,186,107,0.2)] mt-2 box-border">
                  {dropdownItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => {
                        setIsOpen(false);
                        setIsMobileProductsOpen(false);
                      }}
                      className="text-[rgba(243,240,234,0.85)] no-underline font-sans text-xs uppercase tracking-[1px] block"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>

            <li>
              <div className="flex justify-between items-center w-full">
                <Link
                  to="/products/crystals"
                  onClick={() => setIsOpen(false)}
                  className="text-white no-underline font-sans text-sm uppercase tracking-[1px] block flex-grow"
                >
                  {t('nav.crystals')}
                </Link>
                {crystalDropdownItems.length > 0 && (
                  <button
                    onClick={() => setIsMobileCrystalsOpen(!isMobileCrystalsOpen)}
                    className="bg-transparent border-none p-2 text-white cursor-pointer"
                  >
                    <svg
                      width="10"
                      height="6"
                      viewBox="0 0 10 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform duration-200 ${isMobileCrystalsOpen ? 'rotate-180' : 'rotate-0'}`}
                    >
                      <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Mobile Crystals Sub-menu Links */}
              {isMobileCrystalsOpen && crystalDropdownItems.length > 0 && (
                <div className="flex flex-col gap-3.5 py-2 pl-4 border-l border-[rgba(223,186,107,0.2)] mt-2 box-border">
                  {crystalDropdownItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => {
                        setIsOpen(false);
                        setIsMobileCrystalsOpen(false);
                      }}
                      className="text-[rgba(243,240,234,0.85)] no-underline font-sans text-xs uppercase tracking-[1px] block"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>

            <li>
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className="text-white no-underline font-sans text-sm uppercase tracking-[1px] block"
              >
                {t('nav.about')}
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                onClick={() => setIsOpen(false)}
                className="text-white no-underline font-sans text-sm uppercase tracking-[1px] block"
              >
                {t('nav.contact')}
              </Link>
            </li>

            {user ? (
              <>
                <li className="mt-2 text-center">
                  <span className="text-white font-sans text-[13px] font-medium uppercase tracking-[0.5px]">
                    {t('nav.hi')}, {user.name}
                  </span>
                </li>
                <li>
                  {user.role === 'ADMIN' ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="block text-center text-sara-gold no-underline py-3 font-sans text-[13px] font-semibold uppercase tracking-[1px]"
                    >
                      {t('nav.dashboard')}
                    </Link>
                  ) : hasPurchasedClass ? (
                    <a
                      href="https://tarotclasses.saratarot.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="block text-center text-sara-gold no-underline py-3 font-sans text-[13px] font-semibold uppercase tracking-[1px] flex items-center justify-center gap-1.5"
                    >
                      <span>{t('nav.myClass') || 'MY CLASS'}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  ) : (
                    <Link
                      to="/"
                      onClick={() => setIsOpen(false)}
                      className="block text-center text-sara-gold no-underline py-3 font-sans text-[13px] font-semibold uppercase tracking-[1px]"
                    >
                      {t('nav.myOrders') || 'My Orders'}
                    </Link>
                  )}
                </li>
                <li>
                  <button
                    onClick={() => { setIsOpen(false); handleLogout(); }}
                    className="w-full bg-transparent text-sara-gold border border-[rgba(223,186,107,0.4)] py-3 font-sans text-[13px] font-semibold uppercase tracking-[1px] cursor-pointer flex items-center justify-center"
                  >
                    {t('nav.logout')}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  onClick={() => { setIsOpen(false); navigate('/login'); }}
                  className="w-full bg-sara-gold text-[#0B1225] border-0 py-3 font-sans text-[13px] font-semibold uppercase tracking-[1px] cursor-pointer flex items-center justify-center"
                >
                  {t('nav.login')}
                </button>
              </li>
            )}

            <li className="mt-3">
              <button
                onClick={() => { setIsOpen(false); setIsCartOpen(true); }}
                className="w-full bg-[rgba(223,186,107,0.1)] text-sara-gold border border-[rgba(223,186,107,0.3)] py-3 font-sans text-[13px] font-semibold uppercase tracking-[1px] cursor-pointer flex items-center justify-center gap-2"
              >
                <CartIcon />
                <span>{t('nav.cart')}</span>
                <span className="bg-sara-gold text-[#0B1225] rounded-full w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
                  {totalItems}
                </span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* ==================== RIGHT SIDE CART SLIDE-OUT DRAWER ==================== */}
      {isCartOpen && (
        <>
          {/* Dark Blurred Backdrop Overlay */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[2000]"
          />

          {/* Drawer Panel Container */}
          <div className="fixed top-0 right-0 w-full max-w-[420px] h-screen bg-[#130f24] border-l border-[rgba(223,186,107,0.2)] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-[2001] flex flex-col font-sans text-white box-border">
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-6 border-b border-[rgba(223,186,107,0.15)]">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-[0.5px]">{t('nav.myCart')}</span>
                <span className="bg-[rgba(223,186,107,0.15)] text-sara-gold px-2 py-0.5 rounded-xl text-xs font-medium">
                  {totalItems} {totalItems === 1 ? t('nav.item') : t('nav.items')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {cartItems.length > 0 && (
                  <button onClick={clearCart} className="bg-none border-none text-[#a09ba2] text-xs cursor-pointer underline">
                    {t('nav.clearAll')}
                  </button>
                )}
                <button onClick={() => setIsCartOpen(false)} className="bg-none border-none text-sara-gold cursor-pointer text-xl">
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Dynamic Body Scroll List */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60%] text-[#a09ba2]">
                  <CartIcon />
                  <p className="mt-4 text-sm">{t('nav.yourCartIsEmpty')}</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 mb-5 pb-5 border-b border-[rgba(255,255,255,0.05)] items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <img
                        src={item.image || "/placeholder-item.jpg"}
                        alt={item.name}
                        className="w-[60px] h-[60px] object-cover rounded border border-[rgba(223,186,107,0.1)]"
                      />
                      <div>
                        <h4 className="m-0 mb-1 text-sm font-medium text-white">{item.name}</h4>
                        <p className="m-0 text-[13px] text-sara-gold font-semibold">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="bg-none border-none text-[#ef5353] cursor-pointer text-base p-1 flex items-center"
                      title={t('nav.removeItem')}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer Bill Structure */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-[#0c0917] border-t border-[rgba(223,186,107,0.15)]">
                <h5 className="m-0 mb-4 text-[13px] uppercase tracking-[0.5px] text-[#a09ba2]">{t('nav.billDetails')}</h5>

                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-[#a09ba2]">{t('nav.itemsTotal')}</span>
                  <span>₹{itemsTotalAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-[13px] mb-4">
                  <span className="text-[#a09ba2]">{locale === 'ta' ? 'ஜிஎஸ்டி (18%)' : '18% GST'}</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-[15px] font-semibold border-t border-dashed border-[rgba(223,186,107,0.2)] pt-4 mb-6">
                  <span className="text-sara-gold">{t('nav.toPay')}</span>
                  <span className="text-sara-gold">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Primary Proceed Action button */}
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full bg-sara-gold text-[#0B1225] border-0 rounded p-4 text-sm font-bold uppercase tracking-[1px] cursor-pointer flex justify-between items-center box-border transition-opacity duration-200 hover:opacity-90"
                >
                  <span>{t('nav.proceedToCheckout')}</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')} ➔</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
