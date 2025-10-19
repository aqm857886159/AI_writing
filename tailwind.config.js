export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#2563EB',
        paper: '#FFFEF9',
        panel: '#F9FAFB',
        textMain: '#1F2937',
        textSecondary: '#6B7280',
        textPlaceholder: '#9CA3AF',
        borderLight: '#E5E7EB',
        divider: '#D1D5DB',
        select: '#FEF3C7'
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'Times New Roman', 'serif']
      },
      boxShadow: {
        editor: '0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'
      }
    }
  },
  plugins: []
};


