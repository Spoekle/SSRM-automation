import React from 'react';
import { motion } from 'framer-motion';
import { FaScroll, FaMicrophone } from 'react-icons/fa';

const Scripts: React.FC = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.15,
                duration: 0.5,
                ease: "easeOut" as const
            }
        })
    };

    return (
        <div className='w-full min-h-full relative p-4 pt-6 overflow-x-hidden custom-scrollbar'>
            <motion.div
                className='flex flex-col items-center max-w-3xl mx-auto'
                initial="hidden"
                animate="visible"
            >
                <motion.div className='text-center mb-4' variants={fadeIn} custom={0}>
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <FaScroll className="text-teal-500 text-xl" />
                        <h1 className='text-2xl font-bold'>Script Generator</h1>
                    </div>
                    <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
                        Generate voice-over scripts for the Ranked Batch Vidoes!
                    </p>
                </motion.div>

                <motion.div
                    className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-8 rounded-xl shadow-md text-center"
                    variants={fadeIn}
                    custom={1}
                >
                    <h2 className="text-xl font-bold mb-2 text-neutral-800 dark:text-neutral-100">
                        Coming Soon
                    </h2>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default Scripts;
