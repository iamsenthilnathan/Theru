// Static Geographic Dataset for Theru
// Offline prepared from OpenStreetMap and Open Buildings

import { FoodSpot } from '../types/foodSpot';

export interface GeographicCoordinate {
  latitude: number;
  longitude: number;
}

export interface GeographicBuilding {
  id: string;
  coordinates: [number, number][]; // [longitude, latitude]
  heightMeters: number;
}

export interface GeographicRoad {
  id: string;
  name: string;
  highwayType: string;
  coordinates: [number, number][]; // [longitude, latitude]
  widthMeters: number;
}

export interface GeographicDataset {
  metadata: {
    name: string;
    locality: string;
    center: GeographicCoordinate;
    source: string;
  };
  buildings: GeographicBuilding[];
  roads: GeographicRoad[];
  foodSpots: FoodSpot[];
}

export const IDUVAMPALAYAM_DATASET: GeographicDataset = {
  "metadata": {
    "name": "Iduvampalayam Central Street",
    "locality": "Iduvampalayam, Tiruppur, Tamil Nadu",
    "center": {
      "latitude": 11.082650000000001,
      "longitude": 77.32435
    },
    "source": "OpenStreetMap & Open Buildings (Offline Extract)"
  },
  "buildings": [
    {
      "id": "2e35f48b-82c4-4b3a-9ae4-73af15456802",
      "coordinates": [
        [
          77.3241197,
          11.0829221
        ],
        [
          77.3241854,
          11.0829227
        ],
        [
          77.3241849,
          11.0829763
        ],
        [
          77.3241192,
          11.0829757
        ],
        [
          77.3241197,
          11.0829221
        ]
      ],
      "heightMeters": 4.5
    },
    {
      "id": "97e0eebb-dc53-4014-ab0f-44d9d9d5b332",
      "coordinates": [
        [
          77.3243366,
          11.082911
        ],
        [
          77.3243831,
          11.0829142
        ],
        [
          77.3243804,
          11.0829539
        ],
        [
          77.3243339,
          11.0829507
        ],
        [
          77.3243366,
          11.082911
        ]
      ],
      "heightMeters": 6
    },
    {
      "id": "30dbee27-a678-4e8b-94ef-22ee12eb90c1",
      "coordinates": [
        [
          77.3243329,
          11.0829695
        ],
        [
          77.3244357,
          11.0829643
        ],
        [
          77.3244385,
          11.0830187
        ],
        [
          77.3243358,
          11.0830239
        ],
        [
          77.3243329,
          11.0829695
        ]
      ],
      "heightMeters": 7.5
    },
    {
      "id": "4bd5cc63-1b90-4bb5-b350-8b1a7fc1baf3",
      "coordinates": [
        [
          77.3244786,
          11.0829071
        ],
        [
          77.3244806,
          11.0829456
        ],
        [
          77.3243887,
          11.0829503
        ],
        [
          77.3243867,
          11.0829117
        ],
        [
          77.3244786,
          11.0829071
        ]
      ],
      "heightMeters": 4.5
    },
    {
      "id": "443e5b47-7bc9-4ceb-a976-4f668f5c2933",
      "coordinates": [
        [
          77.3244776,
          11.0829078
        ],
        [
          77.3245673,
          11.082909
        ],
        [
          77.3245666,
          11.0829583
        ],
        [
          77.3246071,
          11.0829588
        ],
        [
          77.3246064,
          11.0830094
        ],
        [
          77.3244761,
          11.0830075
        ],
        [
          77.3244776,
          11.0829078
        ]
      ],
      "heightMeters": 6
    },
    {
      "id": "5a816a95-1fd3-4bf4-8122-aa1bf948af8c",
      "coordinates": [
        [
          77.3246029,
          11.0826925
        ],
        [
          77.324608,
          11.0828007
        ],
        [
          77.3244867,
          11.0828063
        ],
        [
          77.3244816,
          11.0826981
        ],
        [
          77.3246029,
          11.0826925
        ]
      ],
      "heightMeters": 7.5
    },
    {
      "id": "b9f56c51-b161-4486-8cc8-1a8e1aaf785e",
      "coordinates": [
        [
          77.3244845,
          11.0825185
        ],
        [
          77.3245542,
          11.0825194
        ],
        [
          77.3245538,
          11.0825508
        ],
        [
          77.324484,
          11.0825499
        ],
        [
          77.3244845,
          11.0825185
        ]
      ],
      "heightMeters": 4.5
    },
    {
      "id": "0b5a1cf0-9217-4958-af5b-de9fcd05dab0",
      "coordinates": [
        [
          77.324484,
          11.0825499
        ],
        [
          77.3246051,
          11.0825515
        ],
        [
          77.324604,
          11.0826289
        ],
        [
          77.324483,
          11.0826273
        ],
        [
          77.324484,
          11.0825499
        ]
      ],
      "heightMeters": 6
    },
    {
      "id": "6ddc604f-d812-4a8a-9d87-f12cee823336",
      "coordinates": [
        [
          77.3244338,
          11.0825791
        ],
        [
          77.3244881,
          11.0825772
        ],
        [
          77.3244905,
          11.0826431
        ],
        [
          77.3244362,
          11.082645
        ],
        [
          77.3244338,
          11.0825791
        ]
      ],
      "heightMeters": 7.5
    },
    {
      "id": "fdbc447b-dfd9-41c8-994c-7706507489a1",
      "coordinates": [
        [
          77.3243353,
          11.0825827
        ],
        [
          77.32438,
          11.082581
        ],
        [
          77.3243796,
          11.0825698
        ],
        [
          77.3244343,
          11.0825677
        ],
        [
          77.3244373,
          11.0826443
        ],
        [
          77.3245965,
          11.0826382
        ],
        [
          77.3245985,
          11.082689
        ],
        [
          77.3243399,
          11.082699
        ],
        [
          77.3243353,
          11.0825827
        ]
      ],
      "heightMeters": 4.5
    },
    {
      "id": "fd05ef35-03e7-4287-bbcf-1c016aa5ed42",
      "coordinates": [
        [
          77.3243373,
          11.0827531
        ],
        [
          77.3244923,
          11.0827452
        ],
        [
          77.324495,
          11.0827976
        ],
        [
          77.32434,
          11.0828054
        ],
        [
          77.3243373,
          11.0827531
        ]
      ],
      "heightMeters": 6
    },
    {
      "id": "58bef6ff-6733-4afd-a629-f601364be57b",
      "coordinates": [
        [
          77.3243835,
          11.0828595
        ],
        [
          77.3244821,
          11.0828609
        ],
        [
          77.3244814,
          11.0829078
        ],
        [
          77.3243828,
          11.0829064
        ],
        [
          77.3243835,
          11.0828595
        ]
      ],
      "heightMeters": 7.5
    },
    {
      "id": "f9cbc22a-15e0-45d8-99e7-deec7b569bd9",
      "coordinates": [
        [
          77.324107,
          11.0826525
        ],
        [
          77.3242397,
          11.0826462
        ],
        [
          77.3242424,
          11.0827015
        ],
        [
          77.3241096,
          11.0827077
        ],
        [
          77.324107,
          11.0826525
        ]
      ],
      "heightMeters": 4.5
    }
  ],
  "roads": [
    {
      "id": "207174630",
      "name": "Iduvampalayam Main Road",
      "highwayType": "residential",
      "coordinates": [
        [
          77.3242765,
          11.0823399
        ],
        [
          77.3243041,
          11.0835531
        ]
      ],
      "widthMeters": 5.5
    },
    {
      "id": "207170113",
      "name": "Cross Lane",
      "highwayType": "residential",
      "coordinates": [
        [
          77.3238222,
          11.0823629
        ],
        [
          77.3242765,
          11.0823399
        ],
        [
          77.3243572,
          11.0823358
        ],
        [
          77.324619,
          11.0823219
        ],
        [
          77.324732,
          11.0823159
        ],
        [
          77.3249281,
          11.0823055
        ],
        [
          77.325135,
          11.0822928
        ],
        [
          77.3251579,
          11.0822914
        ],
        [
          77.3253757,
          11.0823172
        ],
        [
          77.3255027,
          11.0823323
        ],
        [
          77.3257674,
          11.0823742
        ],
        [
          77.3259109,
          11.0823911
        ],
        [
          77.3261811,
          11.0824282
        ],
        [
          77.3265906,
          11.0824843
        ],
        [
          77.3269457,
          11.0825414
        ]
      ],
      "widthMeters": 4
    }
  ],
  "foodSpots": [
    {
      "id": "spot-annapoorna-traditional-mess",
      "name": "Annapoorna Traditional Mess",
      "officialName": "Sri Annapoorna Traditional Meals & Tiffin",
      "tamilName": "ஸ்ரீ அன்னபூர்ணா பாரம்பரிய மெஸ்",
      "latitude": 11.082771,
      "longitude": 77.3244,
      "category": "Tiffin & Dinner",
      "description": "Authentic Kongu-style afternoon banana leaf meals and evening crisp ghee roasts served hot from the stone hearth.",
      "createdBy": "Community Explorer",
      "createdAt": "2026-09-28T10:00:00Z",
      "streetName": "Iduvampalayam Main Road",
      "locationType": "existing-building",
      "buildingId": "fd05ef35-03e7-4287-bbcf-1c016aa5ed42",
      "specialties": [
        "Kongu Veg Meals",
        "Ghee Roast Dosa",
        "Filter Coffee"
      ],
      "priceRange": "₹40 – ₹110",
      "priceMin": 40,
      "priceMax": 110,
      "openingHours": "7 AM – 10 PM",
      "communityRecommended": true,
      "recommendedItem": "Kongu Banana Leaf Full Meals",
      "stallColor": "#e03131",
      "recommendations": [
        {
          "id": "rec-ap-1",
          "foodSpotId": "spot-annapoorna-traditional-mess",
          "dishName": "Kongu Banana Leaf Meals",
          "description": "Served with piping hot drumstick sambar, rasam, and traditional kootu.",
          "recommendCount": 42,
          "userAgreed": true
        },
        {
          "id": "rec-ap-2",
          "foodSpotId": "spot-annapoorna-traditional-mess",
          "dishName": "Ghee Roast Dosa",
          "description": "Golden crispy cone dosa roasted with pure village ghee.",
          "recommendCount": 29,
          "userAgreed": false
        }
      ],
      "communityComments": [
        {
          "id": "comm-ap-1",
          "foodSpotId": "spot-annapoorna-traditional-mess",
          "authorName": "Senthil",
          "avatarColor": "#e03131",
          "timeAgo": "1d ago",
          "text": "Best meals in this junction! Visit before 1:30 PM for fresh hot vadai.",
          "likes": 18,
          "userLiked": true,
          "replies": []
        }
      ]
    }
  ]
};
