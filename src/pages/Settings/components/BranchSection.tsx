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
            className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={5}
        >
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">
                Branch Settings
            </h3>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Use Development Branch</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Receive pre-release updates with new features
                    </p>
                </div>
                <Switch checked={isDevMode} onChange={toggleBranch} />
            </div>
        </motion.section>
    );
};

export default BranchSection;
