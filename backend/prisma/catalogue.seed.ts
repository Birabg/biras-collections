/*
 * Seed catalogue.
 *
 * This is the single source of truth for the demo storefront. It mirrors
 * src/data/products.js, which the frontend used while the API was being built;
 * once the frontend reads from the API this file is the only place a product is
 * defined.
 *
 * Shape notes:
 * - `stock` is the *product total*. The seed spreads it across the size × colour
 *   grid so the variant-level numbers look like a real inventory rather than a
 *   copy of the total.
 * - `sku` is derived from the product slug so it stays stable and unique, which
 *   matters because SKU is a unique column and re-seeding must not collide.
 */

export interface SeedColour {
  name: string;
  hex: string;
}

export interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  shortDescription: string;
  images: string[];
  sizes: string[];
  colours: SeedColour[];
  stock: number;
  badge: string | null;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  rating: number;
  reviewCount: number;
}

export const seedCategories = [
  {
    slug: 'women',
    name: 'Women',
    description: "Modern women's fashion",
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85',
    sortOrder: 1,
  },
  {
    slug: 'men',
    name: 'Men',
    description: "Contemporary men's style",
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=1200&q=85',
    sortOrder: 2,
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    description: 'Curated accessories',
    image: 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1200&q=85',
    sortOrder: 3,
  },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: 'classic-linen-shirt',
    name: 'Classic Linen Shirt',
    category: 'men',
    subcategory: 'shirts',
    price: 1850,
    compareAtPrice: null,
    description:
      'A timeless linen shirt crafted from premium European flax. Breathable, lightweight, and perfect for warm days. Features a relaxed fit, mother-of-pearl buttons, and a classic collar.',
    shortDescription: 'Breathable European linen shirt with a relaxed fit.',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colours: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#1B2A4A' },
      { name: 'Sage', hex: '#8A9A7B' },
    ],
    stock: 45,
    badge: null,
    isNew: true,
    isFeatured: true,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    slug: 'elegant-summer-dress',
    name: 'Elegant Summer Dress',
    category: 'women',
    subcategory: 'dresses',
    price: 2950,
    compareAtPrice: 3500,
    description:
      'Flowing midi dress in a silk-cotton blend. Features a flattering V-neck, adjustable straps, and a subtle side slit. Perfect for both daytime and evening occasions.',
    shortDescription: 'Flowing silk-cotton midi dress with a subtle side slit.',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colours: [
      { name: 'Blush', hex: '#F4C2C2' },
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Emerald', hex: '#2D5A3D' },
    ],
    stock: 32,
    badge: 'Sale',
    isNew: false,
    isFeatured: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 89,
  },
  {
    slug: 'premium-leather-bag',
    name: 'Premium Leather Bag',
    category: 'accessories',
    subcategory: 'bags',
    price: 4200,
    compareAtPrice: null,
    description:
      'Handcrafted from full-grain Ethiopian leather. Spacious interior with zip pocket and phone slot. Adjustable leather strap. Ages beautifully over time.',
    shortDescription: 'Full-grain Ethiopian leather bag with an adjustable strap.',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['One Size'],
    colours: [
      { name: 'Cognac', hex: '#8B4513' },
      { name: 'Black', hex: '#1A1A1A' },
    ],
    stock: 18,
    badge: 'Bestseller',
    isNew: false,
    isFeatured: true,
    isBestSeller: true,
    rating: 5.0,
    reviewCount: 56,
  },
  {
    slug: 'modern-casual-jacket',
    name: 'Modern Casual Jacket',
    category: 'men',
    subcategory: 'outerwear',
    price: 3250,
    compareAtPrice: 3800,
    description:
      'Versatile bomber-style jacket in water-resistant technical fabric. Ribbed cuffs and hem, zip pockets, and a clean minimalist silhouette. Ideal for layering.',
    shortDescription: 'Water-resistant bomber jacket with ribbed cuffs and zip pockets.',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colours: [
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Olive', hex: '#556B2F' },
    ],
    stock: 27,
    badge: 'Sale',
    isNew: false,
    isFeatured: true,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 67,
  },
  {
    slug: 'silk-blend-blouse',
    name: 'Silk Blend Blouse',
    category: 'women',
    subcategory: 'tops',
    price: 1650,
    compareAtPrice: null,
    description:
      'Luxuriously soft silk-blend blouse with a relaxed drape. Button-front closure, long sleeves with button cuffs, and a curved hem. A wardrobe essential.',
    shortDescription: 'Soft silk-blend blouse with a relaxed drape.',
    images: [
      'https://images.unsplash.com/photo-1564257577-4c96b7b4b5d5?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colours: [
      { name: 'Ivory', hex: '#FFFFF0' },
      { name: 'Champagne', hex: '#F7E7CE' },
      { name: 'Midnight', hex: '#191970' },
    ],
    stock: 38,
    badge: 'New',
    isNew: true,
    isFeatured: false,
    isBestSeller: false,
    rating: 4.6,
    reviewCount: 43,
  },
  {
    slug: 'tailored-wool-trousers',
    name: 'Tailored Wool Trousers',
    category: 'men',
    subcategory: 'pants',
    price: 2100,
    compareAtPrice: null,
    description:
      'Expertly tailored trousers in premium Italian wool. Mid-rise, straight-leg fit with a clean crease. Unfinished hem for custom tailoring.',
    shortDescription: 'Mid-rise straight-leg trousers in premium Italian wool.',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['30', '32', '34', '36', '38', '40'],
    colours: [
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Navy', hex: '#1B2A4A' },
    ],
    stock: 41,
    badge: null,
    isNew: false,
    isFeatured: false,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 92,
  },
  {
    slug: 'minimalist-leather-belt',
    name: 'Minimalist Leather Belt',
    category: 'accessories',
    subcategory: 'belts',
    price: 650,
    compareAtPrice: null,
    description:
      'Sleek 3cm belt in vegetable-tanned leather. Solid brass buckle with matte finish. Hand-stitched edges. Available in 5cm increments.',
    shortDescription: '3cm vegetable-tanned leather belt with a brass buckle.',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['80', '85', '90', '95', '100', '105', '110'],
    colours: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Brown', hex: '#8B4513' },
      { name: 'Tan', hex: '#D2B48C' },
    ],
    stock: 60,
    badge: null,
    isNew: true,
    isFeatured: false,
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 78,
  },
  {
    slug: 'cashmere-blend-scarf',
    name: 'Cashmere Blend Scarf',
    category: 'accessories',
    subcategory: 'scarves',
    price: 1200,
    compareAtPrice: 1500,
    description:
      'Ultra-soft cashmere-wool blend scarf. Generous dimensions for versatile styling. Hand-finished fringed edges. Perfect weight for year-round wear.',
    shortDescription: 'Cashmere-wool blend scarf with hand-finished fringed edges.',
    images: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['One Size'],
    colours: [
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Grey', hex: '#808080' },
      { name: 'Burgundy', hex: '#800020' },
    ],
    stock: 35,
    badge: 'Sale',
    isNew: false,
    isFeatured: false,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 34,
  },
  {
    slug: 'structured-tote-bag',
    name: 'Structured Tote Bag',
    category: 'accessories',
    subcategory: 'bags',
    price: 2800,
    compareAtPrice: null,
    description:
      'Architectural tote in structured leather. Laptop compartment, interior zip pocket, and detachable pouch. Top handles and optional shoulder strap.',
    shortDescription: 'Structured leather tote with a laptop compartment.',
    images: [
      'https://images.unsplash.com/photo-1590874103328-ec8e530c44a9?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['One Size'],
    colours: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Whiskey', hex: '#D49A6A' },
    ],
    stock: 22,
    badge: 'New',
    isNew: true,
    isFeatured: false,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 29,
  },
  {
    slug: 'relaxed-fit-jeans',
    name: 'Relaxed Fit Jeans',
    category: 'men',
    subcategory: 'pants',
    price: 1950,
    compareAtPrice: null,
    description:
      'Classic relaxed-fit jeans in 13oz Japanese selvedge denim. Button fly, five-pocket styling, and a straight leg that works with any shoe.',
    shortDescription: 'Relaxed-fit jeans in 13oz Japanese selvedge denim.',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['30', '32', '34', '36', '38', '40'],
    colours: [
      { name: 'Indigo', hex: '#3F51B5' },
      { name: 'Black', hex: '#1A1A1A' },
    ],
    stock: 50,
    badge: null,
    isNew: false,
    isFeatured: false,
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 112,
  },
  {
    slug: 'pleated-midi-skirt',
    name: 'Pleated Midi Skirt',
    category: 'women',
    subcategory: 'skirts',
    price: 1450,
    compareAtPrice: null,
    description:
      'Knife-pleated midi skirt in fluid viscose. Elasticated waistband, side zip closure, and a graceful swing. Fully lined.',
    shortDescription: 'Knife-pleated midi skirt in fluid viscose, fully lined.',
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a13d9b?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colours: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Navy', hex: '#1B2A4A' },
      { name: 'Cream', hex: '#F5F5DC' },
    ],
    stock: 44,
    badge: null,
    isNew: false,
    isFeatured: false,
    isBestSeller: false,
    rating: 4.5,
    reviewCount: 38,
  },
  {
    slug: 'merino-wool-sweater',
    name: 'Merino Wool Sweater',
    category: 'men',
    subcategory: 'knitwear',
    price: 2400,
    compareAtPrice: 2800,
    description:
      'Fine-gauge merino wool sweater. Crew neck, set-in sleeves, ribbed cuffs and hem. Naturally temperature-regulating and odor-resistant.',
    shortDescription: 'Fine-gauge merino crew neck with ribbed cuffs and hem.',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colours: [
      { name: 'Oatmeal', hex: '#D9C8AE' },
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Forest', hex: '#2D5A3D' },
    ],
    stock: 33,
    badge: 'Sale',
    isNew: false,
    isFeatured: false,
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 65,
  },
];

export const seedSettings: Record<string, unknown> = {
  'store.freeShippingThreshold': 5000,
  'store.shippingFee': 150,
  'store.currency': 'ETB',
  'store.supportEmail': 'support@birascollections.com',
  'store.supportPhone': '+251900000000',
};