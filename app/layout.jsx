import "./globals.css";

export const metadata = {
  title: "Conn AI",
  description: "Take a photo. Know your food."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}