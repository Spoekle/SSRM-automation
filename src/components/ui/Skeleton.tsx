import React from 'react';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    className?: string;
    animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
    animate = true,
}) => {
    const variantStyles = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {
        width: width ?? (variant === 'circular' ? height : '100%'),
        height: height ?? (variant === 'text' ? undefined : '100%'),
    };

    return (
        <div
            className={`
        bg-neutral-200 dark:bg-neutral-700
        ${animate ? 'animate-pulse' : ''}
        ${variantStyles[variant]}
        ${className}
      `}
            style={style}
        />
    );
};

// Pre-built skeleton compositions
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 bg-white/50 dark:bg-neutral-800/30 ${className}`}>
        <Skeleton variant="rectangular" height={120} className="mb-4" />
        <Skeleton width="60%" className="mb-2" />
        <Skeleton width="80%" className="mb-2" />
        <Skeleton width="40%" />
    </div>
);

export const SkeletonListItem: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
            <Skeleton width="50%" className="mb-2" />
            <Skeleton width="30%" />
        </div>
    </div>
);

export default Skeleton;
