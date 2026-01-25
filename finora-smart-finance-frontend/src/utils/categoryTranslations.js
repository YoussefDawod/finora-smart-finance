const CATEGORY_KEY_MAP = {
  Gehalt: 'salary',
  Freelance: 'freelance',
  Investitionen: 'investments',
  Geschenk: 'gift',
  Bonus: 'bonus',
  Nebenjob: 'sideJob',
  Cashback: 'cashback',
  Vermietung: 'rental',
  Lebensmittel: 'groceries',
  Transport: 'transport',
  Unterhaltung: 'entertainment',
  Miete: 'rent',
  Versicherung: 'insurance',
  Gesundheit: 'health',
  Bildung: 'education',
  Kleidung: 'clothing',
  Reisen: 'travel',
  Elektronik: 'electronics',
  Restaurant: 'restaurant',
  Sport: 'sports',
  Haushalt: 'household',
  Sonstiges: 'other',
};

export const translateCategory = (category, t) => {
  const key = CATEGORY_KEY_MAP[category];
  if (!key) return category;
  return t(`categories.${key}`, { defaultValue: category });
};

export default translateCategory;
