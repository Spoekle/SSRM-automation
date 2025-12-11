import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaDiscord } from 'react-icons/fa';

interface CreditsSectionProps {
    sectionVariants: any;
}

const CreditsSection: React.FC<CreditsSectionProps> = ({ sectionVariants }) => {
    return (
        <motion.section
            className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={7}
        >
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">
                Credits & Links
            </h3>
            <div className="flex items-center justify-between">
                <motion.div className="flex items-center space-x-4">
                    <motion.button
                        className="rounded-lg"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95, rotate: -10 }}
                        onClick={() =>
                            window.open(
                                'https://github.com/Spoekle/SSRM-automation',
                                '_blank'
                            )
                        }
                        title="View on GitHub"
                    >
                        <FaGithub size={32} />
                    </motion.button>
                    <motion.button
                        className="rounded-lg"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95, rotate: -10 }}
                        onClick={() =>
                            window.open(
                                'https://github.com/Spoekle/SSRM-automation',
                                '_blank'
                            )
                        }
                        title="ScoreSaber Discord"
                    >
                        <FaDiscord size={32} />
                    </motion.button>
                </motion.div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4 md:mb-0">
                    © {new Date().getFullYear()} Spoekle. All rights reserved.
                </p>
            </div>
        </motion.section>
    );
};

export default CreditsSection;
