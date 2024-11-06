import { useState, useEffect, useRef } from "react";

const useTypewriter = (text, speed = 50, loop = false) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const index = useRef(0);

  useEffect(() => {
    if (isTyping) {
      const typingInterval = setInterval(() => {
        if (index.current < text.length) {
          setDisplayText((prevText) => prevText + text.charAt(index.current));
          index.current++;
        } else {
          if (loop) {
            setDisplayText("");
            index.current = 0;
          } else {
            clearInterval(typingInterval);
            setIsTyping(false);
          }
        }
      }, speed);

      return () => {
        clearInterval(typingInterval);
      };
    }
  }, [text, speed, loop, isTyping]);

  return displayText;
};

const Typewriter = ({ text, speed, loop = true }) => {
  const displayText = useTypewriter(text, (speed = 200), loop);

  return <p>{displayText}</p>;
};

export default Typewriter;
