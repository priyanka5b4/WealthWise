module.exports.getCategoryColorClasses = (category) => {
  const categoryColors = {
    INCOME: {
      base: 'bg-emerald-100',
      text: 'text-emerald-700',
      hover: 'hover:bg-emerald-200',
    },
    INCOME: {
      base: 'bg-emerald-100',
      text: 'text-emerald-700',
      hover: 'hover:bg-emerald-200',
    },
    TRANSFER_IN: {
      base: 'bg-green-100',
      text: 'text-green-700',
      hover: 'hover:bg-green-200',
    },
    TRANSFER_OUT: {
      base: 'bg-lime-100',
      text: 'text-lime-700',
      hover: 'hover:bg-lime-200',
    },

    // Financial Services (Blue spectrum)
    LOAN_PAYMENTS: {
      base: 'bg-blue-100',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-200',
    },
    BANK_FEES: {
      base: 'bg-sky-100',
      text: 'text-sky-700',
      hover: 'hover:bg-sky-200',
    },

    // Lifestyle and Entertainment (Purple spectrum)
    ENTERTAINMENT: {
      base: 'bg-purple-100',
      text: 'text-purple-700',
      hover: 'hover:bg-purple-200',
    },
    FOOD_AND_DRINK: {
      base: 'bg-fuchsia-100',
      text: 'text-fuchsia-700',
      hover: 'hover:bg-fuchsia-200',
    },

    // Shopping and Home (Pink/Red spectrum)
    GENERAL_MERCHANDISE: {
      base: 'bg-rose-100',
      text: 'text-rose-700',
      hover: 'hover:bg-rose-200',
    },
    HOME_IMPROVEMENT: {
      base: 'bg-pink-100',
      text: 'text-pink-700',
      hover: 'hover:bg-pink-200',
    },

    // Health and Personal (Indigo spectrum)
    MEDICAL: {
      base: 'bg-indigo-100',
      text: 'text-indigo-700',
      hover: 'hover:bg-indigo-200',
    },
    PERSONAL_CARE: {
      base: 'bg-violet-100',
      text: 'text-violet-700',
      hover: 'hover:bg-violet-200',
    },

    // Services (Orange spectrum)
    GENERAL_SERVICES: {
      base: 'bg-orange-100',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-200',
    },
    GOVERNMENT_AND_NON_PROFIT: {
      base: 'bg-amber-100',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-200',
    },

    // Transportation and Travel (Teal spectrum)
    TRANSPORTATION: {
      base: 'bg-teal-100',
      text: 'text-teal-700',
      hover: 'hover:bg-teal-200',
    },
    TRAVEL: {
      base: 'bg-cyan-100',
      text: 'text-cyan-700',
      hover: 'hover:bg-cyan-200',
    },

    // Utilities (Slate spectrum)
    RENT_AND_UTILITIES: {
      base: 'bg-slate-100',
      text: 'text-slate-700',
      hover: 'hover:bg-slate-200',
    },
    // ... (rest of the color mappings from previous response)
  };

  const colors =
    categoryColors[category] || categoryColors['GENERAL_MERCHANDISE'];
  return `${colors.base}`;
};
