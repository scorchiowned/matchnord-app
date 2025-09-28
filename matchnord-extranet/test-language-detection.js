// Quick test for language detection
const {
  detectBrowserLanguageEnhanced,
} = require('./src/i18n/language-detection.ts');

console.log('Testing browser language detection:');

// Test cases
const testCases = [
  { header: 'fi-FI,fi;q=0.9,en;q=0.8', expected: 'fi' },
  { header: 'sv-SE,sv;q=0.9,en;q=0.8', expected: 'sv' },
  { header: 'no-NO,nb;q=0.9,en;q=0.8', expected: 'no' },
  { header: 'da-DK,da;q=0.9,en;q=0.8', expected: 'da' },
  { header: 'en-US,en;q=0.9', expected: 'en' },
  { header: 'de-DE,de;q=0.9,en;q=0.8', expected: 'fi' }, // Fallback to default
  { header: null, expected: 'fi' }, // No header
];

testCases.forEach(({ header, expected }) => {
  const result = detectBrowserLanguageEnhanced(header);
  const status = result === expected ? '✅' : '❌';
  console.log(
    `${status} ${header || 'null'} → ${result} (expected: ${expected})`
  );
});
