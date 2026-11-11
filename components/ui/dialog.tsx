"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Mọi bề rộng đều dùng tiền tố `sm:` để không bao giờ bị một rule biến thể
 * nào đó ghi đè (đây chính là lỗi cũ: `sm:max-w-lg` thắng `max-w-4xl`).
 */
const dialogContentVariants = cva(
  [
    "@container/dialog",
    "fixed top-1/2 left-1/2 z-50 flex max-h-[min(88vh,920px)] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2",
    "flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground outline-none",
    "shadow-[0_32px_80px_-28px_rgb(0_0_0/0.45),0_2px_10px_rgb(0_0_0/0.06)] duration-200",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
    "sm:w-[calc(100vw-4rem)]",
  ],
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-xl",
        xl: "sm:max-w-3xl",
        "2xl": "sm:max-w-5xl",
        full: "sm:max-w-[min(76rem,calc(100vw-4rem))]",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
)

export type DialogSize = NonNullable<VariantProps<typeof dialogContentVariants>["size"]>

function DialogContent({
  className,
  children,
  size,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
  }) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(dialogContentVariants({ size }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none"
          >
            <XIcon className="size-4" aria-hidden />
            <span className="sr-only">Đóng</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

interface DialogHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  icon?: LucideIcon
  title?: React.ReactNode
  description?: React.ReactNode
}

function DialogHeader({ icon: Icon, title, description, children, className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex shrink-0 items-start gap-3.5 border-b border-border/70 bg-card px-6 py-4 pr-14",
        className
      )}
      {...props}
    >
      {Icon ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <DialogPrimitive.Title className="text-base leading-tight font-semibold tracking-tight">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        ) : null}
      </div>
      {children}
    </div>
  )
}

/** Vùng cuộn duy nhất của dialog: header và footer luôn đứng yên. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/70 bg-card/60 px-6 py-3.5",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
