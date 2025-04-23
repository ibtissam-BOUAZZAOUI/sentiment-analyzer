import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false); // Variable pour gérer le chargement
  const [error, setError] = useState(null); // Variable pour gérer l'erreur

  const searchTweets = async () => {
    setLoading(true); // Démarrer le chargement
    setError(null); // Réinitialiser l'erreur avant chaque nouvelle recherche
    try {
      const response = await axios.get(`http://localhost:5000/search/${query}`);
      setTweets(response.data);
    } catch (error) {
      setError('Erreur lors de la récupération des tweets.'); // Gérer l'erreur
      console.error('Erreur lors de la récupération des tweets:', error);
    } finally {
      setLoading(false); // Arrêter le chargement une fois la requête terminée
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
        <h1>Analyse de Sentiment des Tweets</h1>
        <div className="search-container">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Entrez un sujet" 
            className="search-input"
          />
          <button onClick={searchTweets} className="search-button">Rechercher</button>
        </div>
        
        {loading && <p>Chargement...</p>}  {/* Affiche un message pendant le chargement */}
        {error && <p className="error">{error}</p>}  {/* Affiche l'erreur si elle existe */}

        {tweets.length > 0 && (
          <div className="tweet-list">
            {tweets.map((tweet) => (
              <div key={tweet.tweetId} className="tweet-card"
                style={{ borderLeft: `5px solid ${getSentimentColor(tweet.sentiment)}` }}>
                <p>{tweet.text}</p>
                <p><strong>Sentiment:</strong><span style={{ color: getSentimentColor(tweet.sentiment), fontWeight: 'bold' }}> {tweet.sentiment} </span></p>
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
