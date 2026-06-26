import {
  type AriaAttributes,
  DialogHTMLAttributes,
  type PropsWithChildren,
  type Ref,
  type SyntheticEvent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react"
import { cn } from "../lib/cn"

type ModalDialogIsOpenProps =
  | {
      isOpen: boolean
      setIsOpen: (value: boolean) => void
    }
  | {
      isOpen?: never
      setIsOpen?: never
    }

export type ModalDialogProps = PropsWithChildren &
  DialogHTMLAttributes<HTMLDialogElement> &
  ModalDialogIsOpenProps &
  Pick<AriaAttributes, "aria-labelledby" | "aria-label" | "aria-describedby"> & {
    ref?: Ref<ModalDialogRef>
    shouldLightDismiss?: boolean
    initialOpen?: boolean
    onClose?: (event?: SyntheticEvent) => void
    isScrolledBottom?: boolean
  }

export interface ModalDialogRef extends Pick<HTMLDialogElement, "addEventListener" | "removeEventListener" | "close" | "showModal"> {
  isOpen: () => boolean
}

function safelyOpenDialogAsModal(dialog: HTMLDialogElement | null) {
  if (dialog && !dialog.open) {
    dialog.showModal()
  }
}

export const ModalDialog = function ({
  shouldLightDismiss = true,
  initialOpen = false,
  isOpen: controlledOpen,
  setIsOpen: setControlledOpen,
  children,
  className,
  ref,
  isScrolledBottom,
  ...props
}: ModalDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const isOpen = controlledOpen ?? uncontrolledOpen
  const setIsOpen = setControlledOpen ?? setUncontrolledOpen

  useEffect(() => {
    const dialog = dialogRef.current

    if (isOpen) {
      safelyOpenDialogAsModal(dialog)
    } else {
      dialog?.close()
    }

    return () => {
      dialog?.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current

    function handleClose(event: Event | KeyboardEvent) {
      event.preventDefault()
      event.stopPropagation()
      setIsOpen(false)
    }

    function lightDismiss(event: MouseEvent) {
      const { target } = event
      if (target instanceof Element && target.nodeName === "DIALOG") {
        const rect = target.getBoundingClientRect()

        const clickedOutsideDialog =
          rect.top > event.clientY || event.clientY > rect.bottom || rect.left > event.clientX || event.clientX > rect.right

        if (clickedOutsideDialog) {
          handleClose(event)
        }
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.code === "Escape") {
        handleClose(event)
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
  }, [shouldLightDismiss, setIsOpen])

  useImperativeHandle(ref, () => {
    return {
      close() {
        setIsOpen(false)
      },
      showModal() {
        setIsOpen(true)
      },
      isOpen() {
        return isOpen
      },
      addEventListener(name: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        dialogRef.current?.addEventListener(name, callback, options)
      },
      removeEventListener(name: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        dialogRef.current?.removeEventListener(name, callback, options)
      }
    }
  }, [isOpen, setIsOpen])

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
