import { CATEGORY_STYLE, type Product } from '@/lib/shop'

/** Self-contained product thumbnail: an emoji glyph over a category gradient. */
export function ProductThumb({
  product,
  className = '',
  glyph = 'text-5xl',
}: {
  product: Product
  className?: string
  glyph?: string
}) {
  if (product.image) {
    return (
      <div className={`overflow-hidden bg-canvas ${className}`}>
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${CATEGORY_STYLE[product.category]} ${className}`}
    >
      <span className={`${glyph} drop-shadow-sm`} role="img" aria-label={product.name}>
        {product.emoji}
      </span>
    </div>
  )
}
