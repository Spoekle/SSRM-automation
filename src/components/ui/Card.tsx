import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
    variant?: 'glass' | 'solid' | 'outline';
    header?: React.ReactNode;
    footer?: React.ReactNode;
    padding?: 'sm' | 'md' | 'lg' | 'none';
    children: React.ReactNode;
}

const variantStyles = {
    glass: 'bg-white/50 dark:bg-neutral-800/30 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50',
    solid: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
    outline: 'bg-transparent border border-neutral-200 dark:border-neutral-700',
};

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
    variant = 'glass',
    header,
    footer,
    padding = 'md',
    children,
    className = '',
    ...props
}) => {
    return (
        <motion.div
            className={`
        rounded-xl shadow-sm
        ${variantStyles[variant]}
        ${className}
      `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            {...props}
        >
            {header && (
                <div className="px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-700/50">
                    {header}
                </div>
            )}
            <div className={paddingStyles[padding]}>
                {children}
            </div>
            {footer && (
                <div className="px-4 py-3 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-b-xl">
                    {footer}
                </div>
            )}
        </motion.div>
    );
};

export default Card;
