import { createContext, useReducer } from "react";

export const PlaylistContext = createContext();

export const playlistReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAYLIST':
      return {
        playlists: action.payload
      }
    case 'CREATE_PLAYLIST':
      return {
        playlists: [action.payload, ...state.playlists]
      }
      case 'DELETE_PLAYLIST':
        return {
          playlists: state.playlists.filter((p)=> p._id !== action.payload._id)
        }   
    default:
      return state  
  }
};

export const PlaylistContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(playlistReducer, {
    playlists: [],
  });

  return (
    <PlaylistContext.Provider value={{ ...state, dispatch }}>
      {children}
    </PlaylistContext.Provider>
  );
};
