import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { FavoritesProvider } from "@/lib/wishlist";
import { GA4Script, TrackRouteChanges, ScrollDepthTracker, ConsentProvider, ConsentBannerWrapper } from "@/lib/analytics/client";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "Esmalt'up | Esmaltes e Cuidados para Unhas",
    template: "%s | Esmalt'up",
  },
  description:
    "Kits de manicure completos, peças avulsas e curso preparatório para você montar sua própria assistência de manicure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("esmaltup-theme")==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`,
          }}
        />
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <ConsentProvider>
                <div className="flex min-h-screen flex-col">
                  <GA4Script />
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <TrackRouteChanges />
                <ScrollDepthTracker />
                <ConsentBannerWrapper />
                <CartDrawer />
              </ConsentProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}