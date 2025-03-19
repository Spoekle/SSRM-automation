import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaLayerGroup, FaImage, FaArrowRight } from 'react-icons/fa';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.3,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

function Home() {
  const features = [
    {
      name: "Titles",
      path: "/titles",
      desc: "Generate titles & descriptions",
      icon: <FaFileAlt className="text-blue-500 text-3xl mb-2" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Map Cards",
      path: "/mapcards",
      desc: "Create custom map cards",
      icon: <FaLayerGroup className="text-purple-500 text-3xl mb-2" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Thumbnails",
      path: "/thumbnails",
      desc: "Design video thumbnails",
      icon: <FaImage className="text-green-500 text-3xl mb-2" />,
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className='max-h-96 h-96 grid justify-items-center dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-8 justify-center items-center'>
      <motion.div
        className='items-center justify-items-center'
        initial="hidden"
        animate="visible"
      >
        <div className='text-center'>
          <motion.h1
            className='text-3xl font-bold'
            variants={fadeIn}
            custom={0}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            SSRM Automation Tool
          </motion.h1>

          <motion.p
            className='text-xl mt-4 text-neutral-700 dark:text-neutral-300'
            variants={fadeIn}
            custom={1}
          >
            Generate everything that is needed for a BeatSaber Video!
          </motion.p>

          <motion.div
            className="mt-10 grid grid-cols-3 gap-4"
            variants={fadeIn}
            custom={2}
          >
            {features.map((item, i) => (
              <Link to={item.path} key={item.name}>
                <motion.div
                  className="relative p-6 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Background gradient that animates on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 rounded-xl transition-opacity duration-300`}
                  />

                  <div className="flex flex-col items-center text-center relative z-10">
                    {item.icon}
                    <h3 className="font-bold text-lg mb-2 text-neutral-900 dark:text-neutral-100">{item.name}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{item.desc}</p>

                    <motion.div
                      className="mt-2 flex items-center text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      <span className="mr-1">Get started</span>
                      <FaArrowRight size={14} />
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;
