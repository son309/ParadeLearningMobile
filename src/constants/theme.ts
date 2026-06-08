export const theme = {
  colors: {
    // Modern Facebook blue palette
    primary: '#0866FF',
    primaryDark: '#0054E3',
    primaryLight: '#E7F3FF',
    // Backgrounds
    background: '#CCCDD2', // Authentic FB feed gap color
    surface: '#FFFFFF',
    surface2: '#F0F2F5', // Grey pills / buttons
    surfaceHover: '#E4E6EB',
    surface3: '#E4E6EB',
    // Text
    text: '#050505',
    textSecondary: '#65676B',
    textTertiary: '#8A8D91',
    muted: '#65676B',
    // Borders
    border: '#CED0D4',
    divider: '#E4E6EB',
    inputBg: '#F0F2F5',
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.4)',
    // Indicators / Semantic
    online: '#31A24C',
    danger: '#FA3E3E',
    success: '#42B72A',
    warning: '#F5C33B',
    like: '#0866FF',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  font: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  } as const,
  shadow: {
    // Luxury FB mobile uses less drop shadow, relying on background contrast
    card: {
      elevation: 0,
      shadowOpacity: 0,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    primaryGlow: {
      shadowColor: '#0866FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

