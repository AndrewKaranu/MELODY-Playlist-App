// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import './TopArtists.css';

// const TopArtists = () => {
//   const [topArtists, setTopArtists] = useState([]);
//   const [timeframe, setTimeframe] = useState('medium_term');
//   const embedControllerRef = useRef(null);

//   const playlistUrl = 'https://open.spotify.com/embed/iframe-api/v1';

//   // Fetch top artists when timeframe changes
//   useEffect(() => {
//     const fetchTopArtists = async (timeRange) => {
//       try {
//         const response = await axios.get('http://localhost:4000/api/playlists/topartists', {
//           params: { timeRange },
//           withCredentials: true,
//         });
//         setTopArtists(response.data.topArtists || []);
//       } catch (error) {
//         console.error('Error fetching top artists:', error);
//       }
//     };
//     fetchTopArtists(timeframe);
//   }, [timeframe]);

//   // Handle artist clicks - play their top track
//   const handleArtistClick = async (artistId) => {
//     console.log('Artist clicked:', artistId);
//     try {
//       const response = await axios.get('http://localhost:4000/api/playlists/artist-top-tracks', {
//         params: { artistId },
//         withCredentials: true,
//       });
      
//       console.log('Response:', response.data);
      
//       if (response.data.artistTopTracks && response.data.artistTopTracks.length > 0) {
//         const topTrack = response.data.artistTopTracks[0];
//         const uri = `spotify:track:${topTrack.id}`;
        
//         console.log('Playing track:', topTrack.name, 'URI:', uri);

//         // Look for the specific iframe in the artists container
//         const iframe = document.querySelector('#top-artists-container iframe');
//         console.log('Found iframe:', iframe);
//         if (iframe) {
//           iframe.style.display = 'block';
//         }

//         console.log('Embed controller:', embedControllerRef.current);
//         if (embedControllerRef.current) {
//           embedControllerRef.current.loadUri(uri);
//           embedControllerRef.current.play();
//         } else {
//           console.log('Embed controller not ready');
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching artist top tracks:', error);
//     }
//   };
  
//   // Initialize Spotify IFrame API and share callback with TopTracks
//   useEffect(() => {
//     // Inject Spotify embed script once
//     if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
//       const script = document.createElement('script');
//       script.src = playlistUrl;
//       script.async = true;
//       document.body.appendChild(script);
//     }
//     // Override global callback to initialize both controllers
//     const previousCallback = window.onSpotifyIframeApiReady;
//     window.onSpotifyIframeApiReady = (IFrameAPI) => {
//       // Initialize TopTracks controller if exists
//       if (typeof previousCallback === 'function') {
//         previousCallback(IFrameAPI);
//       }
//       // Initialize TopArtists controller
//       const element = document.getElementById('embed-iframe-artists');
//       if (element && !embedControllerRef.current) {
//         const options = { width: '100%', height: '160', uri: '' };
//         const callback = (controller) => { embedControllerRef.current = controller; };
//         IFrameAPI.createController(element, options, callback);
//       }
//     };
//     // Cleanup override on unmount
//     return () => { window.onSpotifyIframeApiReady = previousCallback; };
//   }, []);

//   return (
//     <div className="top-artists-container" id="top-artists-container">
//       <div id="embed-iframe-artists" className="player"></div>
//       <h3>Top Artists</h3>
//       <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
//         <option value="short_term">Last 4 weeks</option>
//         <option value="medium_term">Last 6 months</option>
//         <option value="long_term">All time</option>
//       </select>
//       <div className="podium">
//         {topArtists.length >= 3 && (
//           <>
//             <div className="podium-item second">
//               <button 
//                 className="artists pod" 
//                 onClick={() => handleArtistClick(topArtists[1].id)}
//                 style={{backgroundImage: `url(${topArtists[1].imageUrl})`}}
//                 alt={topArtists[1].name}
//               >
//               </button>
//               <p>{topArtists[1].name}</p>
//             </div>
//             <div className="podium-item first">
//               <button 
//                 className="artists pod" 
//                 onClick={() => handleArtistClick(topArtists[0].id)}
//                 style={{backgroundImage: `url(${topArtists[0].imageUrl})`}}
//                 alt={topArtists[0].name}
//               >
//               </button>
//               <p>{topArtists[0].name}</p>
//             </div>
//             <div className="podium-item third">
//               <button 
//                 className="artists pod" 
//                 onClick={() => handleArtistClick(topArtists[2].id)}
//                 style={{backgroundImage: `url(${topArtists[2].imageUrl})`}}
//                 alt={topArtists[2].name}
//               >
//               </button>
//               <p>{topArtists[2].name}</p>
//             </div>
//           </>
//         )}
//       </div>
//       <div className="rest-list">
//         {topArtists.slice(3).map((artist, index) => (
//           <div key={artist.id} className="rest-item">
//             <span className="rank-number">{index + 4}</span>
//             <button
//               className="artists"
//               onClick={() => handleArtistClick(artist.id)}
//               style={{backgroundImage: `url(${artist.imageUrl})`}}
//             >
//             </button>
//             <div className="artist-info">
//               <p>{artist.name}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TopArtists;