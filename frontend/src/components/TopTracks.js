// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import './TopTracks.css';

// const TopTracks = () => {
//   const [topTracks, setTopTracks] = useState([]);
//   const [timeframe, setTimeframe] = useState('medium_term');
//   const embedControllerRef = useRef(null);

//   const playlistUrl = 'https://open.spotify.com/embed/iframe-api/v1';

//   useEffect(() => {
//     // Initialize Spotify iframe
//     const script = document.createElement('script');
//     script.src = playlistUrl;
//     script.async = true;
//     const container = document.getElementById('top-tracks-container');
//     container.appendChild(script);
//     //document.body.appendChild(script);

//     const fetchTopTracks = async (timeRange) => {
//       try {
//         const response = await axios.get('http://localhost:4000/api/playlists/toptracks', {
//           params: { timeRange },
//           withCredentials: true,
//         });
//         setTopTracks(response.data.topTracks.map(track => ({
//           ...track,
//           releaseDate: new Date(track.releaseDate).getFullYear() > 2022 ? track.releaseDate : null,
//         })));
//       } catch (error) {
//         console.error('Error fetching top tracks:', error);
//       }
//     };

//     fetchTopTracks(timeframe);
//   }, [timeframe]);

//   // Handle track clicks with React event handlers
//   const handleTrackClick = (trackId) => {
//     const uri = `spotify:track:${trackId}`;

//     // Look for the specific iframe in the tracks container
//     const iframe = document.querySelector('#top-tracks-container iframe');
//     if (iframe) {
//       iframe.style.display = 'block';
//     }

//     if (embedControllerRef.current) {
//       embedControllerRef.current.loadUri(uri);
//       embedControllerRef.current.play();
//     }
//   };
  
//   window.onSpotifyIframeApiReady = (IFrameAPI) => {
//     const element = document.getElementById('embed-iframe');
//     const options = {
//       width: '100%',
//       height: '160',
//       uri: ''
//     };
//     const callback = (EmbedController) => {
//       embedControllerRef.current = EmbedController;
//     };
//     IFrameAPI.createController(element, options, callback);
//   };

//   return (
//     <div className="top-tracks-container" id="top-tracks-container">
//       <div id="embed-iframe" className="player"></div>
//       <h3>Top Tracks</h3>

//       <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
//         <option value="short_term">Last 4 weeks</option>
//         <option value="medium_term">Last 6 months</option>
//         <option value="long_term">All time</option>
//       </select>

//       <div className="podium">
//         {topTracks.length >= 3 && (
//           <>
//             <div className="podium-item second">
//               <button className="tracks pod" onClick={() => handleTrackClick(topTracks[1].id)} style={{backgroundImage: `url(${topTracks[1].imageUrl})`, alt:`${topTracks[1].name}`}}>
//               </button>
//               <p>{topTracks[1].name}</p>
//               <p id="artist">{topTracks[1].artists}</p>
//             </div>

//             <div className="podium-item first">
//               <button className="tracks pod" onClick={() => handleTrackClick(topTracks[0].id)} style={{backgroundImage: `url(${topTracks[0].imageUrl})`, alt:`${topTracks[0].name}`}}>
//               </button>
//               <p>{topTracks[0].name}</p>
//               <p id="artist">{topTracks[0].artists}</p>
//             </div>

//             <div className="podium-item third">
//               <button className="tracks pod" onClick={() => handleTrackClick(topTracks[2].id)} style={{backgroundImage: `url(${topTracks[2].imageUrl})`, alt:`${topTracks[2].name}`}}>
//               </button>
//               <p>{topTracks[2].name}</p>
//               <p id="artist">{topTracks[2].artists}</p>
//             </div>
//           </>
//         )}
//       </div>

//       <div className="rest-list">
//         {topTracks.slice(3).map((track, index) => (
//           <div key={track.id} className="rest-item">
//             <span>{index + 4}</span>
//             <button
//               className="tracks"
//               onClick={() => handleTrackClick(track.id)}
//               style={{backgroundImage : `url(${track.imageUrl})`}}
//             >
//             </button>
//             <div>
//               <p>{track.name}</p>
//               <p id="artist">{track.artists}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TopTracks;