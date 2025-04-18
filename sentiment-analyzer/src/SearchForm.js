import React, { useState } from "react";

function SearchForm() {
  const [tweetId, setTweetId] = useState("");
  const [sentiment, setSentiment] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    const response = await fetch(`http://localhost:5000/sentiment/${tweetId}`);
    const data = await response.json();

    if (data.sentiment) {
      setSentiment(data.sentiment);
    } else {
      setSentiment("Erreur: Impossible de récupérer le tweet.");
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={tweetId}
          onChange={(e) => setTweetId(e.target.value)}
          placeholder="Entrez l'ID du tweet"
        />
        <button type="submit">Rechercher</button>
      </form>
      {sentiment && <p>Sentiment: {sentiment}</p>}
    </div>
  );
}

export default SearchForm;
