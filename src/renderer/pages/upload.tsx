import { Link } from 'react-router-dom';
import LeftBar from './partials/left_bar'; 
import "tailwindcss/tailwind.css";

function Upload() {
  return (
    <div className='flex'>
      <LeftBar />
      <div className='flex-1 bg-neutral-400'>
        <div className=''>
          <h1>CC Clip Upload</h1>
          <p>Created by Spoekle</p>
        </div>
      </div>
    </div>
  );
}

export default Upload