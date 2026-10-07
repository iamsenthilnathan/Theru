import { FoodSpot } from '../types/foodSpot';
import { worldToLatLng } from '../services/geoService';

const makeSvgImage = (emoji: string, bgGradientStart: string, bgGradientEnd: string, title: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}" />
        <stop offset="100%" stop-color="${bgGradientEnd}" />
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" rx="16" />
    <rect width="100%" height="100%" fill="url(#grid)" rx="16" />
    <circle cx="160" cy="78" r="46" fill="rgba(255,255,255,0.15)" />
    <text x="160" y="93" font-size="52" text-anchor="middle" dominant-baseline="central">${emoji}</text>
    <text x="160" y="145" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">${title.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Initial POIs mapped to real geographic coordinates (Mylapore, Chennai)
const kumarGeo = worldToLatLng(-10, -4);
const selviGeo = worldToLatLng(6, -5);
const maniGeo = worldToLatLng(-6, 10);
const rahmanGeo = worldToLatLng(11, 7);
const muruganGeo = worldToLatLng(-3.3, 6.8);
const amudhaGeo = worldToLatLng(-4.8, -4.8);

/**
 * Directory storefront photo registry for existing food spots.
 * Photos must be real photos of the physical place (max 3 per spot).
 * If no appropriate photo asset exists for a spot, leave its array empty.
 */
export const EXISTING_SPOT_PHOTOS: Record<string, string[]> = {
  'kumar-kadai': [],
  'selvi-tea-stall': [],
  'mani-bajji-kadai': [],
  'rahman-shawarma': [],
  'murugan-juice-corner': [],
  'amudha-mess': []
};

