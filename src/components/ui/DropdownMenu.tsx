import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

interface DropdownItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

interface DropdownMenuProps {
    label: string;
    icon: React.ReactNode;
    items: DropdownItem[];
    activeColor?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
    label,
    icon,
    items,
    activeColor = 'blue',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check if any child route is active
    const isChildActive = items.some((item) => location.pathname === item.path);

    // Color mapping for active states
    const colorMap: Record<string, { bg: string; text: string; shadow: string; hover: string }> = {
        blue: { bg: 'bg-blue-500', text: 'text-blue-500', shadow: 'shadow-blue-500/25', hover: 'hover:text-blue-500' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-500', shadow: 'shadow-purple-500/25', hover: 'hover:text-purple-500' },
        yellow: { bg: 'bg-yellow-500', text: 'text-yellow-500', shadow: 'shadow-yellow-500/25', hover: 'hover:text-yellow-500' },
        amber: { bg: 'bg-amber-500', text: 'text-amber-500', shadow: 'shadow-amber-500/25', hover: 'hover:text-amber-500' },
    };

    const colors = colorMap[activeColor] || colorMap.blue;

    // Handle mouse events with delay for smoother UX
    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 150);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Trigger Button */}
            <motion.button
                className={`p-2 px-4 rounded-full flex items-center gap-1.5 transition-all duration-200 ${isChildActive
                    ? `${colors.bg} text-white shadow-lg ${colors.shadow}`
                    : `text-neutral-600 dark:text-neutral-400 ${colors.hover} dark:${colors.hover} hover:bg-white/50 dark:hover:bg-neutral-700/50`
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {icon}
                <span className="font-medium">{label}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <FaChevronDown size={10} />
                </motion.span>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-2 min-w-[130px] z-[100]"
                    >
                        <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50">
                            {items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div
                                            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm transition-all duration-150 first:rounded-t-xl last:rounded-b-xl ${isActive
                                                ? `${colors.bg} text-white`
                                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                                                }`}
                                        >
                                            <span className="text-base">{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DropdownMenu;

