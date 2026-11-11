# Kế hoạch nâng cấp animation — TypeFlow

## 1. Hiện trạng (đo từ code, không phỏng đoán)

**Không có thư viện animation.** `package.json` chỉ có `tw-animate-css` (dev dep) + Tailwind 4. Không framer-motion, không motion, không GSAP.

**Những gì đã có:**

| Vị trí | Nội dung | Ghi chú |
|---|---|---|
| `app/globals.css:132-139` | `@keyframes caretBlink` | Dùng thật, qua `.caret-smooth` |
| `app/globals.css:141-148` | `@keyframes pulseGlow` | **Chết** — không component nào dùng |
| `app/globals.css:150-153` | `.caret-smooth` | Blink 1s + transition `left/top` |
| `app/globals.css:155-157` | `.theme-transition` | **Chết** — grep 0 hit trong components |
| `app/globals.css:104` | `body transition-colors duration-300` | Chỉ áp cho `body`, không lan sang phần tử con |
| `components/ui/dialog.tsx:31,49-50` | `animate-in/out`, `fade-in-0`, `zoom-in-95` | tw-animate-css, chạy tốt |
| `components/ui/select.tsx:64` | `slide-in-from-*`, `zoom-*` | tw-animate-css |
| `components/test-result.tsx:34` | `animate-in fade-in-50 duration-300` | Một lần duy nhất |
| `app/page.tsx:890` | Toast AI coach `animate-in fade-in-50` | Chỉ vào, không có exit |
| `app/page.tsx:458-476` | `scrollTo({behavior:"smooth"})` | Cuộn theo từ hiện tại |
| `components/data-display.tsx:139` | `transition-[width] duration-300` | Thanh Meter |

**Những gì đang thiếu hoàn toàn:**

- **Không có `prefers-reduced-motion` ở bất kỳ đâu.** Grep toàn repo: 0 hit. Đây là lỗi accessibility thật, không phải nice-to-have.
- Không có feedback khi gõ sai (không rung, không flash) — `app/page.tsx:952-958` chỉ đổi màu chữ tức thời.
- `StatTile` (`components/data-display.tsx:68`) nhảy số tức thời, không đếm.
- `Sparkline` (`components/data-display.tsx:147`) render tĩnh, không vẽ dần.
- Huy hiệu (`components/achievement-icon.tsx:63`) hiện ra không có reveal/stagger.
- Toggle sidebar (`app/page.tsx:1032`) mount/unmount tức thời, layout nhảy.
- Chuyển theme: CSS var đổi một phát, mọi phần tử snap cùng lúc. `.theme-transition` có sẵn nhưng không ai gắn.
- Toolbar language/mode (`app/page.tsx:747-800`): nền `bg-primary` nhảy giữa các nút thay vì trượt.

## 2. Nguyên tắc (ràng buộc, không thương lượng)

Đây là app luyện gõ. Animation ở đây **không được cạnh tranh với phím bấm**.

1. **Không animate trên đường keystroke.** Mỗi ký tự gõ vào phải phản hồi trong cùng frame. Cấm `transition` trên thuộc tính layout của ký tự đang gõ.
2. **Chỉ `transform` và `opacity`.** Không animate `width`, `height`, `top`, `left` trên phần tử trong vùng gõ — trừ `.caret-smooth` hiện có (đã là ngoại lệ có kiểm soát, và sẽ thay bằng `transform` ở Phase 1).
3. **Reduced-motion là mặc định phải tôn trọng**, không phải tuỳ chọn bật thêm.
4. **Không thêm dependency ở Phase 0-2.** CSS + một hook 20 dòng là đủ. Chỉ cân nhắc `motion` (framer-motion) ở Phase 3 nếu cần layout animation thật.
5. **Ngân sách:** mỗi animation UI ≤ 250ms, easing `cubic-bezier(0.2, 0.9, 0.4, 1)`. Không animation nào dài hơn 400ms ngoài hiệu ứng ăn mừng kết quả.

## 3. Các phase

### Phase 0 — Nền tảng (0.5 ngày)

