import React from 'react';
import { motion } from 'framer-motion';
import Switch from '@mui/material/Switch';

interface BranchSectionProps {
    isDevMode: boolean;
    toggleBranch: () => void;
    sectionVariants: any;
}

const BranchSection: React.FC<BranchSectionProps> = ({
    isDevMode,
    toggleBranch,
    sectionVariants,
}) => {
    return (
        <motion.section
            className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={5}
        >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                Branch Settings
            </h3>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Use Development Branch</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Receive pre-release updates with new features
                    </p>
                </div>
                <Switch checked={isDevMode} onChange={toggleBranch} size="small" />
            </div>
        </motion.section>
    );
};

export default BranchSection;
