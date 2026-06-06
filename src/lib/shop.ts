/**
 * Krav Maga store catalog. Static demo data (there is no products endpoint in
 * the authoritative API map) — kept here so the whole shop flow is explorable.
 * Prices are integer cents; thumbnails use an emoji glyph over a category
 * gradient, so the catalog is self-contained with no image assets.
 */

export type ShopCategory =
  | 'Luvas'
  | 'Proteção'
  | 'Vestuário'
  | 'Acessórios'
  | 'Equipamentos'

export interface Product {
  id: string
  name: string
  category: ShopCategory
  priceCents: number
  oldPriceCents?: number
  emoji: string
  rating: number
  reviews: number
  badge?: string
  description: string
  sizes?: string[]
  freeShipping?: boolean
}

export const CATEGORIES: (ShopCategory | 'Todos')[] = [
  'Todos',
  'Luvas',
  'Proteção',
  'Vestuário',
  'Acessórios',
  'Equipamentos',
]

/** Gradient + accent per category, used for thumbnails and chips. */
export const CATEGORY_STYLE: Record<ShopCategory, string> = {
  Luvas: 'from-red-500/20 to-orange-500/10',
  Proteção: 'from-blue-500/20 to-cyan-500/10',
  Vestuário: 'from-violet-500/20 to-fuchsia-500/10',
  Acessórios: 'from-amber-500/20 to-yellow-500/10',
  Equipamentos: 'from-emerald-500/20 to-green-500/10',
}

