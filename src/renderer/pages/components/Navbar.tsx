import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <div className='h-16 items-center justify-center bg-neutral-200 dark:bg-neutral-950 text-gray-950 dark:text-gray-200 p-4'>
      <div className='flex text-center justify-between'>
        <h1 className='text-xl'>ScoreSaber Ranked Maps - Automation</h1>
        <div className='text-center text-lg'>
          <Link to='/' className='text-blue-500 mr-2 hover:underline'>Home</Link>
          <Link to='/titles' className='text-blue-500 mx-2 hover:underline'>Titles</Link>
          <Link to='/thumbnails' className='text-blue-500 ml-2 hover:underline'>Thumbnails</Link>
        </div>
      </div>
    </div>
  );
}

export default Navbar
