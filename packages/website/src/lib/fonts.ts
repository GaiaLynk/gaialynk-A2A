import {
  Noto_Sans_SC,
  Noto_Sans_TC,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";

/**
 * 英文展示：Hero / H1–H3
 * Space Grotesk — 几何感科技风，干净的字形比例，无降部溢出问题
 */
export const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

/**
 * 英文正文 / UI：人文主义无衬线，非 Inter/Roboto
 */
export const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: true,
  /** T-6.4：正文 UI 与首屏副标题共用，预加载稳定首屏排版 */
  preload: true,
});

/**
 * 简体中文：Noto Sans SC（思源黑体同源体系）
 * preload: false — 不抢占首屏，swap 避免 FOIT，满足「字体加载不阻塞 FCP」
 */
export const fontNotoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sc",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

/**
 * 繁体中文：Noto Sans TC
 */
export const fontNotoSansTC = Noto_Sans_TC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-tc",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

/** 挂到 <html>，供 CSS var 与 Tailwind 使用 */
export const gaiaFontVariables = [
  fontDisplay.variable,
  fontBody.variable,
  fontNotoSansSC.variable,
  fontNotoSansTC.variable,
].join(" ");