export const PRODUCTS: Product[] = [
  {
    id: 'luva-boxe-14',
    name: 'Luva de Boxe 14oz',
    category: 'Luvas',
    priceCents: 24990,
    oldPriceCents: 29990,
    emoji: '🥊',
    rating: 4.8,
    reviews: 214,
    badge: 'Mais vendido',
    sizes: ['12oz', '14oz', '16oz'],
    freeShipping: true,
    description:
      'Luva profissional em couro sintético com enchimento multicamadas e fecho em velcro reforçado. Ideal para treino de saco, aparador e sparring.',
  },
  {
    id: 'luva-mma',
    name: 'Luva MMA Grappling',
    category: 'Luvas',
    priceCents: 18990,
    emoji: '🥊',
    rating: 4.6,
    reviews: 132,
    sizes: ['P', 'M', 'G', 'GG'],
    description:
      'Luva de MMA com dedos livres para grappling e clinch, palma ventilada e proteção nos nós dos dedos.',
  },
  {
    id: 'bandagem',
    name: 'Bandagem Elástica 3m (par)',
    category: 'Acessórios',
    priceCents: 3990,
    emoji: '🩹',
    rating: 4.7,
    reviews: 308,
    description:
      'Par de bandagens elásticas de 3 metros com fecho em velcro e passador para o polegar. Protege punhos e articulações.',
  },
  {
    id: 'caneleira',
    name: 'Caneleira Profissional',
    category: 'Proteção',
    priceCents: 15990,
    emoji: '🛡️',
    rating: 4.5,
    reviews: 96,
    sizes: ['P', 'M', 'G'],
    description:
      'Caneleira com proteção integrada de canela e peito do pé, espuma de alta densidade e tiras ajustáveis.',
  },
  {
    id: 'bucal',
    name: 'Protetor Bucal Dual',
    category: 'Proteção',
    priceCents: 4990,
    emoji: '🦷',
    rating: 4.4,
    reviews: 187,
    description:
      'Protetor bucal moldável de dupla camada com estojo higiênico. Absorve impacto e facilita a respiração.',
  },
  {
    id: 'coquilha',
    name: 'Coquilha de Proteção',
    category: 'Proteção',
    priceCents: 8990,
    emoji: '🛡️',
    rating: 4.3,
    reviews: 54,
    sizes: ['M', 'G', 'GG'],
    description:
      'Protetor genital com concha rígida e cinta elástica anatômica para máxima segurança nos treinos de contato.',
  },
  {
    id: 'capacete',
    name: 'Capacete de Treino',
    category: 'Proteção',
    priceCents: 29990,
    emoji: '⛑️',
    rating: 4.6,
    reviews: 71,
    badge: 'Premium',
    sizes: ['M', 'G'],
    freeShipping: true,
    description:
      'Capacete com proteção de bochechas e nuca, acolchoamento premium e excelente campo de visão para sparring.',
  },
  {
    id: 'rashguard',
    name: 'Rashguard Manga Longa',
    category: 'Vestuário',
    priceCents: 13990,
    emoji: '👕',
    rating: 4.7,
    reviews: 142,
    sizes: ['P', 'M', 'G', 'GG'],
    description:
      'Rashguard com tecido de compressão, proteção UV e costura flatlock que não irrita a pele durante o grappling.',
  },
  {
    id: 'shorts',
    name: 'Shorts de Luta',
    category: 'Vestuário',
    priceCents: 9990,
    emoji: '🩳',
    rating: 4.5,
    reviews: 118,
    sizes: ['P', 'M', 'G', 'GG'],
    description:
      'Shorts de luta com elastano nas laterais, fecho duplo e total liberdade de movimento para chutes e quedas.',
  },
  {
    id: 'camiseta',
    name: 'Camiseta Krav Maga',
    category: 'Vestuário',
    priceCents: 7990,
    emoji: '👕',
    rating: 4.8,
    reviews: 263,
    badge: 'Novo',
    sizes: ['P', 'M', 'G', 'GG'],
    description:
      'Camiseta 100% algodão penteado com estampa Krav Maga. Confortável para o treino e para o dia a dia.',
  },
  {
    id: 'aparador',
    name: 'Aparador de Soco (par)',
    category: 'Equipamentos',
    priceCents: 21990,
    emoji: '🎯',
    rating: 4.6,
    reviews: 88,
    freeShipping: true,
    description:
      'Par de aparadores (focus mitts) curvados com absorção de impacto e pegada ergonômica para treino de precisão.',
  },
  {
    id: 'saco',
    name: 'Saco de Pancada 90cm',
    category: 'Equipamentos',
    priceCents: 39990,
    emoji: '🥊',
    rating: 4.9,
    reviews: 156,
    badge: 'Top avaliado',
    freeShipping: true,
    description:
      'Saco de pancada de 90cm já preenchido, com corrente e mosquetão giratório. Couro sintético resistente a impactos intensos.',
  },
  {
    id: 'escudo',
    name: 'Escudo de Chute',
    category: 'Equipamentos',
    priceCents: 27990,
    emoji: '🛡️',
    rating: 4.5,
    reviews: 63,
    description:
      'Aparador de chute (thai pad) com dupla alça, núcleo de espuma de alta absorção e superfície reforçada.',
  },
  {
    id: 'corda',
    name: 'Corda de Pular Speed',
    category: 'Acessórios',
    priceCents: 5990,
    emoji: '🪢',
    rating: 4.4,
    reviews: 201,
    description:
      'Corda de pular com rolamento de velocidade, cabo de aço revestido e pegada antiderrapante para condicionamento.',
  },
  {
    id: 'mochila',
    name: 'Mochila Esportiva 40L',
    category: 'Acessórios',
    priceCents: 12990,
    emoji: '🎒',
    rating: 4.6,
    reviews: 97,
    description:
      'Mochila com compartimento ventilado para luvas, bolso térmico e alças acolchoadas. Leve todo o equipamento ao tatame.',
  },
  {
    id: 'garrafa',
    name: 'Garrafa Térmica 1L',
    category: 'Acessórios',
    priceCents: 6990,
    emoji: '🧴',
    rating: 4.5,
    reviews: 175,
    description:
      'Garrafa térmica de aço inox que mantém a temperatura por até 12h. Tampa antivazamento ideal para o treino.',
  },
]

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

/** Free shipping threshold and flat fee (cents). */
export const FREE_SHIPPING_FROM = 19900
export const SHIPPING_FEE = 1990

/** A single line of a placed order (snapshot of the product at purchase time). */
export interface OrderItem {
  productId: string
  name: string
  qty: number
  size?: string
  priceCents: number
}

/** A placed order. Persisted locally today; mirrors a future POST /Shop/Orders. */
export interface Order {
  id: string
  createdAt: string
  customerName: string
  email: string
  address: string
  method: 'pix' | 'card'
  items: OrderItem[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  status: 'paid' | 'pending'
}
