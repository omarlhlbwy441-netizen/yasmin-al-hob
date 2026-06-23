import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ياسمين دارك تكنولوجي - Yasmin Dark Tech",
    description: "منصة بناء المشاريع البرمجية بالذكاء الاصطناعي - 500+ وكيل برمجي",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body className="font-arabic bg-marble min-h-screen text-white overflow-x-hidden">
                {children}
            </body>
        </html>
    );
}
