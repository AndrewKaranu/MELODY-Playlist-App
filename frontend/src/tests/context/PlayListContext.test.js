import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PlaylistContextProvider, playlistReducer } from '../../context/PlayListContext';
import { useContext } from 'react';
import { PlaylistContext } from '../../context/PlayListContext';

// Custom hook to test the context
const usePlaylistContextTest = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylistContextTest must be used within PlaylistContextProvider');
  }
  return context;
};

const wrapper = ({ children }) => (
  <PlaylistContextProvider>{children}</PlaylistContextProvider>
);

describe('PlaylistContext', () => {
  it('should set playlists with SET_PLAYLIST action', () => {
    const initialState = { playlists: [] };
    const mockPlaylists = [
      { _id: '1', title: 'Playlist 1' },
      { _id: '2', title: 'Playlist 2' }
    ];

    const action = { type: 'SET_PLAYLIST', payload: mockPlaylists };
    const newState = playlistReducer(initialState, action);

    expect(newState.playlists).toEqual(mockPlaylists);
  });

  it('should add new playlist with CREATE_PLAYLIST action', () => {
    const existingPlaylist = { _id: '1', title: 'Existing Playlist' };
    const initialState = { playlists: [existingPlaylist] };
    const newPlaylist = { _id: '2', title: 'New Playlist' };

    const action = { type: 'CREATE_PLAYLIST', payload: newPlaylist };
    const newState = playlistReducer(initialState, action);

    expect(newState.playlists).toHaveLength(2);
    expect(newState.playlists[0]).toEqual(newPlaylist); // New playlist should be first
    expect(newState.playlists[1]).toEqual(existingPlaylist);
  });

  it('should remove playlist with DELETE_PLAYLIST action', () => {
    const playlist1 = { _id: '1', title: 'Playlist 1' };
    const playlist2 = { _id: '2', title: 'Playlist 2' };
    const initialState = { playlists: [playlist1, playlist2] };

    const action = { type: 'DELETE_PLAYLIST', payload: playlist1 };
    const newState = playlistReducer(initialState, action);

    expect(newState.playlists).toHaveLength(1);
    expect(newState.playlists[0]).toEqual(playlist2);
  });

  it('should provide context with dispatch functionality', () => {
    const { result } = renderHook(() => usePlaylistContextTest(), { wrapper });

    const mockPlaylists = [
      { _id: '1', title: 'Test Playlist 1' },
      { _id: '2', title: 'Test Playlist 2' }
    ];

    act(() => {
      result.current.dispatch({ type: 'SET_PLAYLIST', payload: mockPlaylists });
    });

    expect(result.current.playlists).toEqual(mockPlaylists);
    expect(typeof result.current.dispatch).toBe('function');
  });
});