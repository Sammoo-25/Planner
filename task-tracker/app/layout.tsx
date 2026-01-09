import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Level Up Task Tracker",
  description: "Gamify your productivity",
};

import { FocusProvider } from "@/context/FocusContext";
import { TaskProvider } from "@/context/TaskContext";
import { GamificationProvider } from "@/context/GamificationContext";
import { GlobalFocusSystem } from "@/components/dashboard/global-focus-system";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TaskProvider>
              <GamificationProvider>
                <FocusProvider>
                  {children}
                  <GlobalFocusSystem />
                </FocusProvider>
              </GamificationProvider>
            </TaskProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
