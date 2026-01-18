import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaLayerGroup, FaArrowRight, FaList, FaScroll, FaExchangeAlt, FaImages, FaStar, FaYoutube } from 'react-icons/fa';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
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
      icon: <FaFileAlt className="text-3xl" />,
      bgColor: "bg-blue-500",
      iconColor: "text-blue-500"
    },
    {
      name: "Scripts",
      path: "/scripts",
      icon: <FaScroll className="text-3xl" />,
      bgColor: "bg-teal-500",
      iconColor: "text-teal-500"
    },
    {
      name: "Map Cards",
      path: "/cards/map",
      icon: <FaLayerGroup className="text-3xl" />,
      bgColor: "bg-blue-500",
      iconColor: "text-blue-500"
    },
    {
      name: "Reweight Cards",
      path: "/cards/reweight",
      icon: <FaExchangeAlt className="text-3xl" />,
      bgColor: "bg-purple-500",
      iconColor: "text-purple-500"
    },
    {
      name: "Batch Thumbnails",
      path: "/thumbnails/batch",
      icon: <FaStar className="text-3xl" />,
      bgColor: "bg-yellow-500",
      iconColor: "text-yellow-500"
    },
    {
      name: "SSRM Thumbnails",
      path: "/thumbnails/ssrm",
      icon: <FaYoutube className="text-3xl" />,
      bgColor: "bg-orange-500",
      iconColor: "text-orange-500"
    },
    {
      name: "Playlist",
      path: "/playlists/playlist",
      icon: <FaList className="text-3xl" />,
      bgColor: "bg-amber-500",
      iconColor: "text-amber-500"
    },
    {
      name: "Playlist Thumbnail",
      path: "/playlists/playlist-thumbnail",
      icon: <FaImages className="text-3xl" />,
      bgColor: "bg-amber-500",
      iconColor: "text-amber-500"
    },
  ];

  return (
    <div className='w-full min-h-full flex flex-col justify-center items-center p-4 select-none'>
      <motion.div
        className='items-center justify-items-center max-w-3xl'
        initial="hidden"
        animate="visible"
      >
        <div className='text-center'>
          <motion.h1
            className='text-3xl font-bold'
            variants={fadeIn}
            custom={0}
            transition={{ type: "spring", stiffness: 300 }}
          >
            SSRM Automation Tool
          </motion.h1>

          <motion.p
            className='text-lg mt-3 text-neutral-600 dark:text-neutral-400'
            variants={fadeIn}
            custom={1}
          >
            Generate everything needed for ScoreSaber!
          </motion.p>

          <motion.div
            className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={fadeIn}
            custom={2}
          >
            {features.map((item) => (
              <Link to={item.path} key={item.name}>
                <motion.div
                  className="relative p-4 glass-panel overflow-hidden group cursor-pointer h-full"
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`absolute inset-0 rounded-xl ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} style={{ padding: '1px' }}>
                    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-xl" />
                  </div>

                  <motion.div
                    className={`absolute inset-0 ${item.bgColor} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 rounded-xl transition-opacity duration-300`}
                  />

                  <div className="flex flex-col items-center text-center justify-center relative z-10">
                    <div className={`mb-3 p-3 rounded-xl ${item.bgColor} text-white shadow-lg`}>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{item.name}</h3>
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

