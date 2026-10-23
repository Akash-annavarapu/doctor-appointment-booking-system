import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeaturedDoctors from "../components/FeaturedDoctors";

function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const element = document.getElementById(id);
    if (element && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  return (
    <>
      <Navbar />

      <main className="healthcare-home">
        <section className="home-hero" aria-labelledby="home-heading">
          <div className="container home-hero-grid">
            <div className="home-hero-copy">
              <p className="home-eyebrow"><span className="home-eyebrow-dot" aria-hidden="true" /> A SIMPLE WAY TO EXPLORE CARE</p>
              <h1 id="home-heading" className="home-hero-title">
                Good health starts with <span>the right doctor.</span>
              </h1>
              <p className="home-hero-subtitle">
                Find a specialist, explore the available schedules, and try booking an appointment—all in one easy-to-use healthcare demo.
              </p>
              <div className="home-hero-actions">
                <a className="btn btn-primary home-hero-button" href="#featured-doctors">
                  Find your doctor <span aria-hidden="true">→</span>
                </a>
                <a className="home-how-link" href="#how-it-works">
                  <span className="home-play-icon" aria-hidden="true">▶</span> How it works
                </a>
              </div>
              <div className="home-hero-helper">
                <span className="home-helper-icon" aria-hidden="true">✚</span>
                <span><strong>Explore at your own pace</strong><small>Sample doctors and appointments for software testing</small></span>
              </div>
            </div>

            <div className="home-hero-visual">
              <div className="home-hero-blob" aria-hidden="true" />
              <div className="home-hero-image-shell">
                <img
                  className="home-hero-image"
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1100&q=85"
                  alt="Illustrative stock photograph of a healthcare professional"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <div className="home-floating-card home-floating-top">
                <span className="home-floating-icon" aria-hidden="true">✦</span>
                <span><strong>Find your specialty</strong><small>Explore doctor profiles</small></span>
              </div>
              <div className="home-floating-card home-floating-bottom">
                <span className="home-floating-icon" aria-hidden="true">▦</span>
                <span><strong>Check open slots</strong><small>See date-specific availability</small></span>
              </div>
              <div className="home-image-disclaimer">Illustrative photo · Training website</div>
            </div>
          </div>
        </section>

        <div id="featured-doctors" className="home-doctors-anchor">
          <FeaturedDoctors />
        </div>

        <section id="how-it-works" className="home-process" aria-labelledby="how-heading">
          <div className="container home-process-inner">
            <div className="home-process-intro">
              <span className="home-process-kicker">A SIMPLER WAY TO GET STARTED</span>
              <h2 id="how-heading">Your next appointment, <span>in three easy steps.</span></h2>
              <p>Try the workflow using sample profiles and test information.</p>
            </div>
            <div className="home-process-steps">
              <div className="home-process-step">
                <span className="home-process-number">01</span>
                <h3>Find your match</h3>
                <p>Search by doctor or specialty to explore available profiles.</p>
              </div>
              <div className="home-process-step">
                <span className="home-process-number">02</span>
                <h3>Choose a time</h3>
                <p>Check a date and see the open appointment slots.</p>
              </div>
              <div className="home-process-step">
                <span className="home-process-number">03</span>
                <h3>Book your visit</h3>
                <p>Sign in and continue through the appointment booking flow.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-demo-bar" aria-label="Demo project information">
          <div className="container home-demo-bar-inner">
            <div><strong>Built for exploring and testing.</strong><p>This is a healthcare training application, not a real provider directory.</p></div>
            <Link to="/test-cases" className="home-demo-link">See our test cases <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Home;
