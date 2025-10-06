import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">


        <div className="footer-section footer-left">
          <h3>Contact</h3>
            <p>Steven Macdonald<a href="mailto:steven.macdonald228@gmail.com">steven.macdonald228@gmail.com</a></p>
        </div>


        <div className="footer-section footer-center">
            <h3 className="socials-header">Socials</h3>
            <div className="footer-section-socials">
                <a href="https://www.instagram.com/stevemac228/" target="_blank" rel="noopener noreferrer">
                    <img src="icons/instagram.svg" alt="Instagram" class="footer-icon"/>
                </a>
                <a href="https://www.strava.com/athletes/99125298" target="_blank" rel="noopener noreferrer">
                    <img src="icons/strava.svg" alt="Strava" class="footer-icon"/>
                </a>
                <a href="https://www.facebook.com/steven.macdonald.73594/" target="_blank" rel="noopener noreferrer">
                    <img src="icons/facebook.svg" alt="Facebook" class="footer-icon"/>
                </a>
            </div>
        </div>


        <div className="footer-section footer-right">
          <h3>Links</h3>
          <a href="/about">About</a>
          <a href="https://github.com/stevemac228/running-website" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://www.buymeacoffee.com/yourprofile" target="_blank" rel="noopener noreferrer">
            Buy Me a Coffee
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
        Information provided is for general reference only. Please verify all race details through official event websites before registering.
        </p>
        <p>{new Date().getFullYear()} Run NL</p>
      </div>
    </footer>
  );
}
