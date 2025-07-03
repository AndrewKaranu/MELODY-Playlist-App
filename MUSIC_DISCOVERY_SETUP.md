# Music Discovery Setup - Last.fm API

The voice agent now includes advanced music discovery capabilities using the Last.fm API. This allows the agent to provide intelligent music recommendations based on natural language queries.

## Last.fm API Key Setup

1. **Get a Last.fm API Key:**
   - Go to https://www.last.fm/api/account/create
   - Create a free account if you don't have one
   - Fill out the application form:
     - Application name: "MELODY Voice Agent"
     - Application description: "Voice-controlled music discovery and playback"
     - Application homepage URL: http://localhost:3000 (or your domain)
     - Callback URL: (leave blank for this use case)
   - After submission, you'll get an API key

2. **Add the API Key to Environment Variables:**
   - Open the `.env` file in the backend folder
   - Add your Last.fm API key:
     ```
     LASTFM_API_KEY=your_actual_api_key_here
     ```

## Music Discovery Features

The agent can now:

### 1. **Intelligent Music Search**
- "Find me some modern jazz hits"
- "I want upbeat 80s music"
- "Show me relaxing acoustic songs"

### 2. **Artist Similarity**
- "Songs similar to Radiohead"
- "Artists like Billie Eilish"
- "Music that sounds like The Beatles"

### 3. **Genre-Based Recommendations**
- "Top jazz tracks"
- "Best electronic music"
- "Popular rock songs"

### 4. **Mood and Description-Based Search**
- "Energetic workout music"
- "Sad piano songs"
- "Chill electronic beats"
- "Romantic ballads"

### 5. **Artist Top Tracks**
- "Best songs by Pink Floyd"
- "Top tracks from Adele"
- "Most popular songs by Drake"

## How It Works

1. **User Request:** User asks for music recommendations using natural language
2. **Intelligent Analysis:** The agent analyzes the request to determine the best search strategy
3. **Last.fm Query:** Searches Last.fm's extensive music database using the appropriate method
4. **Results Formatting:** Returns a formatted list of tracks with artist names
5. **Spotify Integration:** User can then ask to play specific tracks from the results

## Example Interactions

**User:** "Can you recommend some modern jazz hits?"

**Agent:** Uses the `discover_music` function with query "modern jazz hits", finds relevant tracks from Last.fm, and presents them as a list. User can then say "Play the first one" or "Play [specific song] by [artist]".

**User:** "I like Coldplay, what similar artists should I check out?"

**Agent:** Uses the `get_recommendations` function with type "similar_artist" and artist "Coldplay", finds tracks from similar artists, and offers to play them.

## Benefits

- **No More Failed Searches:** Instead of searching Spotify for "modern jazz hit" as a song title, the agent finds actual modern jazz tracks
- **Intelligent Discovery:** Uses multiple search strategies based on the user's request
- **Rich Music Database:** Last.fm has extensive metadata about artists, genres, and musical relationships
- **Natural Language Processing:** Users can describe what they want in their own words
- **Seamless Integration:** Discovery results integrate with Spotify playback controls

## Fallback Behavior

If the Last.fm API is unavailable or returns no results, the agent will:
1. Inform the user about the search issue
2. Suggest alternative search terms
3. Fall back to basic Spotify search for specific song/artist combinations

This implementation significantly improves the agent's ability to understand and fulfill music discovery requests using natural language.
