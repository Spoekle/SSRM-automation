import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Home from './pages/Home';
import Titles from './pages/Titles';
import Thumbnails from './pages/Thumbnails';
import Navbar from './pages/components/Navbar';
import Footer from './pages/components/Footer';
import 'tailwindcss/tailwind.css';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/titles" element={<Titles />} />
        <Route path="/thumbnails" element={<Thumbnails />} />
      </Routes>
      <Footer />
    </Router>
  );
}
