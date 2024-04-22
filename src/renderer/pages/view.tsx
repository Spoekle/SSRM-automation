import { Link } from 'react-router-dom';
import LeftBar from './partials/left_bar'; 
import "tailwindcss/tailwind.css";

function View() {
  return (
    <div className='flex'>
      <LeftBar />
      <div className='flex-1 bg-neutral-400'>
        <div className=''>
          <h1>CC Clip Viewer</h1>
          <p>Created by Spoekle</p>
        </div>
      </div>
    </div>
  );
}

export default View