- `app/globals.css`: thêm block `@theme` cho token chuyển động — `--ease-out-soft`, `--duration-fast: 120ms`, `--duration-base: 200ms`, `--duration-slow: 320ms`.
- `app/globals.css`: thêm `@media (prefers-reduced-motion: reduce)` global — tắt `animation-duration`/`transition-duration` về `0.01ms` cho `*`, giữ `scroll-behavior: auto`.
- `lib/motion.ts` (mới): export `useReducedMotion()` (matchMedia + listener) và hằng `MOTION` chứa các bộ class dùng lại.
- Xoá `@keyframes pulseGlow` (`globals.css:141-148`) và `.theme-transition` (`:155-157`) — code chết, đã xác nhận 0 usage. Hoặc giữ `.theme-transition` và gắn vào `body` ở Phase 3, tuỳ quyết định lúc làm.
- **Xong khi:** `npm run build` sạch, không còn keyframe mồ côi.

### Phase 1 — Vùng gõ (1.5 ngày) — phần quan trọng nhất

Đây là nơi người dùng nhìn 100% thời gian. Đầu tư ở đây, không phải ở landing page.

- **Caret dùng `transform` thay vì `left/top`.** `app/page.tsx:961` và `:984` hiện dựa vào transition `left 0.08s` + `top 0.12s` trong `.caret-smooth`. Đổi sang một caret phần tử duy nhất, định vị tuyệt đối, animate bằng `translate3d` + `will-change: transform`. Blink giữ nguyên `caretBlink`.
- **Phản hồi ký tự đúng:** thêm `animate-char-pop` (scale 1 → 1.06 → 1, 120ms) chỉ trên ký tự vừa gõ đúng. Dùng `key={charIdx}` có sẵn, không cần state mới.
- **Phản hồi ký tự sai:** `animate-shake` biên độ 2px, 140ms, chỉ chạy một lần trên ký tự sai mới nhất. Không rung cả từ — rung cả từ ở tốc độ 60+ WPM sẽ gây nhiễu thị giác.
- **Hoàn thành từ:** word vừa xong nhận `animate-word-settle` (opacity 1 → 0.8, 160ms). Nhẹ, không nhảy.
- **Toast AI coach** (`app/page.tsx:889-894`): thêm exit animation. Hiện chỉ có enter, biến mất đột ngột sau 3s (`:430`). Cần state `isLeaving` hoặc dùng `data-state` + `animate-out`.
- **Overlay "nhấp để bắt đầu"** (`app/page.tsx:906-913`): fade + scale nhẹ khi ẩn, thay vì unmount tức thời.
- **Kiểm tra IME tiếng Việt sau mỗi thay đổi.** Đây là rủi ro số một. Input ẩn ở `:996-1009` dùng `onChange` cho IME; bọc active word trong phần tử có `transform`/`will-change` có thể làm con trỏ soạn thảo IME lệch. Test tay với Telex và VNI trước khi merge.

### Phase 2 — Kết quả & dashboard (1 ngày)

- **`StatTile` count-up** (`components/data-display.tsx:68`): prop `animateValue?: boolean`, đếm từ 0 đến giá trị trong 500ms bằng `requestAnimationFrame`, tôn trọng reduced-motion (nhảy thẳng). Áp cho WPM, accuracy, score ở `test-result.tsx:44,61-67`.
- **`Sparkline` vẽ dần** (`components/data-display.tsx:147`): `stroke-dasharray`/`stroke-dashoffset` cho path, 600ms, chạy một lần khi mount. Không animate lại khi re-render.
- **Stagger huy hiệu** (`test-result.tsx:90-95`): mỗi `AchievementBadge` nhận `style={{animationDelay: index * 60 + "ms"}}`, dùng `animate-in fade-in slide-in-from-bottom-2`.
- **Huy hiệu legendary** (`achievement-icon.tsx:42`): thêm `retro-glow`-style pulse rất nhẹ, 1 lần, 800ms. Không loop — loop sẽ gây mỏi mắt trong dashboard.
- **`Meter`** (`data-display.tsx:139`): đổi `transition-[width]` sang scaleX trên một lớp con để tránh layout thrash. Đây là chỗ duy nhất còn animate `width` trong repo.

