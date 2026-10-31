export const MCC_DESCRIPTIONS: Record<number, string> = {
  // Groceries & Food Markets
  5411: 'Groceries / Supermarket',
  5412: 'Bakeries',
  5300: 'Wholesale Clubs',
  5310: 'Discount Stores',
  5311: 'Department Stores',
  5331: 'Variety Stores',
  5422: 'Meat Provisions',
  5441: 'Candy & Confectionery',
  5462: 'Bakeries',
  5499: 'Specialty Food Stores',

  // Eating Out & Restaurants
  5811: 'Catering',
  5812: 'Restaurants',
  5813: 'Bars & Pubs',
  5814: 'Fast Food',

  // Transportation & Fuel
  4111: 'Commuter Transport & Rail',
  4121: 'Taxi & Ride Sharing',
  4131: 'Bus Lines',
  4511: 'Airlines',
  4789: 'Transportation Services',
  5541: 'Gas & Fuel Stations',
  5542: 'Automated Fuel Dispensers',
  7512: 'Car Rental',
  7523: 'Parking Lots & Garages',

  // Utilities, Telecom & Services
  4812: 'Telecom Equipment',
  4814: 'Telecommunication Services',
  4816: 'Computer Network & Internet',
  4899: 'Cable & Pay TV',
  4900: 'Utilities (Electric / Gas / Water)',

  // Health, Medical & Personal Care
  5912: 'Pharmacies',
  7230: 'Barber & Beauty Shops',
  7297: 'Massage Parlors',
  7298: 'Health & Beauty Spas',
  8011: 'Doctors',
  8021: 'Dentists',
  8041: 'Chiropractors',
  8042: 'Optometrists & Eyeglasses',
  8099: 'Medical Services',

  // Entertainment & Leisure
  7832: 'Movie Theaters',
  7922: 'Theatrical Producers & Tickets',
  7941: 'Athletic Fields & Sports Clubs',
  7991: 'Tourist Attractions & Exhibits',
  7996: 'Amusement Parks & Circuses',
  7997: 'Gyms & Membership Clubs',
  7999: 'Recreation Services',

  // Shopping & Retail
  5611: "Men's Clothing",
  5621: "Women's Clothing",
  5651: 'Family Clothing',
  5661: 'Shoe Stores',
  5691: "Apparel & Accessories",
  5712: 'Furniture Stores',
  5722: 'Household Appliances',
  5732: 'Electronic Sales',
  5942: 'Book Stores',
  5943: 'Stationery Stores',
  5944: 'Jewelry Stores',
  5945: 'Hobby & Toy Shops',
  5946: 'Camera & Photo Shops',
  5947: 'Gift & Novelty Shops',
  5948: 'Luggage & Leather Goods',
  5977: 'Cosmetics',
  5992: 'Florists',
  5999: 'Miscellaneous Retail',

  // Lodging & Travel
  7011: 'Hotels & Motels',
};

export function getMccDescription(mcc: number | null | undefined): string | null {
  if (!mcc || typeof mcc !== 'number') return null;

  if (MCC_DESCRIPTIONS[mcc]) {
    return MCC_DESCRIPTIONS[mcc];
  }

  if (mcc >= 3000 && mcc <= 3350) {
    return 'Airlines';
  }
  if (mcc >= 3501 && mcc <= 3999) {
    return 'Hotels & Lodging';
  }
  if (mcc >= 5600 && mcc <= 5699) {
    return 'Clothing & Apparel';
  }

  return null;
}
