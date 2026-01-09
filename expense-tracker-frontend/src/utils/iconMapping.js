// src/utils/iconMapping.js
// Maps business categories to Heroicons names

const normalize = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');

const incomeIconMap = {
  gehalt: 'briefcase',
  freiberuflich: 'code-bracket',
  freelance: 'code-bracket',
  investitionen: 'chart-bar',
  investment: 'chart-bar',
  geschenk: 'gift',
  bonus: 'banknotes',
  sonstiges: 'banknotes',
  other: 'banknotes',
};

const expenseIconMap = {
  'essenundtrinken': 'shopping-cart',
  lebensmittel: 'shopping-cart',
  dining: 'shopping-cart',
  transport: 'truck',
  pendeln: 'truck',
  unterhaltung: 'film',
  einkaufen: 'shopping-bag',
  shopping: 'shopping-bag',
  nebenkosten: 'bolt',
  utilities: 'bolt',
  gesundheit: 'heart',
  bildung: 'book-open',
  reisen: 'paper-airplane',
  travel: 'paper-airplane',
  miete: 'home',
  wohnung: 'home',
  versicherung: 'shield',
  gift: 'gift',
  sonstiges: 'ellipsis-horizontal',
  other: 'ellipsis-horizontal',
};

const fallbackByType = {
  income: 'banknotes',
  expense: 'sparkles',
};

export const getCategoryIconName = (category, type = 'expense') => {
  const key = normalize(category);
  const lookup = type === 'income' ? incomeIconMap : expenseIconMap;
  return lookup[key] || fallbackByType[type] || 'sparkles';
};

export const CATEGORY_ICON_MAP = {
  income: incomeIconMap,
  expense: expenseIconMap,
};
