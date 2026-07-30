import type { Metadata } from "next"
import { Rubik } from "next/font/google"
import "./globals.css"
import { IOSPullToRefresh } from "@/shared/components/IOSPullToRefresh"

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500"]
})

export const metadata: Metadata = {
  title: "Put It On The List",
  description: "Collaborative shopping list manager",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PutItOnTheList",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "152x152" }],
    other: [{ rel: "mask-icon", url: "/favicons/safari-pinned-tab.svg", color: "#5bbad5" }]
  },
  other: {
    "msapplication-TileColor": "#da532c",
    "msapplication-config": "/favicons/browserconfig.xml"
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${rubik.variable} antialiased `}>
      <body className="min-h-full flex flex-col">
        <IOSPullToRefresh />
        {children}
      </body>
    </html>
  )
}
