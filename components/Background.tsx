import React, { useMemo } from 'react';

// === BACKGROUND SLOTS ===
// Insert your manual image URLs here:
const BACKGROUNDS = [
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExamVqazlmM2Q0bmttaHBpNmNxMHdjNHBzZTdlbGJ4ZzVpdm1vYTlpMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZBK7b4vHYyb0n70zJq/giphy.gif", // Slot 1 (Original)
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExejQ0cDZmOGlzeGQzdTE3ZmUyajJ4cGh5bGRhbnoxZ3Vjc21jb2tjeiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zIZldEXyyo64qOIgvb/giphy.gif", // Slot 2 (Studio Gear)
  "https://media1.tenor.com/m/QmWxjZNfSkIAAAAd/dog-dance-husky-dance.gif", // Slot 3 (Gradient Texture)
  "https://media1.tenor.com/m/595OFoFbb3sAAAAd/dog-smile.gif", // Slot 4 (Audio Waveform Style)
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGlqYXR0bzJjNTZ1ZGZubmtyZ2RwODdoeDVpNG1lbjNqdTE4dHk4NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2JeQO72XbrQk4wNdbp/giphy.gif"  // Slot 5 (Dark Studio)
];

const Background: React.FC = () => {
  // Use sessionStorage to keep the background consistent for the entire tab session
  const activeBackground = useMemo(() => {
    try {
      const sessionKey = 'mang_sueb_bg_index';
      let index = sessionStorage.getItem(sessionKey);
      
      if (index === null) {
        // Pick a random index if not set
        index = Math.floor(Math.random() * BACKGROUNDS.length).toString();
        sessionStorage.setItem(sessionKey, index);
      }
      
      const idx = parseInt(index, 10);
      return BACKGROUNDS[idx] || BACKGROUNDS[0];
    } catch (e) {
      return BACKGROUNDS[0];
    }
  }, []);

  return (
    <>
      <div className="studio-bg-container">
        <img 
          src={activeBackground} 
          className="w-full h-full object-cover grayscale contrast-[1.2] brightness-[1] opacity-90 transition-opacity duration-1000"
          alt="Studio Background"
          loading="eager"
        />
        <div className="deep-blue-tint"></div>
      </div>
      <div className="grain"></div>
    </>
  );
};

export default Background;