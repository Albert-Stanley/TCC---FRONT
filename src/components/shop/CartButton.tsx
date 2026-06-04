import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCartCount } from '@/store/cartStore'

/** Cart icon button with a live item-count badge. Navigates to `/cart`. */
export function CartButton({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const count = useCartCount()
  return (
    <button
      type="button"
      aria-label={count ? `Carrinho (${count} itens)` : 'Carrinho'}
      onClick={() => navigate('/cart')}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${className}`}
    >
      <ShoppingBag size={21} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  )
}
