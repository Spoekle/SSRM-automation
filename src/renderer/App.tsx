import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Titles from './pages/Titles';
import Thumbnails from './pages/Thumbnails';
import MapCards from './pages/MapCards';
import Navbar from './pages/components/Navbar';
import Footer from './pages/components/Footer';
import './App.css';

const AppContent: React.FC = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="route-container h-96 max-h-96">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/titles" element={<Titles />} />
          <Route path="/mapcards" element={<MapCards />} />
          <Route path="/thumbnails" element={<Thumbnails />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
