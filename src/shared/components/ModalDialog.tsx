import { type AriaAttributes, DialogHTMLAttributes, type PropsWithChildren, useEffect, useRef } from "react"
import { cn } from "../lib/cn"

type ModalDialogIsOpenProps = {
  isOpen: boolean
  onCloseSettingsModal: () => void
}

export type ModalDialogProps = PropsWithChildren &
  DialogHTMLAttributes<HTMLDialogElement> &
  ModalDialogIsOpenProps &
  Pick<AriaAttributes, "aria-labelledby" | "aria-label" | "aria-describedby"> & {
    shouldLightDismiss?: boolean
    isScrolledBottom?: boolean
  }

function safelyOpenDialogAsModal(
  dialog: HTMLDialogElement | null,
  previousOverflowRef: { current: string | null },
  bodyOverflowWasChangedRef: { current: boolean }
) {
  if (dialog && !dialog.open) {
    dialog.showModal()
    // prevent body scrolling while modal is open
    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = "hidden"
    bodyOverflowWasChangedRef.current = true
  }
}

function safelyCloseDialog(
  dialog: HTMLDialogElement | null,
  previousOverflowRef: { current: string | null },
  bodyOverflowWasChangedRef: { current: boolean }
) {
  if (dialog && dialog.open) {
    dialog.close()
    // restore body scrolling to what it was before this dialog opened
    if (bodyOverflowWasChangedRef.current && previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current
      previousOverflowRef.current = null
      bodyOverflowWasChangedRef.current = false
    }
  }
}

export const ModalDialog = function ({
  shouldLightDismiss = true,
  isOpen,
  onCloseSettingsModal,
  children,
  className,
  isScrolledBottom,
  ...props
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousBodyOverflowRef = useRef<string | null>(null)
  const bodyOverflowWasChangedRef = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current

    if (isOpen) {
      safelyOpenDialogAsModal(dialog, previousBodyOverflowRef, bodyOverflowWasChangedRef)
    } else {
      safelyCloseDialog(dialog, previousBodyOverflowRef, bodyOverflowWasChangedRef)
    }

    return () => {
      safelyCloseDialog(dialog, previousBodyOverflowRef, bodyOverflowWasChangedRef)
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current

    function close(event: Event | KeyboardEvent) {
      event.preventDefault()
      event.stopPropagation()
      onCloseSettingsModal()
    }

    function lightDismiss(event: MouseEvent) {
      const { target } = event
      if (target instanceof Element && target.nodeName === "DIALOG") {
        const rect = target.getBoundingClientRect()

        const clickedOutsideDialog =
          rect.top > event.clientY || event.clientY > rect.bottom || rect.left > event.clientX || event.clientX > rect.right

        if (clickedOutsideDialog) {
          close(event)
        }
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.code === "Escape") {
        close(event)
      }
    }

    if (shouldLightDismiss) {
      dialog?.addEventListener("click", lightDismiss)
    }

    dialog?.addEventListener("keydown", closeOnEscape)

    return () => {
      if (shouldLightDismiss) {
        dialog?.removeEventListener("click", lightDismiss)
      }
      dialog?.removeEventListener("keydown", closeOnEscape)
    }
  }, [shouldLightDismiss, onCloseSettingsModal])

  return (
    <dialog
      ref={dialogRef}
      {...props}
      className={cn(
        // Custom properties
        "[--backdrop-bg-color-open:rgb(0_0_0/75%)] [--backdrop-bg-color-closed:rgb(0_0_0/0%)] [--animation-duration:150ms] [--animation-easing:ease-in-out]",
        // Base layout
        "m-auto max-w-[min(--spacing(130),calc(100%-(--spacing(4))))] border-4 overscroll-contain",
        // Dialog visual states
        `motion-safe:opacity-0 motion-safe:open:opacity-100 starting:open:opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.25)] ${!isScrolledBottom && "shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0px_-20px_20px_-5px_rgba(0,0,0,0.25)]"}`,
        // Backdrop visual states
        "backdrop:bg-(--backdrop-bg-color-closed) open:backdrop:bg-(--backdrop-bg-color-open) starting:open:backdrop:bg-(--backdrop-bg-color-closed)",
        // Dialog transitions
        "motion-safe:transition-[position,overlay,opacity,display] motion-safe:duration-[0ms,var(--animation-duration),var(--animation-duration),var(--animation-duration)] motion-safe:ease-[linear,var(--animation-easing),var(--animation-easing),var(--animation-easing)] motion-safe:[transition-behavior:normal,allow-discrete,normal,allow-discrete]",
        // Backdrop transitions
        "motion-safe:backdrop:transition-[display,overlay,background-color] motion-safe:backdrop:duration-[var(--animation-duration),var(--animation-duration),var(--animation-duration)] motion-safe:backdrop:ease-[linear,linear,linear] motion-safe:backdrop:[transition-behavior:allow-discrete,allow-discrete,normal]",
        // Consumer overrides
        className
      )}
    >
      <div className="relative">{children}</div>
    </dialog>
  )
}
