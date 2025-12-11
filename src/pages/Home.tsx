import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaLayerGroup, FaImage, FaArrowRight, FaList } from 'react-icons/fa';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.3,
      duration: 0.5,
      ease: "easeOut" as const
    }
  })
};

function Home() {
  const features = [
    {
      name: "Titles",
      path: "/titles",
      desc: "Generate titles & descriptions",
      icon: <FaFileAlt className="text-3xl" />,
      color: "from-blue-500 to-cyan-500",
      iconColor: "text-blue-500"
    },
    {
      name: "Map Cards",
      path: "/mapcards",
      desc: "Create custom map cards",
      icon: <FaLayerGroup className="text-3xl" />,
      color: "from-purple-500 to-pink-500",
      iconColor: "text-purple-500"
    },
    {
      name: "Thumbnails",
      path: "/thumbnails",
      desc: "Design video thumbnails",
      icon: <FaImage className="text-3xl" />,
      color: "from-green-500 to-emerald-500",
      iconColor: "text-green-500"
    },
    {
      name: "Playlists",
      path: "/playlists",
      desc: "Create playlists for BeatSaver",
      icon: <FaList className="text-3xl" />,
      color: "from-orange-500 to-amber-500",
      iconColor: "text-orange-500"
    },
  ];

  return (
    <div className='w-full min-h-full flex flex-col justify-center items-center p-4 select-none'>
      <motion.div
        className='items-center justify-items-center max-w-2xl'
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
            className='text-lg mt-3 text-neutral-600 dark:text-neutral-400'
            variants={fadeIn}
            custom={1}
          >
            Generate everything needed for a Beat Saber video!
          </motion.p>

          <motion.div
            className="mt-8 grid grid-cols-2 gap-4"
            variants={fadeIn}
            custom={2}
          >
            {features.map((item) => (
              <Link to={item.path} key={item.name}>
                <motion.div
                  className="relative p-4 glass-panel overflow-hidden group cursor-pointer"
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Gradient border on hover */}
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} style={{ padding: '1px' }}>
                    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-xl" />
                  </div>

                  {/* Gradient background glow on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 rounded-xl transition-opacity duration-300`}
                  />

                  <div className="flex flex-col items-center text-center justify-center relative z-10">
                    <div className={`mb-3 p-3 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{item.name}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{item.desc}</p>

                    <motion.div
                      className={`mt-3 flex items-center bg-gradient-to-r ${item.color} bg-clip-text text-transparent font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300`}
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                    >
                      <span className="mr-1">Get started</span>
                      <FaArrowRight size={12} className={item.iconColor} />
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
