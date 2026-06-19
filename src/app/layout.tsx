import type { Metadata, Viewport } from "next"
import { Rubik } from "next/font/google"
import "./globals.css"

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500"]
})

export const metadata: Metadata = {
  title: "Put It On The List",
  description: "Collaborative shopping list manager",
  manifest: "/site.webmanifest",
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

export const viewport: Viewport = {
  themeColor: "#ffffff"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${rubik.variable} h-full antialiased scrollbar-gutter-stable`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
