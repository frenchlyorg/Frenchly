import type { Metadata } from "next";
import { Literata, Be_Vietnam_Pro, Work_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Frenchly",
  description: "Adaptive French learning for high school students",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch auth state server-side to pass to Nav (Pattern 7 from RESEARCH.md)
  // Uses getUser() — verifies against auth server (T-02-10 mitigation)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = data?.username ?? null;
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${literata.variable} ${beVietnamPro.variable} ${workSans.variable}`}
    >
      <body className="font-body">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Nav username={username} />
          <main>{children}</main>
          <footer className="border-t border-outline-variant mt-auto">
            <div className="max-w-[1040px] mx-auto px-5 md:px-6 py-6 flex items-center justify-between">
              <span className="font-heading text-sm text-on-surface-variant">Frenchly</span>
              <span className="font-body text-sm text-on-surface-variant">© 2026</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
