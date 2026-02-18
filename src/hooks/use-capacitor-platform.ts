import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Хук для определения запуска приложения в нативной платформе (Capacitor APK)
 * @returns true если приложение запущено в нативном приложении (Android/iOS)
 */
export function useCapacitorPlatform(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в нативной платформе
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
  }, []);

  return isNative;
}

/**
 * Утилита для проверки запуска в нативном приложении
 * Может использоваться вне React компонентов
 */
export const isCapacitorNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Получение платформы на которой запущено приложение
 * @returns 'android' | 'ios' | 'web' | null
 */
export const getCapacitorPlatform = (): 'android' | 'ios' | 'web' | null => {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as 'android' | 'ios';
  }
  return 'web';
};
