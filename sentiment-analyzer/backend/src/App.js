import { useState, useEffect } from 'react';
import React from 'react';

import axios from 'axios';

function App() {
    const [tweets, setTweets] = useState([]);

    useEffect(() => {
        const fetchTweets = async () => {
            try {
                const response = await axios.get("http://localhost:5000/tweets");
                setTweets(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération des tweets:", error);
            }
        };

        fetchTweets();
    }, []);

    return (
        <div>
            <h1>Tweets récupérés :</h1>
            <ul>
                {tweets.map((tweet) => (
                    <li key={tweet.id}>
                        <strong>{tweet.text}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
