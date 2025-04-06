import React, { useState } from 'react';
import './styles/Support.css';

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accordion-item">
      <button
        className="accordion-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && <div className="accordion-content">{answer}</div>}
    </div>
  );
};

const Support = () => {
  const faqData = [
    {
      question: "How does Melody generate playlists?",
      answer: "Melody uses AI to analyze your music preferences and create custom playlists based on various inputs such as prompts, images, similar artists, or songs."
    },
    {
      question: "Do I need a Spotify account to use Melody?",
      answer: "Yes, Melody requires a Spotify account to access your music preferences and create playlists on your behalf."
    },
    {
      question: "How long does it take to generate a playlist?",
      answer: "The generation time varies depending on the complexity of your input, but it typically takes between 30 seconds to 2 minutes."
    },
    {
      question: "Can I edit the generated playlists?",
      answer: "Yes, once a playlist is generated, you can edit it directly in your Spotify account or use Melody's interface to make changes."
    },
    {
      question: "Is there a limit to how many playlists I can create?",
      answer: "There's no hard limit, but we recommend creating up to 10 playlists per day to ensure the best performance."
    },
    {
      question: "How does Melody handle my data?",
      answer: "We take your privacy seriously. Melody only accesses the Spotify data necessary to create playlists. We don't store your listening history or personal information."
    },
    {
      question: "Can I use images to create playlists?",
      answer: "Yes! You can upload an image or provide an image URL, and Melody will interpret the image to create a themed playlist."
    }
  ];

  return (
    <div className="faq-container">
      <h1>Frequently Asked Questions</h1>
      <div className="faq-accordion">
        {faqData.map((item, index) => (
          <AccordionItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
};

export default Support;