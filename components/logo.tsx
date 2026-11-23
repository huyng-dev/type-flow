"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type LogoConcept = "1-isometric" | "1-topdown" | "1-geometric" | "2" | 1 | 2

export { LogoConcept1Isometric, LogoConcept1Topdown } from "./logo-ai"
import { LogoConcept1Isometric, LogoConcept1Topdown } from "./logo-ai"

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  concept?: LogoConcept
  variant?: "primary" | "minimal"
  className?: string
}

/**
 * Concept 1: The Flowing Keycap (Keycap dòng chảy)
 * - Tượng hình: Phím cơ học vát góc với lòng phím (keycap dish) công thái học.
 * - Ý nghĩa: Chữ 'T' cách điệu thành dòng nước mềm mại (laminar flow) lướt thoát khỏi lòng phím,
 *   kết hợp gờ định vị ngón tay (homing bar) biểu tượng cho hàng phím chuẩn cơ bản.
 * - Tông màu: Trung tính thuần khiết (monochrome / neutral), không dùng gradient, tương thích hoàn hảo mọi theme.
 */
export function LogoConcept1({
  size = 32,
  variant = "primary",
  className,
  ...props
}: Omit<LogoProps, "concept">) {
  if (variant === "minimal") {
    // Phiên bản tối giản đặc biệt sắc nét cho kích thước nhỏ (16px - 24px)
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        className={cn("shrink-0 text-foreground", className)}
        {...props}
      >
        {/* Khung phím vát mép */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.4"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Lòng phím */}
        <rect
          x="9"
          y="9"
          width="30"
          height="28"
          rx="6"
          stroke="currentColor"
          strokeWidth="2.2"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Chữ T dòng chảy nét đậm */}
        <path
          d="M 16 19 H 32"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M 24 19 V 28 C 24 32 27.5 34 31.5 34"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Gờ tactile định vị */}
        <line
          x1="20"
          y1="40"
          x2="28"
          y2="40"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
      </svg>
    )
  }

  // Phiên bản chi tiết kiến trúc (Architectural Precision Keycap)
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={cn("shrink-0 text-foreground", className)}
      {...props}
    >
      {/* Đế keycap cơ học */}
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.35"
        fill="currentColor"
        fillOpacity="0.04"
      />

      {/* Đường vát 4 góc từ đế lên lòng phím (Keycap Bevel Angles) */}
      <line x1="6" y1="6" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="58" y1="6" x2="51" y2="12" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="6" y1="58" x2="13" y2="46" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="58" y1="58" x2="51" y2="46" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />

      {/* Lòng phím vát lõm (Ergonomic Dish) */}
      <rect
        x="13"
        y="12"
        width="38"
        height="34"
        rx="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.65"
        fill="currentColor"
        fillOpacity="0.08"
      />

      {/* Nét ngang chữ T */}
      <path
        d="M 21 23 H 43"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Nét đứng uốn lượn thành dòng chảy thủy động lực (Fluid T-Stem) */}
      <path
        d="M 32 23 V 33 C 32 38 35.5 40.5 41 40.5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Dòng sóng đệm nhịp gõ (Flow Ripple Line) */}
      <path
        d="M 22 36 C 25.5 39.5 29 40.5 33.5 40.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />

      {/* Gờ tactile định vị bàn phím cơ (Homing Bar cho phím F/J) */}
      <line
        x1="26"
        y1="52"
        x2="38"
        y2="52"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  )
}

/**
 * Concept 2: Infinity Keystroke / The Switch Flow (Phím đôi Vô cực)
 * - Tượng hình: Hai switch cơ học hoặc 2 phím cạnh nhau nối liền bằng dải lụa vô cực (∞).
 * - Ý nghĩa: Biểu tượng cho nhịp gõ liên hồi giữa hai bán cầu tay không ngắt quãng,
 *   trạng thái dòng chảy (Flow State), tốc độ và sự chính xác bền bỉ.
 * - Tông màu: Trung tính thuần khiết (monochrome / neutral), không dùng gradient.
 */
