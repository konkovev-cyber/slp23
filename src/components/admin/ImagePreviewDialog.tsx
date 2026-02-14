import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    X,
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    ExternalLink,
    Trash2,
    Check,
    Calendar,
    HardDrive,
    Tag,
    Maximize2,
    Minimize2
} from "lucide-react";
import { formatFileSize, formatDate, getFileExtension, copyToClipboard, downloadFile } from "@/lib/utils";

export type StorageEntry = {
    name: string;
    id: string | null;
    metadata: Record<string, any> | null;
    updated_at: string | null;
    created_at: string | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: Array<{ file: StorageEntry; url: string; bucket: string }>;
    currentIndex: number;
    onIndexChange: (index: number) => void;
    onDelete?: (name: string) => void;
};

export default function ImagePreviewDialog({
    open,
    onOpenChange,
    files,
    currentIndex,
    onIndexChange,
    onDelete,
}: Props) {
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const currentFile = files[currentIndex];
    const hasMultipleFiles = files.length > 1;

    useEffect(() => {
        setImageError(false);
    }, [currentIndex]);

    const handleCopyUrl = async () => {
        if (!currentFile) return;
        const success = await copyToClipboard(currentFile.url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!currentFile) return;
        downloadFile(currentFile.url, currentFile.file.name);
    };

    const handleDelete = () => {
        if (!currentFile) return;
        if (confirm(`Удалить файл "${currentFile.file.name}"?`)) {
            onDelete?.(currentFile.file.name);
        }
    };

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            onIndexChange(currentIndex - 1);
        }
    }, [currentIndex, onIndexChange]);

    const goToNext = useCallback(() => {
        if (currentIndex < files.length - 1) {
            onIndexChange(currentIndex + 1);
        }
    }, [currentIndex, files.length, onIndexChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!open) return;

        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                goToPrevious();
                break;
            case "ArrowRight":
                e.preventDefault();
                goToNext();
                break;
            case "Escape":
                e.preventDefault();
                onOpenChange(false);
                break;
        }
    }, [open, goToPrevious, goToNext, onOpenChange]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!currentFile) return null;

    const fileSize = currentFile.file.metadata?.size || 0;
    const fileExt = getFileExtension(currentFile.file.name);
    const createdAt = formatDate(currentFile.file.created_at);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`
          p-0 overflow-hidden max-w-[95vw] w-full
          ${isFullscreen ? "h-screen max-h-screen rounded-none" : "max-h-[90vh]"}
        `}
            >
                {/* Header */}
                <DialogHeader className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-white text-lg font-semibold truncate flex-1 mr-4" title={currentFile.file.name}>
                            {currentFile.file.name}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                        >
                                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Закрыть (Esc)</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </DialogHeader>

                {/* Image Container */}
                <div className="relative flex items-center justify-center bg-black/95 min-h-[400px]">
                    {/* Previous Button */}
                    {hasMultipleFiles && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 text-white hover:bg-white/20 disabled:opacity-30"
                                        onClick={goToPrevious}
                                        disabled={currentIndex === 0}
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Предыдущее изображение (←)</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Image */}
                    <div className="relative max-w-full max-h-full p-4">
                        {!imageError ? (
                            <img
                                src={currentFile.url}
                                alt={currentFile.file.name}
                                className="max-w-full max-h-[calc(90vh-140px)] object-contain"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-white/50">
                                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4">
                                    <span className="text-4xl">🖼️</span>
                                </div>
                                <p className="text-lg">Не удалось загрузить изображение</p>
                            </div>
                        )}
                    </div>

                    {/* Next Button */}
                    {hasMultipleFiles && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 text-white hover:bg-white/20 disabled:opacity-30"
                                        onClick={goToNext}
                                        disabled={currentIndex === files.length - 1}
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Следующее изображение (→)</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Navigation Dots */}
                    {hasMultipleFiles && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                            {files.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`
                    w-2 h-2 rounded-full transition-all
                    ${idx === currentIndex ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"}
                  `}
                                    onClick={() => onIndexChange(idx)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* File Info */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20 gap-1.5">
                                <Tag className="w-3 h-3" />
                                {fileExt}
                            </Badge>
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20 gap-1.5">
                                <HardDrive className="w-3 h-3" />
                                {formatFileSize(fileSize)}
                            </Badge>
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20 gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {createdAt}
                            </Badge>
                            {hasMultipleFiles && (
                                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                                    {currentIndex + 1} / {files.length}
                                </Badge>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/20"
                                            onClick={handleCopyUrl}
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? "Скопировано" : "Копировать"}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Копировать URL в буфер обмена</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/20"
                                            onClick={handleDownload}
                                        >
                                            <Download className="w-4 h-4" />
                                            Скачать
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Скачать файл на устройство</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            className="h-9 w-9 bg-white/20 hover:bg-white/30 text-white border-white/20"
                                            asChild
                                        >
                                            <a href={currentFile.url} target="_blank" rel="noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Открыть в новой вкладке</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {onDelete && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-9 w-9"
                                                onClick={handleDelete}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Удалить файл</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
