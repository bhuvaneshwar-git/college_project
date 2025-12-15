import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const startContainer = async (os) => {
    setLoading(true);
    setStatus(`Starting ${os} container...`);

    try {
      const res = await fetch(`/api/start-container?os=${os}`, {
        method: "POST",
});
      const data = await res.json();

      setStatus(`${os} container started! Redirecting...`);
      setTimeout(() => {
        window.location.href = data.url;
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus(`Failed to start ${os} container.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <h1>Run Linux Os in Your Browser!</h1>
      </header>

      <main className="main-content">
        <div className="container">
          <h2>Choose Your Operating System</h2>
          <div className="os-grid">
            {/* Ubuntu */}
            <div className="os-card">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo-ubuntu_cof-orange-hex.svg"
                alt="Ubuntu"
              />
              <h3>Ubuntu Desktop</h3>
              <p>A modern Linux environment with XFCE & noVNC interface.</p>
              <button
                onClick={() => startContainer("ubuntu")}
                disabled={loading}
              >
                {loading ? "Starting..." : "Start Ubuntu"}
              </button>
            </div>

            {/* Kali Linux */}
            <div className="os-card">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/2b/Kali-dragon-icon.svg"
                alt="Kali Linux"
              />
              <h3>Kali Linux</h3>
              <p>Security testing and ethical hacking Linux distribution.</p>
              <button
                onClick={() => startContainer("kali")}
                disabled={loading}
              >
                {loading ? "Starting..." : "Start Kali"}
              </button>
            </div>
          </div>

          <p className="status">{status}</p>
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 Browser Virtual OS.</p>
      </footer>
    </div>
  );
}
