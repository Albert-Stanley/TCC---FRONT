import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

/**
 * Layout for authenticated screens: the active route fills the frame and the
 * bottom navigation sticks to the bottom of the frame (not the browser window),
 * so it works identically on a phone and inside the desktop device frame. The
 * content is keyed by path so each screen animates in on navigation.
 */
export function NavLayout() {
  const location = useLocation()
  return (
    <>
      <div
        key={location.pathname}
        className="flex flex-1 flex-col animate-slide-up"
      >
        <Outlet />
      </div>
      <BottomNav />
    </>
  )
}
