import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <div className='bg-neutral-800 text-gray-200'>
      <div className='items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl'>ScoreSaber Ranked Maps - Automation</h1>
          <p className='text-lg'>Created by Spoekle</p>
        </div>
        <div className='text-center text-lg mt-2'>
          <Link to='/' className='text-blue-500 mr-2 hover:underline'>Home</Link>
          <Link to='/titles' className='text-blue-500 mx-2 hover:underline'>Titles</Link>
          <Link to='/thumbnails' className='text-blue-500 ml-2 hover:underline'>Thumbnails</Link>
        </div>
      </div>
    </div>
  );
}

export default Navbar
