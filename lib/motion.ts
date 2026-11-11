"use client"

import { useEffect, useState } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Theo dõi lựa chọn "giảm chuyển động" của hệ điều hành.
 *
 * Trả về `false` trong lần render đầu (kể cả SSR) để tránh hydration mismatch,
 * sau đó đồng bộ với matchMedia khi đã mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return

    const mql = window.matchMedia(QUERY)
    setReduced(mql.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return reduced
}

const EASE = "ease-[cubic-bezier(0.2,0.9,0.4,1)]"

/** Bộ class dùng lại, giữ ngân sách chuyển động ở một chỗ. */
export const MOTION = {
  /** Chuyển màu/nền nhanh cho control. */
  colorFast: `transition-colors duration-150 ${EASE}`,
  /** Chuyển trạng thái chung cho control (màu + shadow + transform). */
  control: `transition-[color,background-color,border-color,box-shadow,transform] duration-200 ${EASE}`,
  /** Nâng nhẹ khi hover — chỉ transform, không layout. */
  lift: `transition-transform duration-150 ${EASE} hover:-translate-y-0.5`,
  /** Vào trang: fade + nhích lên. */
  enter: `animate-in fade-in slide-in-from-bottom-2 duration-200 ${EASE}`,
} as const
