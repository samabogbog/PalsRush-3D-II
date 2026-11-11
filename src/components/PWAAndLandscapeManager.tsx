import React, { useEffect, useState, useCallback } from 'react';
import { Download, Smartphone, Maximize2, CheckCircle2, X, Share } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let swRegistered = false;
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((fn) => fn());
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (!swRegistered && typeof window !== 'undefined') {
      swRegistered = true;
      try {
        registerSW({ immediate: true });
      } catch {
        // ignore SW registration errors in restricted frames
      }
    }

    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setIsInstalled(standalone);
    };
    checkStandalone();

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const syncPrompt = () => {
      setDeferredPrompt(globalDeferredPrompt);
      checkStandalone();
    };
    promptListeners.add(syncPrompt);
    return () => {
      promptListeners.delete(syncPrompt);
    };
  }, []);

  const triggerNativeInstall = useCallback(async (): Promise<boolean> => {
    if (!globalDeferredPrompt) return false;
    try {
      await globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        setIsInstalled(true);
        return true;
      }
    } catch {
      // ignore prompt error
    }
    return false;
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    triggerNativeInstall,
  };
}

export async function requestLandscapeFullscreen(): Promise<boolean> {
  const docEl = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  try {
    if (!document.fullscreenElement) {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
    }
    const orientationAny = screen.orientation as unknown as {
      lock?: (mode: string) => Promise<void>;
    };
    if (orientationAny && typeof orientationAny.lock === 'function') {
      await orientationAny.lock('landscape').catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

export const PWAInstallButton: React.FC<{
  compact?: boolean;
}> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, triggerNativeInstall } =
    usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await triggerNativeInstall();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        data-testid="pwa-install-btn"
        title="Install BlockyPals 3D App to Home Screen"
        className={`rounded-xl border-2 border-[#1A130D] bg-gradient-to-b from-[#38BDF8] to-[#0284C7] hover:from-[#7DD3FC] hover:to-[#0369A1] text-white active:scale-95 transition-transform flex items-center justify-center gap-1.5 font-black shadow-md shrink-0 cursor-pointer ${
          compact
            ? 'h-8 px-2.5 text-[10px]'
            : 'h-8 sm:h-9 px-2.5 sm:px-3.5 text-[10px] sm:text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 text-[#FDE047] shrink-0" />
        <span className="tracking-wide uppercase">INSTALL APP</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Install BlockyPals 3D PWA"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#FAF3E8] border-4 border-[#2B2118] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#2B2118] text-[#FFFDF9] px-4 py-3 flex items-center justify-between border-b-4 border-[#1A130D]">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="BlockyPals App Icon"
                  className="w-9 h-9 rounded-xl border-2 border-[#FDE047]"
                />
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#FDE047] uppercase leading-tight">
                    INSTALL BLOCKYPALS 3D
                  </h2>
                  <p className="text-[10px] font-bold text-[#D8C5AC]">
                    Play Fullscreen in Landscape from your Home Screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-xl bg-[#423326] hover:bg-[#EF4444] text-white border-2 border-[#1A130D] flex items-center justify-center font-black"
                aria-label="Close Install Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-[#2B2118]">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await triggerNativeInstall();
                    if (ok) setShowGuideModal(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#2B2118] font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  <span>INSTALL TO DEVICE NOW</span>
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#FFFDF9] border-2 border-[#2B2118] rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 font-black text-[#0284C7] uppercase text-[11px]">
                    <Share className="w-3.5 h-3.5" />
                    <span>{isIOS ? 'iPhone / iPad (Safari)' : 'iOS Safari'}</span>
                  </div>
                  <ol className="mt-1.5 space-y-1 text-[11px] font-bold text-[#5C4938] list-decimal list-inside">
                    <li>
                      Tap <strong>Share</strong> in the browser bar.
                    </li>
                    <li>
                      Tap <strong>Add to Home Screen</strong>.
                    </li>
                    <li>Launch in Fullscreen Landscape!</li>
                  </ol>
                </div>

                <div className="bg-[#FFFDF9] border-2 border-[#2B2118] rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 font-black text-[#65A30D] uppercase text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Android / Chrome / Edge</span>
                  </div>
                  <ol className="mt-1.5 space-y-1 text-[11px] font-bold text-[#5C4938] list-decimal list-inside">
                    <li>
                      Tap browser menu <strong>(⋮)</strong> or address bar icon.
                    </li>
                    <li>
                      Tap <strong>Install App</strong> or{' '}
                      <strong>Add to Home Screen</strong>.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await requestLandscapeFullscreen();
                    setShowGuideModal(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] text-[#2B2118] border-2 border-[#2B2118] font-black text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-transform"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>FULLSCREEN LANDSCAPE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="py-2 px-4 rounded-xl bg-[#2B2118] text-[#FFFDF9] border-2 border-[#1A130D] font-black text-xs active:scale-95 transition-transform"
                >
                  GOT IT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Enforces non-zoomable mobile touch behavior across the document and
 * displays a dedicated Landscape Enforcement Gate when a mobile device is held vertically.
 */
export const MobileViewportAndLandscapeGuard: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);
  const [bypassPortraitGate, setBypassPortraitGate] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const portrait = h > w && w < 768;
      setIsPortraitMobile(portrait);
      if (!portrait) {
        setBypassPortraitGate(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Block pinch-to-zoom & multi-touch browser zoom on iOS/Android/Desktop
    const preventZoomGesture = (e: Event) => {
      e.preventDefault();
    };
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const preventMultiTouchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // Allow multi-touch on game HUD buttons/joystick, but prevent browser page pinch-zoom
        const target = e.target as HTMLElement | null;
        if (
          !target?.closest('[data-testid]') &&
          !target?.closest('button') &&
          !target?.closest('canvas')
        ) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('gesturestart', preventZoomGesture, {
      passive: false,
    });
    document.addEventListener('gesturechange', preventZoomGesture, {
      passive: false,
    });
    document.addEventListener('gestureend', preventZoomGesture, {
      passive: false,
    });
    window.addEventListener('wheel', preventWheelZoom, { passive: false });
    document.addEventListener('touchmove', preventMultiTouchZoom, {
      passive: false,
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      document.removeEventListener('gesturestart', preventZoomGesture);
      document.removeEventListener('gesturechange', preventZoomGesture);
      document.removeEventListener('gestureend', preventZoomGesture);
      window.removeEventListener('wheel', preventWheelZoom);
      document.removeEventListener('touchmove', preventMultiTouchZoom);
    };
  }, []);

  if (!isPortraitMobile || bypassPortraitGate) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#2B2118] text-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
      data-testid="landscape-enforcement-gate"
    >
      {/* Decorative Background Glow */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#38BDF8]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-[#84CC16]/15 blur-3xl" />

      <div className="relative w-full max-w-xs bg-[#3A2C20] border-4 border-[#FDE047] rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-3.5">
        <div className="w-16 h-16 rounded-2xl bg-[#2B2118] border-3 border-[#84CC16] flex items-center justify-center shadow-lg">
          <Smartphone className="w-9 h-9 text-[#FDE047] rotate-90 transition-transform duration-500" />
        </div>

        <div>
          <span className="px-2.5 py-0.5 rounded-md bg-[#84CC16] text-[#2B2118] text-[10px] font-black uppercase tracking-wider">
            ARCADE CONSOLE MODE
          </span>
          <h2 className="mt-2 text-xl font-black text-[#FDE047] uppercase tracking-wide leading-tight">
            ROTATE TO LANDSCAPE
          </h2>
          <p className="mt-1 text-xs font-bold text-[#E5D9C5] leading-relaxed">
            BlockyPals 3D is designed for horizontal Widescreen Arcade play.
            Rotate your device or tap below to lock Landscape!
          </p>
        </div>

        <button
          type="button"
          data-testid="lock-landscape-play-btn"
          onClick={async () => {
            await requestLandscapeFullscreen();
            setBypassPortraitGate(true);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-[#84CC16] hover:bg-[#A3E635] text-[#2B2118] border-3 border-[#1A130D] font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
        >
          <Maximize2 className="w-4 h-4" />
          <span>LOCK LANDSCAPE & PLAY</span>
        </button>

        <div className="w-full flex items-center justify-center gap-2 pt-1">
          <PWAInstallButton />
          <button
            type="button"
            data-testid="dismiss-landscape-gate-btn"
            onClick={() => setBypassPortraitGate(true)}
            className="h-8 sm:h-9 px-3 rounded-xl bg-[#2B2118] hover:bg-[#423326] text-[#D8C5AC] border-2 border-[#1A130D] text-[10px] font-black uppercase active:scale-95 transition-transform"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};