export const MOCK_FOOD_SPOTS: FoodSpot[] = [
  {
    id: 'kumar-kadai',
    name: 'Kumar Kadai',
    tamilName: 'குமார் கடை',
    latitude: kumarGeo.latitude,
    longitude: kumarGeo.longitude,
    category: 'Tiffin & Dinner',
    description: 'The rhythmic clatter of metal blades chopping fresh parotta on the hot cast-iron tawa brings the entire corner to life every evening.',
    image: makeSvgImage('🍳', '#d9480f', '#b02a37', 'Kothu Parotta'),
    photos: EXISTING_SPOT_PHOTOS['kumar-kadai'] || [],
    createdBy: 'Theru Community',
    createdAt: '2026-01-10T12:30:00Z',
    streetName: 'West Bazaar Lane',
    specialties: ['Kothu Parotta', 'Egg Salna', 'Kal Dosa'],
    priceMin: 50,
    priceMax: 150,
    openingHours: '6 PM – 11 PM',
    communityRecommended: true,
    recommendedItem: 'Special Egg Kothu Parotta with piping hot Salna',
    stallColor: '#e03131',
    stallType: 'tawa',
    setupType: 'stall',
    recommendations: [
      {
        id: 'rec-k1',
        foodSpotId: 'kumar-kadai',
        dishName: 'Egg Kothu Parotta',
        description: 'Shredded parotta roasted on tawa with whisked eggs, onions, curry leaves, and rich chicken salna.',
        recommendCount: 38
      },
      {
        id: 'rec-k2',
        foodSpotId: 'kumar-kadai',
        dishName: 'Kal Dosa with Salna',
        description: 'Thick, spongy country dosa served piping hot with bowl of aromatic salna.',
        recommendCount: 22
      },
      {
        id: 'rec-k3',
        foodSpotId: 'kumar-kadai',
        dishName: 'Pepper Chicken Fry',
        description: 'Tender chicken tossed with freshly cracked black pepper and roasted garlic cloves.',
        recommendCount: 15
      }
    ],
    communityComments: [
      {
        id: 'c-k1',
        foodSpotId: 'kumar-kadai',
        authorName: 'Arun',
        avatarColor: '#e03131',
        timeAgo: '2h ago',
        text: "Don't go before 7 PM.",
        likes: 31,
        replies: [
          {
            id: 'rep-k1',
            foodSpotId: 'kumar-kadai',
            authorName: 'Manoj',
            avatarColor: '#fab005',
            timeAgo: '1h ago',
            text: 'Totally agree, the tawa gets properly hot only after 7:15 PM.',
            likes: 6
          }
        ]
      },
      {
        id: 'c-k2',
        foodSpotId: 'kumar-kadai',
        authorName: 'Priya',
        avatarColor: '#2b8a3e',
        timeAgo: 'Yesterday',
        text: 'The egg kothu is better than the chicken.',
        likes: 18
      },
      {
        id: 'c-k3',
        foodSpotId: 'kumar-kadai',
        authorName: 'Karthik',
        avatarColor: '#1971c2',
        timeAgo: '3d ago',
        text: 'Ask for extra salna.',
        likes: 12
      },
      {
        id: 'c-k4',
        foodSpotId: 'kumar-kadai',
        authorName: 'Vignesh',
        avatarColor: '#862e9c',
        timeAgo: '5d ago',
        text: 'Been eating here since school days.',
        likes: 9
      }
    ]
  },
  {
    id: 'selvi-tea-stall',
    name: 'Selvi Tea Stall',
    tamilName: 'செல்வி டீ ஸ்டால்',
    latitude: selviGeo.latitude,
    longitude: selviGeo.longitude,
    category: 'Tea & Snacks',
    description: 'Fresh tea brewed every 15 minutes in a brass samovar, served with crisp vadas and sweet bun butter jam.',
    image: makeSvgImage('☕', '#f59f00', '#d9480f', 'Ginger Tea & Snacks'),
    photos: EXISTING_SPOT_PHOTOS['selvi-tea-stall'] || [],
    createdBy: 'Theru Community',
    createdAt: '2026-01-11T08:00:00Z',
    streetName: 'East Commercial Junction',
    specialties: ['Cardamom Tea', 'Ginger Tea', 'Bun Butter Jam', 'Medhu Vada'],
    priceMin: 15,
    priceMax: 40,
    openingHours: '6 AM – 9 PM',
    communityRecommended: true,
    recommendedItem: 'Strong Ginger Tea with toasted Bun Butter Jam',
    stallColor: '#fab005',
    stallType: 'tea-stall',
    setupType: 'shop',
    recommendations: [
      {
        id: 'rec-s1',
        foodSpotId: 'selvi-tea-stall',
        dishName: 'Strong Ginger Cardamom Tea',
        description: 'Brewed with fresh hand-crushed ginger and green cardamom, poured high from meter glass.',
        recommendCount: 45
      },
      {
        id: 'rec-s2',
        foodSpotId: 'selvi-tea-stall',
        dishName: 'Toasted Bun Butter Jam',
        description: 'Soft bakery bun sliced, slathered with Amul salted butter and mixed fruit jam.',
        recommendCount: 33
      },
      {
        id: 'rec-s3',
        foodSpotId: 'selvi-tea-stall',
        dishName: 'Hot Medhu Vada (Morning batch)',
        description: 'Crisp golden exterior, fluffy airy interior with whole peppercorns.',
        recommendCount: 20
      }
    ],
    communityComments: [
      {
        id: 'c-s1',
        foodSpotId: 'selvi-tea-stall',
        authorName: 'Suresh',
        avatarColor: '#fab005',
        timeAgo: '3h ago',
        text: 'Morning 7 AM tea here sets the mood for the whole day.',
        likes: 24
      },
      {
        id: 'c-s2',
        foodSpotId: 'selvi-tea-stall',
        authorName: 'Deepa',
        avatarColor: '#fd7e14',
        timeAgo: '1d ago',
        text: 'Ask for "Ginger Strong" - uncle makes it fresh with real cardamom.',
        likes: 19
      },
      {
        id: 'c-s3',
        foodSpotId: 'selvi-tea-stall',
        authorName: 'Ramesh',
        avatarColor: '#20c997',
        timeAgo: '4d ago',
        text: 'Bun butter jam gets over by 8:30 PM.',
        likes: 14
      }
    ]
  },
  {
    id: 'mani-bajji-kadai',
    name: 'Mani Bajji Kadai',
    tamilName: 'மணி பஜ்ஜி கடை',
    latitude: maniGeo.latitude,
    longitude: maniGeo.longitude,
    category: 'Street Eats',
    description: 'Huge bubbling iron wok frying golden vazhaikkai and milagai bajjis, served with coconut chutney.',
    image: makeSvgImage('🌶️', '#e03131', '#d9480f', 'Milagai Bajji'),
    photos: EXISTING_SPOT_PHOTOS['mani-bajji-kadai'] || [],
    createdBy: 'Theru Community',
    createdAt: '2026-01-12T16:00:00Z',
    streetName: 'South Evening Street',
    specialties: ['Milagai Bajji', 'Vazhaikkai Bajji', 'Onion Pakoda', 'Coconut Chutney'],
    priceMin: 20,
    priceMax: 50,
    openingHours: '4 PM – 9:30 PM',
    communityRecommended: true,
    recommendedItem: 'Steaming Milagai Bajji with Garlic Coconut Chutney',
    stallColor: '#fd7e14',
    stallType: 'bajji-cart',
    setupType: 'cart',
    recommendations: [
      {
        id: 'rec-m1',
        foodSpotId: 'mani-bajji-kadai',
        dishName: 'Milagai Bajji (Chilli Fritters)',
        description: 'Plump Bhavani green chillies dipped in seasoned gram flour batter, deep fried till blistering golden.',
        recommendCount: 41
      },
      {
        id: 'rec-m2',
        foodSpotId: 'mani-bajji-kadai',
        dishName: 'Vazhaikkai (Raw Banana) Bajji',
        description: 'Thin raw plantain slices crisp fried, best paired with watery red garlic coconut chutney.',
        recommendCount: 29
      }
    ],
    communityComments: [
      {
        id: 'c-m1',
        foodSpotId: 'mani-bajji-kadai',
        authorName: 'Anand',
        avatarColor: '#e03131',
        timeAgo: '45m ago',
        text: 'The milagai bajji is genuinely spicy today!',
        likes: 15
      },
      {
        id: 'c-m2',
        foodSpotId: 'mani-bajji-kadai',
        authorName: 'Meenakshi',
        avatarColor: '#d6336c',
        timeAgo: '2d ago',
        text: 'Best eaten standing on the corner while raining.',
        likes: 27
      }
    ]
  },
  {
    id: 'rahman-shawarma',
    name: 'Rahman Shawarma',
    tamilName: 'ரஹ்மான் ஷவர்மா',
    latitude: rahmanGeo.latitude,
    longitude: rahmanGeo.longitude,
    category: 'Street Eats',
    description: 'Vertical rotating rotisserie slowly roasting marinated chicken, sliced thin and rolled in hot bread.',
    image: makeSvgImage('🌯', '#7048e8', '#ae3ec9', 'Chicken Shawarma'),
    photos: EXISTING_SPOT_PHOTOS['rahman-shawarma'] || [],
    createdBy: 'Theru Community',
    createdAt: '2026-01-13T17:00:00Z',
    streetName: 'East Commercial Boulevard',
    specialties: ['Chicken Shawarma Roll', 'Plate Shawarma', 'Rumali Roti Roll', 'Garlic Toum'],
    priceMin: 100,
    priceMax: 180,
    openingHours: '5 PM – 11:30 PM',
    communityRecommended: false,
    recommendedItem: 'Special Rumali Chicken Shawarma with extra pickled cucumbers',
    stallColor: '#7048e8',
    stallType: 'shawarma',
    setupType: 'van',
    recommendations: [
      {
        id: 'rec-r1',
        foodSpotId: 'rahman-shawarma',
        dishName: 'Rumali Chicken Shawarma Roll',
        description: 'Loaded with slow-roasted chicken shaved fresh off the spit, toum garlic sauce, and crunchy fries.',
        recommendCount: 36
      },
      {
        id: 'rec-r2',
        foodSpotId: 'rahman-shawarma',
        dishName: 'Open Meat Plate Shawarma',
        description: 'Generous platter of shredded meat, pickled beets, jalapeños, two warm kuboos, and garlic dip.',
        recommendCount: 24
      }
    ],
    communityComments: [
      {
        id: 'c-r1',
        foodSpotId: 'rahman-shawarma',
        authorName: 'Zubair',
        avatarColor: '#7048e8',
        timeAgo: '1h ago',
        text: 'Go for the Rumali roll over Kuboos here.',
        likes: 22
      },
      {
        id: 'c-r2',
        foodSpotId: 'rahman-shawarma',
        authorName: 'Fayaz',
        avatarColor: '#1098ad',
        timeAgo: '2d ago',
        text: 'Garlic sauce is made fresh every 2 hours.',
        likes: 16
      }
    ]
  },
  {
    id: 'murugan-juice-corner',
    name: 'Murugan Juice Corner',
    tamilName: 'முருகன் ஜூஸ் கார்னர்',
    latitude: muruganGeo.latitude,
    longitude: muruganGeo.longitude,
    category: 'Beverages',
    description: 'Fresh seasonal fruit stall serving hand-pressed sugarcane, citrus mousambi, and chilled rose milk.',
    image: makeSvgImage('🥤', '#0ca678', '#20c997', 'Fresh Fruit Juice'),
    photos: EXISTING_SPOT_PHOTOS['murugan-juice-corner'] || [],
    createdBy: 'Theru Community',
    createdAt: '2026-01-14T07:30:00Z',
    streetName: 'Grand Arterial Avenue',
    specialties: ['Nannari Sarbath', 'Fresh Orange Juice', 'Rose Milk', 'Sugarcane Juice'],
    priceMin: 30,
    priceMax: 80,
    openingHours: '9 AM – 11 PM',
    communityRecommended: true,
    recommendedItem: 'Authentic Nannari Sarbath with Sabja seeds and Lemon',
    stallColor: '#0ca678',
    stallType: 'juice-stall',
    setupType: 'stall',
    recommendations: [
      {
        id: 'rec-j1',
        foodSpotId: 'murugan-juice-corner',
        dishName: 'Nannari Sarbath with Sabja Seeds',
        description: 'Traditional sarsaparilla root syrup blended with fresh lime, iced water, and soaked basil seeds.',
        recommendCount: 42
      },
      {
        id: 'rec-j2',
        foodSpotId: 'murugan-juice-corner',
        dishName: 'Chilled Fragrant Rose Milk',
        description: 'Thick cold milk with fragrant rose syrup, sweet and refreshing.',
        recommendCount: 31
      }
    ],
    communityComments: [
      {
        id: 'c-j1',
        foodSpotId: 'murugan-juice-corner',
        authorName: 'Janaki',
        avatarColor: '#0ca678',
        timeAgo: '5h ago',
        text: 'The Nannari sarbath with sabja seeds is a lifesaver during summers.',
        likes: 33
      },
      {
        id: 'c-j2',
        foodSpotId: 'murugan-juice-corner',
        authorName: 'Bala',
        avatarColor: '#3bc9db',
        timeAgo: '3d ago',
        text: 'Cash and UPI accepted at counter.',
        likes: 11
      }
    ]
  },
  {
    id: 'amudha-mess',
    name: 'Amudha Mess',
    tamilName: 'அமுதா மெஸ்',
    latitude: amudhaGeo.latitude,
    longitude: amudhaGeo.longitude,
    category: 'Meals & Tiffin',
    description: 'Authentic homestyle South Indian vegetarian meals served on fresh plantain leaves from the ground-floor storefront.',
    image: makeSvgImage('🍛', '#d9480f', '#e03131', 'Amudha Mess'),
    photos: EXISTING_SPOT_PHOTOS['amudha-mess'] || [],
    createdBy: 'Theru Community',
    createdAt: '2026-01-09T10:00:00Z',
    streetName: 'West Bazaar Lane',
    specialties: ['Full Meals', 'Sambar Rice', 'Vatha Kuzhambu', 'Paruppu Urundai'],
    priceMin: 80,
    priceMax: 160,
    openingHours: '11:30 AM – 3:30 PM, 7 PM – 10 PM',
    communityRecommended: true,
    recommendedItem: 'Unlimited South Indian Meals with Mor Kuzhambu and Appalam',
    stallColor: '#e03131',
    stallType: 'meals',
    setupType: 'shop',
    locationType: 'existing-building',
    buildingId: 'bldg-1',
    recommendations: [
      {
        id: 'rec-a1',
        foodSpotId: 'amudha-mess',
        dishName: 'Special Banana Leaf Meals',
        description: 'Unlimited hot ponni rice, piping hot sambar, rasam, kootu, poriyal, appalam and payasam.',
        recommendCount: 48
      },
      {
        id: 'rec-a2',
        foodSpotId: 'amudha-mess',
        dishName: 'Vatha Kuzhambu with Ghee',
        description: 'Tangy, spicy sundakkai and manathakkali vatha kuzhambu with a spoon of fresh country ghee.',
        recommendCount: 34
      }
    ],
    communityComments: [
      {
        id: 'c-a1',
        foodSpotId: 'amudha-mess',
        authorName: 'Muthukumar',
        avatarColor: '#2b8a3e',
        timeAgo: '2h ago',
        text: 'The best homestyle meals in the neighborhood. Feels like eating at home.',
        likes: 27
      }
    ]
  }
];
