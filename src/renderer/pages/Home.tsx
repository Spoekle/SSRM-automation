import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';


function Home() {

  return (
    <div className='grid justify-items-center dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-8 justify-center items-center'>
      <div className='items-center justify-items-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>SSRM Automation Tool</h1>
          <p className='text-lg'>Generate everything that is needed for a BeatSaber Video!</p>
        </div>
        <div className='items-center justify-center'>
          
        </div>
      </div>
    </div>
  );
}

export default Home
