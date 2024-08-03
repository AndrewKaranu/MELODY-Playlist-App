import { PlaylistContext } from "../context/PlayListContext";
import { useContext } from "react";

export const usePlaylistContext = () => {
    const context = useContext(PlaylistContext)
    
    if (!context) {
        throw Error('usePlaylistContext must be used inside a PlaylistContextProvider')
    }
    
    return context
}