export function LogoConcept2({
  size = 32,
  variant = "primary",
  className,
  ...props
}: Omit<LogoProps, "concept">) {
  if (variant === "minimal") {
    // Phiên bản tối giản gọn ghẽ cho biểu tượng thanh bar hoặc favicon
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        className={cn("shrink-0 text-foreground", className)}
        {...props}
      >
        {/* Vòng lặp vô cực đôi (Infinity Ribbon) */}
        <path
          d="M 24 24 C 28 17 33 15 37 15 C 43 15 45 19 45 24 C 45 29 43 33 37 33 C 33 33 28 31 24 24 C 20 17 15 15 11 15 C 5 15 3 19 3 24 C 3 29 5 33 11 33 C 15 33 20 31 24 24 Z"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Chữ thập trục switch cơ học bên trái */}
        <line x1="11" y1="21" x2="11" y2="27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="8" y1="24" x2="14" y2="24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        {/* Mũi tên nhịp gõ tiếp nối bên phải */}
        <path
          d="M 35 21 L 39 24 L 35 27"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Phiên bản chi tiết: Phím đôi cơ học + Dải lụa dòng chảy vô cực (Twin Key Infinity Flow)
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={cn("shrink-0 text-foreground", className)}
      {...props}
    >
      {/* Phím cơ 1 (Bên trái) */}
      <rect
        x="6"
        y="16"
        width="23"
        height="32"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.35"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Lòng phím trái */}
      <rect
        x="9.5"
        y="19.5"
        width="16"
        height="22"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        fill="currentColor"
        fillOpacity="0.06"
      />

      {/* Phím cơ 2 (Bên phải) */}
      <rect
        x="35"
        y="16"
        width="23"
        height="32"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.35"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Lòng phím phải */}
      <rect
        x="38.5"
        y="19.5"
        width="16"
        height="22"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        fill="currentColor"
        fillOpacity="0.06"
      />

      {/* Dải lụa dòng chảy vô cực kết nối 2 phím (The Continuous Flow Ribbon) */}
      <path
        d="M 32 30 C 36 21 41 20 45 20 C 51 20 54 24 54 29 C 54 34 50 37 45 37 C 40 37 36 34 32 30 C 28 26 24 23 19 23 C 14 23 10 26 10 31 C 10 36 13 40 19 40 C 23 40 28 39 32 30 Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.95"
      />

      {/* Trục switch cơ học hình chữ thập (+) ở phím trái */}
      <line x1="17.5" y1="28" x2="17.5" y2="34" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.75" />
      <line x1="14.5" y1="31" x2="20.5" y2="31" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.75" />

      {/* Trục switch cơ học hình chữ thập (+) ở phím phải */}
      <line x1="46.5" y1="26" x2="46.5" y2="32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.75" />
      <line x1="43.5" y1="29" x2="49.5" y2="29" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.75" />

      {/* Điểm nhấn liên kết trung tâm (Precision Joint) */}
      <circle cx="32" cy="30" r="2" fill="currentColor" fillOpacity="0.8" />
    </svg>
  )
}

export function getLogoIcon(concept: LogoConcept) {
  if (concept === "1-topdown") return LogoConcept1Topdown
  if (concept === "1-geometric" || concept === 1) return LogoConcept1
  if (concept === 2 || concept === "2") return LogoConcept2
  return LogoConcept1Isometric
}

/**
 * TypeFlow Logo Component - Hỗ trợ chuyển đổi linh hoạt giữa các concept
 */
export function TypeFlowLogo({
  concept = "1-isometric",
  variant = "primary",
  size = 32,
  showWordmark = false,
  className,
  ...props
}: LogoProps & { showWordmark?: boolean }) {
  const Icon = getLogoIcon(concept)

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Icon size={size} variant={variant} {...props} />
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[1.25rem] font-extrabold tracking-tight text-foreground">
              Type<span className="text-foreground/70">Flow</span>
            </span>
            <span className="rounded border border-border/80 bg-muted/60 px-1 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
              2.0
            </span>
          </div>
          <span className="text-[10px] tracking-wide text-muted-foreground">
            Luyện gõ tiếng Việt & English
          </span>
        </div>
      )}
    </div>
  )
}
