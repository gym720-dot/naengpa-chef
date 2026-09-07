'use client';

import { useEffect, useState } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export default function AdBanner() {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    const initAd = async () => {
      // Only run on actual native devices, not in web browser
      if (Capacitor.getPlatform() === 'web') return;

      try {
        await AdMob.initialize({
          testingDevices: ['YOUR_TEST_DEVICE_ID'],
        });

        const options: BannerAdOptions = {
          adId: Capacitor.getPlatform() === 'ios' ? 'ca-app-pub-3940256099942544/2934735716' : 'ca-app-pub-3940256099942544/6300978111', // Test IDs
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true,
        };

        await AdMob.showBanner(options);
        setIsAdLoaded(true);
      } catch (err) {
        console.error('AdMob Banner error', err);
      }
    };

    initAd();

    return () => {
      if (Capacitor.getPlatform() !== 'web') {
        AdMob.hideBanner().catch(console.error);
        AdMob.removeBanner().catch(console.error);
      }
    };
  }, []);

  // For web preview or fallback, show a dummy block
  if (Capacitor.getPlatform() !== 'web' && isAdLoaded) {
    return null; // Native banner overlaps automatically
  }

  return (
    <div className="w-full h-[50px] bg-gray-200 flex items-center justify-center border-t border-gray-300">
      <span className="text-gray-500 text-sm font-medium">AdMob Banner (320x50)</span>
    </div>
  );
}
