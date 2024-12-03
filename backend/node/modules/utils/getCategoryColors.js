module.exports.getCategoryColorClasses = (category) => {
  // Default color scheme for unknown categories
  const defaultColors = {
    base: 'bg-gray-100',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-200',
  };

  const categoryColors = {
    // Income and Transfers (Green spectrum)
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

    // Bills and Utilities (Orange spectrum)
    RENT_AND_UTILITIES: {
      base: 'bg-orange-100',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-200',
    },
    BILLS: {
      base: 'bg-amber-100',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-200',
    },

    // Transportation (Yellow spectrum)
    TRANSPORTATION: {
      base: 'bg-yellow-100',
      text: 'text-yellow-700',
      hover: 'hover:bg-yellow-200',
    },
    AUTO_AND_TRANSPORT: {
      base: 'bg-yellow-100',
      text: 'text-yellow-700',
      hover: 'hover:bg-yellow-200',
    },

    // Health and Education (Teal spectrum)
    HEALTHCARE: {
      base: 'bg-teal-100',
      text: 'text-teal-700',
      hover: 'hover:bg-teal-200',
    },
    EDUCATION: {
      base: 'bg-cyan-100',
      text: 'text-cyan-700',
      hover: 'hover:bg-cyan-200',
    },

    // Manual transaction categories
    groceries: {
      base: 'bg-fuchsia-100',
      text: 'text-fuchsia-700',
      hover: 'hover:bg-fuchsia-200',
    },
    utilities: {
      base: 'bg-orange-100',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-200',
    },
    transportation: {
      base: 'bg-yellow-100',
      text: 'text-yellow-700',
      hover: 'hover:bg-yellow-200',
    },
    shopping: {
      base: 'bg-rose-100',
      text: 'text-rose-700',
      hover: 'hover:bg-rose-200',
    },
    entertainment: {
      base: 'bg-purple-100',
      text: 'text-purple-700',
      hover: 'hover:bg-purple-200',
    },
    healthcare: {
      base: 'bg-teal-100',
      text: 'text-teal-700',
      hover: 'hover:bg-teal-200',
    },
    education: {
      base: 'bg-cyan-100',
      text: 'text-cyan-700',
      hover: 'hover:bg-cyan-200',
    },
  };

  // Convert category to uppercase for Plaid categories and try to match
  const upperCategory = category?.toUpperCase();
  if (categoryColors[upperCategory]) {
    return categoryColors[upperCategory];
  }

  // Try to match lowercase manual categories
  if (categoryColors[category?.toLowerCase()]) {
    return categoryColors[category.toLowerCase()];
  }

  // Return default colors if no match found
  return defaultColors;
};
