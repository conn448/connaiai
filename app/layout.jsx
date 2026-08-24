import "./globals.css";

export const metadata = {
  title: "Conn AI — Photo your food",
  description: "Take a photo of your food and understand what is inside.",
  appleWebApp: { capable: true, title: "Conn AI" }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f7f2"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-paper">
      <body>{children}</body>
    </html>
  );
}
