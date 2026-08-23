import "./globals.css";

export const metadata = {
  title: "Food Copilot",
  description: "Your AI food copilot.",
  applicationName: "Food Copilot",
  appleWebApp: {
    capable: true,
    title: "Food Copilot",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f6f3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}