import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Upload from './upload';
import View from './view';
import LeftBar from './partials/left_bar'; 
import "tailwindcss/tailwind.css";

function Index() {

  return (
    <div className='flex'>
      <LeftBar />
      <div className='flex-1 bg-neutral-400'>
        <div className=''>
          <h1>CC Clip Sesh Tool</h1>
          <p>Created by Spoekle</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/view" element={<View />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Router>
  );
}