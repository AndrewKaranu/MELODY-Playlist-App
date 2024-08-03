import React from 'react';
import { Link } from 'react-router-dom';
import SpotifyLoginButton from "../components/SpotifyLoginButton";
import ModelViewer from "../components/ThreeDModel";
import "./styles/Home.css";

const Home = () => {
  return (
    <div className="home">
      <main className="content">
        <p className="tagline">Your Personal Concert Experience</p>
        <p className="description">
          Get a front row ticket to your own AI-generated concert based on your music taste.
        </p>
        <SpotifyLoginButton />
      </main>
      
      <div className="model-container">
        <ModelViewer />
      </div>
    </div>
  );
};

export default Home;