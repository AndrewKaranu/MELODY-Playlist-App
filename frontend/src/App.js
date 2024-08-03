import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Pages and components
import Home from './pages/Home';
import CreatePlaylist from './pages/CreatePlaylist';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PlaylistPlayer from './pages/PlaylistPlayer';
import EditPlaylist from './pages/EditPlaylist';
import './App.css';
import ArtistGame from './pages/ArtistGame';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="background-animation">
          <Navbar />
          <div className="pages">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/CreatePlaylist" element={<CreatePlaylist />} />
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="/playlist/:id" element={<PlaylistPlayer />} />
              <Route path="/EditPlaylist/:id" element={<EditPlaylist />} />
              <Route path="/OpenGame" element={< ArtistGame />} />

            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