### Phase 3 — Khung trang (1 ngày)

- **Chuyển cảnh arena ↔ kết quả** (`app/page.tsx:730-739`): hiện là swap tức thời giữa `TestResult` và vùng gõ. Thêm crossfade 200ms bằng cách giữ cả hai trong một wrapper có `data-state`, hoặc đơn giản là `animate-in fade-in` trên `TestResult` (đã có ở `:34`) và `animate-out` trên arena.
- **Toggle sidebar** (`app/page.tsx:1032-1040`): hiện `sidebarOpen ? <aside> : null`. Đổi sang luôn render + `grid-template-columns` transition, hoặc `transform: translateX` + `opacity`. Lưu ý `:723-725` dùng `xl:grid-cols-[minmax(0,1fr)_300px]` — animate grid-template-columns được nhưng cần `@starting-style` hoặc transition trên container.
- **Chuyển theme crossfade:** gắn `.theme-transition` (đã có sẵn, đang chết) vào `html` hoặc thêm `transition: background-color, color, border-color 250ms` cho các token chính. Hiện `body` có `transition-colors` nhưng phần tử con dùng `bg-card`, `text-muted-foreground`... nên snap riêng lẻ.
- **Toolbar indicator trượt** (`app/page.tsx:745-800`): thay `bg-primary` trên từng nút bằng một `span` absolute trượt bằng `transform` theo index đang chọn. Đây là thay đổi đẹp nhất về mặt cảm giác, và rẻ.
- **Theme card hover** (`theme-selector.tsx:126`): thêm `hover:-translate-y-0.5` + shadow transition, 150ms.

### Phase 4 — Kiểm chứng (0.5 ngày)

- Chạy `npm run dev`, mở Chrome DevTools Performance, record một phiên gõ 60 giây ở 80+ WPM. **Tiêu chí: không frame nào > 16ms trong lúc gõ.** Nếu có, cắt animation ở Phase 1 chứ không cắt ở Phase 3.
- Bật `prefers-reduced-motion: reduce` trong DevTools Rendering panel, đi qua toàn bộ luồng: gõ → kết quả → dashboard → đổi theme. Không được có animation nào còn chạy.
- Test IME: Telex + VNI trên Chrome và Safari. Kiểm tra caret không lệch, không mất ký tự.
- Test mobile (375px): vùng gõ không bị reflow khi animation chạy.

## 4. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Animation làm lệch caret IME tiếng Việt | **Cao** | Test tay mỗi phase; không `will-change` trên phần tử chứa ký tự đang gõ |
| Jank khi gõ nhanh do re-render + animation | **Cao** | Chỉ animate `transform`/`opacity`; đo ở Phase 4, không đoán |
| Stagger huy hiệu làm chậm cảm giác "đã xong" | Trung bình | Tổng delay ≤ 400ms kể cả 6 huy hiệu |
| Theme crossfade gây flash ở theme tương phản cao | Trung bình | Loại `high_contrast` khỏi transition, snap tức thời |
| Bundle tăng nếu thêm framer-motion | Thấp | Không thêm ở Phase 0-2; Phase 3 chỉ thêm nếu layout animation thật sự cần |

## 5. Tổng kết công sức

| Phase | Thời gian | Giá trị |
|---|---|---|
| 0 — Nền tảng | 0.5 ngày | Accessibility + dọn nợ |
| 1 — Vùng gõ | 1.5 ngày | **Cảm giác cốt lõi** |
| 2 — Kết quả & dashboard | 1 ngày | Phần thưởng, tạo động lực |
| 3 — Khung trang | 1 ngày | Độ hoàn thiện |
| 4 — Kiểm chứng | 0.5 ngày | Không ship lỗi |
| **Tổng** | **4.5 ngày** | |

## 6. Đề xuất thứ tự

Làm Phase 0 + 1 trước, ship, rồi mới đánh giá. Nếu chỉ có 2 ngày, đó là toàn bộ giá trị. Phase 2 và 3 là polish, có thể cắt mà không mất gì cốt lõi. Phase 4 không được cắt.