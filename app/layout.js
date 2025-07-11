import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({subsets:["latin"]});

export const metadata = {
  title: "Wise Money",
  description: "The smartest way to split expenses with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className}`}
      >
        <ClerkProvider dynamic>
        <ConvexClientProvider>
        <Header/>
        <main className="min-h-screen">{children}
          <Toaster richColors/>
        </main>
        </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}