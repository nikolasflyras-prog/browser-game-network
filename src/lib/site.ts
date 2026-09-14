export const SITE_NAME = "Browser Game Network";
export const SITE_DESCRIPTION = "Fast browser games and interactive learning simulations you can play without an account.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://browser-game-network.vercel.app";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
