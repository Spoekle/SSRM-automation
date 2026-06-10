import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
    checked?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    size?: 'small' | 'medium';
    className?: string;
    id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
    checked = false,
    onChange,
    disabled = false,
    size = 'medium',
    className = '',
    id,
}) => {
    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        if (onChange) {
            const simulatedEvent = {
                target: {
                    checked: !checked,
                    type: 'checkbox',
                    name: id || '',
                    id: id || '',
                },
                currentTarget: {
                    checked: !checked,
                    type: 'checkbox',
                },
                preventDefault: () => {},
                stopPropagation: () => {},
                persist: () => {},
                nativeEvent: new Event('change'),
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onChange(simulatedEvent);
        }
    };

    const isSmall = size === 'small';

    const trackWidth = isSmall ? 'w-8' : 'w-11';
    const trackHeight = isSmall ? 'h-[18px]' : 'h-6';
    const trackPadding = 'p-[2px]';
    
    const thumbSize = isSmall ? 'w-3.5 h-3.5' : 'w-5 h-5';
    const xTranslate = checked 
        ? (isSmall ? 14 : 20) 
        : 0;

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={handleToggle}
            className={`
                relative inline-flex items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900
                ${checked ? 'bg-blue-500 hover:bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-450 dark:hover:bg-neutral-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${trackWidth} ${trackHeight} ${trackPadding}
                ${className}
            `}
            id={id}
        >
            <motion.span
                animate={{ x: xTranslate }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`
                    block rounded-full bg-white shadow-md
                    ${thumbSize}
                `}
            />
            
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => {}}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
            />
        </button>
    );
};

export default Switch;
