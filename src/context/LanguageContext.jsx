// ─── Language Context ───
// Provides i18n (internationalization) support.
// Usage: const { t, language, setLanguage } = useLanguage();

import React, { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  en: {
    // Navigation
    home: 'Home',
    myIssues: 'My Issues',
    insights: 'Insights',
    profile: 'Profile',

    // Home
    nearbyIssues: 'Nearby Issues',
    noIssuesFound: 'No issues found in this area',
    reportIssue: 'Report Issue',
    upvotes: 'upvotes',
    km: 'km away',

    // Scope tabs
    local: 'Local',
    city: 'City',
    state: 'State',
    country: 'Country',

    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    loginTitle: 'Welcome Back',
    signupTitle: 'Create Account',
    loginSubtitle: 'Sign in to report and track civic issues',
    signupSubtitle: 'Join the community to make a difference',

    // Report Issue
    reportNewIssue: 'Report a New Issue',
    uploadPhoto: 'Upload Photo',
    takePhoto: 'Tap to select or take a photo',
    generateAI: '✨ Analyze with AI',
    title: 'Title',
    description: 'Description',
    location: 'Location',
    submit: 'Submit Issue',
    cancel: 'Cancel',
    aiSuggestion: 'AI Suggestion',
    department: 'Department',
    criticality: 'Criticality',

    // Profile
    yourImpact: 'Your Impact',
    reports: 'Reports',
    upvotesReceived: 'Upvotes',
    resolved: 'Resolved',
    settings: 'Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    clearCache: 'Clear Cache',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    privacyPolicy: 'Privacy Policy',
    logOut: 'Log Out',
    account: 'Account',

    // Insights
    departments: 'Departments',
    municipalities: 'Municipalities',
    topNGOs: 'Top NGOs',
    mostAffected: 'Most Affected Cities',

    // Status
    pending: 'Pending',
    inProgress: 'In Progress',
    active: 'Active',

    // Misc
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Retry',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
  },

  hi: {
    home: 'होम',
    myIssues: 'मेरी शिकायतें',
    insights: 'जानकारी',
    profile: 'प्रोफ़ाइल',
    nearbyIssues: 'आस-पास की समस्याएं',
    noIssuesFound: 'इस क्षेत्र में कोई समस्या नहीं मिली',
    reportIssue: 'शिकायत दर्ज करें',
    upvotes: 'वोट',
    km: 'किमी दूर',
    local: 'स्थानीय',
    city: 'शहर',
    state: 'राज्य',
    country: 'देश',
    signIn: 'साइन इन',
    signUp: 'साइन अप',
    email: 'ईमेल',
    password: 'पासवर्ड',
    name: 'पूरा नाम',
    loginTitle: 'वापसी पर स्वागत',
    signupTitle: 'खाता बनाएं',
    loginSubtitle: 'नागरिक समस्याओं की रिपोर्ट और ट्रैक करने के लिए साइन इन करें',
    signupSubtitle: 'बदलाव लाने के लिए समुदाय से जुड़ें',
    reportNewIssue: 'नई शिकायत दर्ज करें',
    uploadPhoto: 'फोटो अपलोड करें',
    takePhoto: 'फोटो चुनने या लेने के लिए टैप करें',
    generateAI: '✨ AI से विश्लेषण करें',
    title: 'शीर्षक',
    description: 'विवरण',
    location: 'स्थान',
    submit: 'सबमिट करें',
    cancel: 'रद्द करें',
    aiSuggestion: 'AI सुझाव',
    department: 'विभाग',
    criticality: 'गंभीरता',
    yourImpact: 'आपका प्रभाव',
    reports: 'रिपोर्ट्स',
    upvotesReceived: 'वोट',
    resolved: 'हल किया',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    darkMode: 'डार्क मोड',
    notifications: 'सूचनाएं',
    clearCache: 'कैश साफ करें',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    changePassword: 'पासवर्ड बदलें',
    privacyPolicy: 'गोपनीयता नीति',
    logOut: 'लॉग आउट',
    account: 'खाता',
    departments: 'विभाग',
    municipalities: 'नगर निगम',
    topNGOs: 'शीर्ष NGO',
    mostAffected: 'सबसे प्रभावित शहर',
    pending: 'लंबित',
    inProgress: 'प्रगति में',
    active: 'सक्रिय',
    loading: 'लोड हो रहा है...',
    error: 'कुछ गलत हो गया',
    retry: 'पुनः प्रयास करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    all: 'सभी',
  },

  gu: {
    home: 'હોમ',
    myIssues: 'મારી સમસ્યાઓ',
    insights: 'માહિતી',
    profile: 'પ્રોફાઇલ',
    nearbyIssues: 'નજીકની સમસ્યાઓ',
    noIssuesFound: 'આ વિસ્તારમાં કોઈ સમસ્યા મળી નથી',
    reportIssue: 'સમસ્યા નોંધાવો',
    upvotes: 'વોટ',
    km: 'કિમી દૂર',
    local: 'સ્થાનિક',
    city: 'શહેર',
    state: 'રાજ્ય',
    country: 'દેશ',
    signIn: 'સાઇન ઇન',
    signUp: 'સાઇન અપ',
    email: 'ઈમેલ',
    password: 'પાસવર્ડ',
    name: 'પૂરું નામ',
    loginTitle: 'પાછા આવ્યા',
    signupTitle: 'ખાતું બનાવો',
    loginSubtitle: 'નાગરિક સમસ્યાઓ રિપોર્ટ અને ટ્રેક કરવા સાઇન ઇન કરો',
    signupSubtitle: 'ફેરફાર લાવવા સમુદાયમાં જોડાઓ',
    reportNewIssue: 'નવી સમસ્યા નોંધાવો',
    uploadPhoto: 'ફોટો અપલોડ કરો',
    takePhoto: 'ફોટો પસંદ કરવા અથવા લેવા ટેપ કરો',
    generateAI: '✨ AI સાથે વિશ્લેષણ',
    title: 'શીર્ષક',
    description: 'વર્ણન',
    location: 'સ્થાન',
    submit: 'સબમિટ કરો',
    cancel: 'રદ કરો',
    aiSuggestion: 'AI સૂચન',
    department: 'વિભાગ',
    criticality: 'ગંભીરતા',
    yourImpact: 'તમારી અસર',
    reports: 'રિપોર્ટ્સ',
    upvotesReceived: 'વોટ',
    resolved: 'ઉકેલાયું',
    settings: 'સેટિંગ્સ',
    language: 'ભાષા',
    darkMode: 'ડાર્ક મોડ',
    notifications: 'સૂચનાઓ',
    clearCache: 'કેશ સાફ કરો',
    editProfile: 'પ્રોફાઇલ સંપાદિત કરો',
    changePassword: 'પાસવર્ડ બદલો',
    privacyPolicy: 'ગોપનીયતા નીતિ',
    logOut: 'લોગ આઉટ',
    account: 'ખાતું',
    departments: 'વિભાગો',
    municipalities: 'નગરપાલિકા',
    topNGOs: 'ટોચના NGO',
    mostAffected: 'સૌથી પ્રભાવિત શહેરો',
    pending: 'બાકી',
    inProgress: 'પ્રગતિમાં',
    active: 'સક્રિય',
    loading: 'લોડ થઈ રહ્યું છે...',
    error: 'કંઈક ખોટું થયું',
    retry: 'ફરી પ્રયાસ કરો',
    search: 'શોધો',
    filter: 'ફિલ્ટર',
    all: 'બધા',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('cc_language') || 'en';
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem('cc_language', lang);
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: ['en', 'hi', 'gu'] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
