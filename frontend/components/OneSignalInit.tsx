'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '79c845e7-3e31-4639-ab96-3b0abf909c78';

export default function OneSignalInit() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: 'web.onesignal.auto.54eebb47-16d1-4f2f-8c9e-9bb7522bb051',
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
        });

        // Prompt user for notification permissions smoothly
        if (OneSignal.Notifications && OneSignal.Notifications.permission !== true) {
          // Trigger the standard soft prompt or request
          OneSignal.Slidedown?.promptPush();
        }
      } catch (err) {
        console.warn('[OneSignal Init Error]', err);
      }
    });
  }, []);

  // Sync user login state with OneSignal external_id
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        if (isAuthenticated && user?.username) {
          await OneSignal.login(user.username);
        } else if (!isAuthenticated) {
          await OneSignal.logout();
        }
      } catch (err) {
        console.warn('[OneSignal User Sync Error]', err);
      }
    });
  }, [isAuthenticated, user?.username]);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
