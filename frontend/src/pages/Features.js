import React, { useState } from 'react';
import './styles/Features.css';

const Features = () => {
  const features = [
    {
      title: "Generate via Prompt",
      description: "Transform your ideas into music! Simply describe the vibe, mood, or theme you're looking for, and our AI will craft a personalized playlist that matches your vision. Add an optional custom cover to make your playlist truly unique.",
      // Update path to start from public folder
      videoUrl: "/demoVids/1127.mp4"
    },
    {
      title: "Generate from Songs",
      description: "Let your favorite tracks inspire new discoveries. Either choose songs from your listening history or search for specific tracks to use as inspiration. Our AI analyzes these songs and creates a playlist with similar musical elements and vibes.",
      videoUrl: "/demoVids/songs-demo.mp4"
    },
    {
      title: "Create from Artists",
      description: "Start with your favorite artists and let us expand your musical horizons. Select artists you love, and we'll generate a playlist that captures their essence while introducing you to new artists you might enjoy.",
      videoUrl: "/demoVids/artists-demo.mp4"
    },
    {
      title: "Generate from Images",
      description: "Turn visual inspiration into musical expression. Upload any image, and our AI will interpret its mood, colors, and composition to create a playlist that captures its essence in musical form.",
      videoUrl: "/demoVids/images-demo.mp4"
    }
  ];

  const [videoLoading, setVideoLoading] = useState(() => 
    Object.fromEntries(features.map((_, index) => [index, true]))
  );

  const handleVideoLoad = (index) => {
    setVideoLoading(prev => ({...prev, [index]: false}));
  };

  const handleVideoError = (index) => {
    setVideoLoading(prev => ({...prev, [index]: false}));
    console.error(`Failed to load video for feature ${index}`);
  };

  return (
    <div className="features-container">
      <div className="features-hero">
        <h1 className="hero-subtitle">Your Personal Concert Experience</h1>
        <div className="hero-description">
          Melody is an innovative AI-powered platform that transforms your ideas, preferences, and inspirations into 
          perfectly curated Spotify playlists. Whether through text, images, or your favorite music, we create 
          personalized soundtracks tailored just for you.
        </div>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
            <div className="video-container">
              {videoLoading[index] && (
                <div className="video-loading">Loading...</div>
              )}
              <video 
                key={feature.videoUrl}
                controls
                loop
                muted
                playsInline
                onLoadStart={() => setVideoLoading(prev => ({...prev, [index]: true}))}
                onLoadedData={() => handleVideoLoad(index)}
                onError={() => handleVideoError(index)}
                className="feature-video"
              >
                <source src={feature.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;