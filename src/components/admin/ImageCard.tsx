import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    FileImage,
    ExternalLink,
    Trash2,
    Copy,
    Download,
    Eye,
    Check,
    Calendar,
    HardDrive,
    Tag
} from "lucide-react";
import { formatFileSize, formatDate, getFileExtension, copyToClipboard, downloadFile, cn } from "@/lib/utils";

export type StorageEntry = {
    name: string;
    id: string | null;
    metadata: Record<string, any> | null;
    updated_at: string | null;
    created_at: string | null;
};

type Props = {
    file: StorageEntry;
    url: string;
    bucket: string;
    isSelected?: boolean;
    onSelectChange?: (selected: boolean) => void;
    onDelete: (name: string) => void;
    onPreview?: (file: StorageEntry, url: string) => void;
};

export default function ImageCard({
    file,
    url,
    bucket,
    isSelected = false,
    onSelectChange,
    onDelete,
    onPreview
}: Props) {
    const [copied, setCopied] = useState(false);
    const [imageError, setImageError] = useState(false);

    const fileSize = file.metadata?.size || 0;
    const fileExt = getFileExtension(file.name);
    const createdAt = formatDate(file.created_at);

    const handleCopyUrl = async () => {
        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        downloadFile(url, file.name);
    };

    const handleDelete = () => {
        if (confirm(`Удалить файл "${file.name}"?`)) {
            onDelete(file.name);
        }
    };

    return (
        <Card className={`
            group relative overflow-hidden transition-all duration-300 border-none shadow-sm
            ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-[0.98]" : "hover:shadow-xl hover:translate-y-[-4px]"}
            bg-card
        `}>
            {/* Selection Overlay */}
            <div className={cn(
                "absolute inset-0 bg-primary/10 z-[1] transition-opacity pointer-events-none",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-40"
            )} />

            {/* Checkbox for selection */}
            <div className="absolute top-2 left-2 z-20">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectChange?.(checked === true)}
                    className="bg-background/90 backdrop-blur-md border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-sm"
                />
            </div>

            {/* Badges on Image */}
            <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold bg-background/80 backdrop-blur-md border-none text-foreground/80">
                    {fileExt}
                </Badge>
                <Badge className="text-[9px] h-4 px-1.5 font-bold bg-primary/80 backdrop-blur-md border-none text-primary-foreground">
                    {formatFileSize(fileSize)}
                </Badge>
            </div>

            {/* Image Preview */}
            <div
                className="relative aspect-square bg-muted overflow-hidden cursor-pointer"
                onClick={() => onPreview?.(file, url)}
            >
                {!imageError ? (
                    <img
                        src={url}
                        alt={file.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-muted/50 p-4 text-center">
                        <FileImage className="w-10 h-10 text-muted-foreground/20 mb-2" />
                        <span className="text-[10px] text-muted-foreground/60 break-all line-clamp-2">{file.name}</span>
                    </div>
                )}

                {/* Hover Actions Bar */}
                <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-md hover:bg-primary hover:text-primary-foreground shadow-lg border-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPreview?.(file, url);
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Предпросмотр</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-md hover:bg-primary hover:text-primary-foreground shadow-lg border-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyUrl();
                                    }}
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Копировать ссылку</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-md hover:bg-destructive hover:text-destructive-foreground shadow-lg border-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Удалить</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Small Footer / Info */}
            <div className="p-2 bg-card">
                <div className="text-[11px] font-semibold text-foreground truncate px-1" title={file.name}>
                    {file.name}
                </div>
                <div className="flex items-center justify-between px-1 mt-0.5">
                    <span className="text-[9px] text-muted-foreground">{createdAt}</span>
                    {/* Tiny link icon for direct open */}
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                </div>
            </div>
        </Card>
    );
}
