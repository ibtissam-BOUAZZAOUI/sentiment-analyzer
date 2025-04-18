import React, { useState } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState("");
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) {
      setError("Veuillez entrer un mot-clé.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5000/search/${query}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des tweets.");
      }
      const data = await response.json();
      setTweets(data);
    } catch (err) {
      setError("Erreur : impossible de récupérer les tweets.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case "Positif":
        return "#4CAF50"; // vert
      case "Négatif":
        return "#F44336"; // rouge
      default:
        return "#9E9E9E"; // gris
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Analyseur de Sentiment de Tweet</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher un mot-clé (ex: ReactJS)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Rechercher
          </button>
        </div>

        {loading && <p>Chargement...</p>}
        {error && <p className="error">{error}</p>}

        {tweets.length > 0 && (
          <div className="tweet-list">
            {tweets.map((tweet, index) => (
              <div
                key={index}
                className="tweet-card"
                style={{ borderLeft: `5px solid ${getSentimentColor(tweet.sentiment)}` }}
              >
                <p><strong>Tweet :</strong> {tweet.text}</p>
                <p>
                  <strong>Analyse de Sentiment :</strong>{" "}
                  <span style={{ color: getSentimentColor(tweet.sentiment), fontWeight: 'bold' }}>
                    {tweet.sentiment}
                  </span>
                </p>
                
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
