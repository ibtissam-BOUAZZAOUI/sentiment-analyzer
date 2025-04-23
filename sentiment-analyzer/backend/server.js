const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const Tweet = require("C:/Users/pourtoi/sentiment-analyzer/backend/models/Tweet");
const mongoose = require("mongoose");
const Sentiment = require("sentiment");

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Connexion à MongoDB
mongoose
  .connect("mongodb+srv://ibtissamebouazzaoui822:6GIKxHQBhKvJ3NHp@cluster0.o4l5bat.mongodb.net/tweet_sentiment?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("✅ Connecté à MongoDB");

    // Démarre l’API **uniquement** après la connexion
    const app = express();
    app.use(cors());
    app.use(express.json());

    const sentiment = new Sentiment();

    // Test
    app.get("/", (req, res) => res.send("Serveur backend en ligne !"));

    // Recherche + analyse
app.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;

    // 🔍 On cherche dans la base MongoDB s'il y a des tweets contenant ce mot-clé
    const existingTweets = await Tweet.find({ text: { $regex: query, $options: "i" } });

    if (existingTweets.length > 0) {
      console.log(`✅ ${existingTweets.length} tweets trouvés dans MongoDB pour "${query}"`);

      // Analyse des sentiments sur les tweets récupérés de la base
      const sentiment = new Sentiment();
      const analyzed = existingTweets.map((t) => {
        const a = sentiment.analyze(t.text);
        let score = a.comparative;
        let label = "Neutre";
        if (score > 0) { label = "Positif"; score = Math.min(score * 100, 100); }
        else if (score < 0) { label = "Négatif"; score = Math.max(-score * 100, 0); }

        return {
          tweetId: t.tweetId,
          text: t.text,
          sentiment: label,
          score: score.toFixed(2),
        };
      });

      return res.json(analyzed);
    }

    // 🤖 Sinon, on interroge Twitter (si pas déjà dans Mongo)
    const result = await twitterClient.v2.search(query, { max_results: 10 });
    const tweets = result.data?.data || [];

    if (tweets.length === 0) {
      return res.status(404).json({ error: "Aucun tweet trouvé." });
    }

    const analyzed = await Promise.all(
      tweets.map(async (t) => {
        const a = sentiment.analyze(t.text);
        let score = a.comparative;
        let label = "Neutre";
        if (score > 0) { label = "Positif"; score = Math.min(score * 100, 100); }
        else if (score < 0) { label = "Négatif"; score = Math.max(-score * 100, 0); }

        const tweetData = {
          tweetId: t.id,
          text: t.text,
        };

        await Tweet.create(tweetData); // 💾 enregistrement dans MongoDB

        return {
          tweetId: t.id,
          text: t.text,
          sentiment: label,
          score: score.toFixed(2),
        };
      })
    );

    res.json(analyzed);
  } catch (error) {
    console.error("Erreur Twitter :", error);
    const msg = error.code === 429
      ? "Limite API atteinte, réessayez plus tard."
      : "Erreur interne lors de la recherche.";
    res.status(500).json({ error: msg });
  }
});
app.get("/search/:query", async (req, res) => {
    const { query } = req.params;
    const sentiment = new Sentiment();
  
    try {
      // 🔁 1. Essayer d’abord avec l’API Twitter
      const result = await twitterClient.v2.search(query, { max_results: 10 });
      const tweets = result.data?.data || [];
  
      if (tweets.length === 0) {
        return res.status(404).json({ error: "Aucun tweet trouvé sur Twitter." });
      }
  
      // 🔍 2. Analyser + enregistrer les nouveaux tweets dans Mongo
      const analyzed = await Promise.all(
        tweets.map(async (t) => {
          const a = sentiment.analyze(t.text);
          let score = a.comparative;
          let label = "Neutre";
          if (score > 0) { label = "Positif"; score = Math.min(score * 100, 100); }
          else if (score < 0) { label = "Négatif"; score = Math.max(-score * 100, 0); }
  
          const tweetData = {
            tweetId: t.id,
            text: t.text,
          };
  
          await Tweet.create(tweetData); // 💾 Enregistrement
  
          return {
            tweetId: t.id,
            text: t.text,
            sentiment: label,
            score: score.toFixed(2),
          };
        })
      );
  
      return res.json(analyzed);
    } catch (error) {
      console.warn("⚠️ Échec appel Twitter API :", error.code || error.message);
  
      // 👀 3. Si erreur, on regarde dans Mongo
      const fallbackTweets = await Tweet.find({ text: { $regex: query, $options: "i" } });
  
      if (fallbackTweets.length > 0) {
        console.log(`📦 ${fallbackTweets.length} tweets trouvés dans MongoDB en fallback`);
  
        const analyzed = fallbackTweets.map((t) => {
          const a = sentiment.analyze(t.text);
          let score = a.comparative;
          let label = "Neutre";
          if (score > 0) { label = "Positif"; score = Math.min(score * 100, 100); }
          else if (score < 0) { label = "Négatif"; score = Math.max(-score * 100, 0); }
  
          return {
            tweetId: t.tweetId,
            text: t.text,
            sentiment: label,
            score: score.toFixed(2),
          };
        });
  
        return res.json(analyzed);
      }
  
      // 4. Rien trouvé dans Mongo non plus
      const msg = error.code === 429
        ? "Limite API atteinte et aucun tweet en cache local."
        : "Erreur interne et aucun tweet en cache.";
      return res.status(500).json({ error: msg });
    }
  });
  
    
    
    const PORT = 5000;
    app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error(" Erreur de connexion MongoDB :", err);
    process.exit(1); // Arrêter le process si pas de DB
  });
