import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует размер файла в читаемый формат
 * @param bytes Размер файла в байтах
 * @returns Строка с форматированным размером (например: "2.4 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Форматирует дату в локальный формат
 * @param dateString Строка даты в формате ISO
 * @returns Строка с форматированной датой (например: "10.02.2026")
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Форматирует дату и время в локальный формат
 * @param dateString Строка даты в формате ISO
 * @returns Строка с форматированной датой и временем (например: "10.02.2026, 14:30")
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Получает расширение файла из имени
 * @param filename Имя файла
 * @returns Расширение файла в верхнем регистре (например: "JPG")
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop();
  return ext ? ext.toUpperCase() : "FILE";
}

/**
 * Проверяет, является ли файл изображением
 * @param filename Имя файла
 * @returns true, если файл является изображением
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
}

/**
 * Копирует текст в буфер обмена
 * @param text Текст для копирования
 * @returns Promise, который разрешается при успешном копировании
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Скачивает файл по URL
 * @param url URL файла
 * @param filename Имя файла для сохранения
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
