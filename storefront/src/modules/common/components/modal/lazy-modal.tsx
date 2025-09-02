"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import Spinner from "@modules/common/icons/spinner"

// Lazy load modal for better performance
const Modal = dynamic(() => import("./index"), {
  loading: () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Spinner />
    </div>
  ),
})

export default Modal