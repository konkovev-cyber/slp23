import { ImgHTMLAttributes, useState } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    fallback?: string;
}

export const OptimizedImage = ({
    src,
    alt,
    fallback = '/placeholder.svg',
    className,
    ...props
}: OptimizedImageProps) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoading(false)}
            onError={() => {
                setImgSrc(fallback);
                setIsLoading(false);
            }}
            style={{
                opacity: isLoading ? 0.5 : 1,
                transition: 'opacity 0.3s ease-in-out',
            }}
            {...props}
        />
    );
};
