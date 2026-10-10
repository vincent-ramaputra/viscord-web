"use client"

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth.context";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AudioManager from "@/components/audio-manager/audio-manager";
import { useAppSettingsStore } from "./stores/app-settings-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const queryClient = new QueryClient();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  const handleDeviceChange = async () => {
    const mediaSettings = useAppSettingsStore.getState().mediaSettings;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputDevices = devices.filter(d => d.kind == 'audiooutput');
    const inputDevices = devices.filter(d => d.kind == 'audioinput');
    if (!inputDevices.some(d => d.deviceId === mediaSettings.audioInputDeviceId)) {
      const fallback = inputDevices.find(d => d.deviceId !== 'communications') ?? inputDevices[0];
      if (fallback) useAppSettingsStore.getState().setAudioInputDevice(fallback.deviceId);
    }
    if (!outputDevices.some(d => d.deviceId === mediaSettings.audioOutputDeviceId)) {
      const fallback = outputDevices.find(d => d.deviceId !== 'communications') ?? outputDevices[0];
      if (fallback) useAppSettingsStore.getState().setAudioOutputDevice(fallback.deviceId);
    }
  }

  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [])

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden bg-[var(--background-primary)]`}
      >
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
          <AudioManager />
        </AuthProvider>
      </body>
    </html>
  );
}
