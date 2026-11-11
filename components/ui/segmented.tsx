"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

/**
 * Nền trượt cho nhóm nút dạng segmented.
 *
 * Đo vị trí nút đang chọn bằng getBoundingClientRect rồi đặt một lớp nền
 * absolute, animate bằng transform — không animate layout của các nút.
 * Bên trong cần đúng một phần tử mang `data-segment-active="true"`.
 */
export function SegmentedHighlight({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [rect, setRect] = useState<{ x: number; w: number; h: number; y: number } | null>(null)

  const measure = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const active = wrap.querySelector<HTMLElement>('[data-segment-active="true"]')
    if (!active) {
      setRect((prev) => (prev === null ? prev : null))
      return
    }
    const wrapBox = wrap.getBoundingClientRect()
    const box = active.getBoundingClientRect()
    const next = {
      x: Math.round(box.left - wrapBox.left),
      y: Math.round(box.top - wrapBox.top),
      w: Math.round(box.width),
      h: Math.round(box.height),
    }
    // Chỉ setState khi số đo thật sự đổi — tránh vòng lặp render vô hạn.
    setRect((prev) =>
      prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
        ? prev
        : next
    )
  }, [])

  useLayoutEffect(() => {
    measure()
  })

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [measure])

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {rect ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 rounded-lg bg-primary shadow-xs"
          style={{
            width: rect.w,
            height: rect.h,
            transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
            transition: reduced ? "none" : "transform 200ms cubic-bezier(0.2,0.9,0.4,1), width 200ms cubic-bezier(0.2,0.9,0.4,1)",
          }}
        />
      ) : null}
      {children}
    </div>
  )
}
