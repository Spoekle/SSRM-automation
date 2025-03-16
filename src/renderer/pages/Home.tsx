import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
            className='text-xl mt-4'
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
            {[
              { name: "Titles", path: "/titles", desc: "Generate titles & descriptions" },
              { name: "Map Cards", path: "/mapcards", desc: "Create custom map cards" },
              { name: "Thumbnails", path: "/thumbnails", desc: "Design video thumbnails" }
            ].map((item, i) => (
              <Link to={item.path} key={item.name}>
                <motion.div
                  className="px-4 py-6 bg-neutral-300 dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "#3b82f6",
                    color: "#ffffff"
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm mt-2">{item.desc}</p>
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
