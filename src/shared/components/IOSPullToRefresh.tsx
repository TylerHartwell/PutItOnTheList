"use client"

import { useEffect } from "react"

const TOP_EDGE_PX = 36
const TRIGGER_DISTANCE_PX = 90
const MAX_HORIZONTAL_DELTA_PX = 32

function isIOSDevice() {
  if (typeof navigator === "undefined") {
    return false
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function IOSPullToRefresh() {
  useEffect(() => {
    if (typeof window === "undefined" || !isIOSDevice()) {
      return
    }

    let startY = 0
    let startX = 0
    let canTrigger = false
    let hasTriggered = false

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        canTrigger = false
        return
      }

      const touch = event.touches[0]
      startY = touch.clientY
      startX = touch.clientX
      hasTriggered = false

      // Restrict to top-edge drags while the viewport is already at the top.
      canTrigger = window.scrollY <= 0 && startY <= TOP_EDGE_PX
    }

    function handleTouchMove(event: TouchEvent) {
      if (!canTrigger || hasTriggered || event.touches.length !== 1) {
        return
      }

      const touch = event.touches[0]
      const deltaY = touch.clientY - startY
      const deltaX = Math.abs(touch.clientX - startX)

      if (deltaX > MAX_HORIZONTAL_DELTA_PX) {
        canTrigger = false
        return
      }

      if (deltaY >= TRIGGER_DISTANCE_PX) {
        hasTriggered = true
        window.location.reload()
      }
    }

    function resetGesture() {
      canTrigger = false
      hasTriggered = false
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", resetGesture, { passive: true })
    window.addEventListener("touchcancel", resetGesture, { passive: true })

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", resetGesture)
      window.removeEventListener("touchcancel", resetGesture)
    }
  }, [])

  return null
}
