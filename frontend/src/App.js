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
import Support from './pages/Support';
import LoadingScreen from './components/LoadingScreen'
import Features from './pages/Features';
import TopCharts from './pages/TopCharts';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="background-animation">
          <div className="header">
          <Navbar />
          </div>
          <div className="pages">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/CreatePlaylist" element={<CreatePlaylist />} />
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="/playlist/:id" element={<PlaylistPlayer />} />
              <Route path="/EditPlaylist/:id" element={<EditPlaylist />} />
              <Route path="/OpenGame" element={< ArtistGame />} />
              <Route path="/Support" element={<Support />} />
              <Route path='/Loader' element = {<LoadingScreen/>} />
              <Route path="/features" element={<Features />} />
              <Route path="/TopCharts" element={<TopCharts />} />

            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
