import React from 'react';
import { motion } from 'framer-motion';
import { FaScroll } from 'react-icons/fa';
import { ScriptSection } from './components/ScriptSection';

const Scripts: React.FC = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.35,
        ease: "easeOut" as const
      }
    })
  };

  return (
    <div className='w-full min-h-full relative p-4 pt-6 overflow-x-hidden custom-scrollbar'>
      <motion.div
        className='flex flex-col items-center justify-start max-w-4xl mx-auto'
        initial="hidden"
        animate="visible"
      >
        <motion.div className='text-center mb-4' variants={fadeIn} custom={0}>
          <div className="flex items-center justify-center gap-3 mb-1">
            <FaScroll className="text-teal-500 text-xl" />
            <h1 className='text-2xl font-bold'>Script Generator</h1>
          </div>
          <p className='text-sm text-neutral-600 dark:text-neutral-400'>
            Generate voice-over scripts for the Ranked Batch Videos!
          </p>
        </motion.div>

        <ScriptSection fadeIn={fadeIn} />
      </motion.div>
    </div>
  );
};

export default Scripts;
