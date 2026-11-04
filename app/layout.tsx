import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Provenance from "./provenance";

export const metadata: Metadata = {
  title: "Strongo — Community-run services",
  description:
    "Strongo is a community-run resource for neighborhood needs, starting with food delivery without the 30% cut.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Provenance />
      </body>
    </html>
  );
}
