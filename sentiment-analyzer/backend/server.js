const express = require("express");
const cors = require("cors");
const { TwitterApi } = require("twitter-api-v2");
const Sentiment = require("sentiment");  // Si vous utilisez sentiment pour l'analyse
const mongoose = require("mongoose");
require("dotenv").config();

// Configuration de l'API Twitter
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Connexion à MongoDB (en utilisant MongoDB Atlas ou MongoDB local)
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connecté à la base de données MongoDB"))
    .catch((error) => console.error("Erreur de connexion MongoDB:", error));

const app = express();
app.use(cors());
app.use(express.json());

// Schéma Mongoose pour un Tweet
const tweetSchema = new mongoose.Schema({
    tweetId: { type: String, required: true, unique: true },
    text: { type: String, required: true },
    sentiment: { type: String },
    score: { type: Number },
    date: { type: Date, default: Date.now },
});

// Modèle pour les tweets
const Tweet = mongoose.model("Tweet", tweetSchema);

// Initialisation de l'analyseur de sentiment
const sentiment = new Sentiment();

// Route de test pour vérifier si le serveur fonctionne
app.get("/", (req, res) => {
    res.send("Serveur backend en ligne !");
});

// Route pour récupérer des tweets et analyser le sentiment
app.get("/search/:query", async (req, res) => {
    const { query } = req.params;

    try {
        // ✅ Étape 1 : Vérifier si des tweets similaires sont déjà en base
        const cachedTweets = await Tweet.find({ text: { $regex: query, $options: 'i' } });

        if (cachedTweets.length > 0) {
            console.log("✅ Données chargées depuis MongoDB.");
            return res.json(
                cachedTweets.map((tweet) => ({
                    tweetId: tweet.tweetId,
                    text: tweet.text,
                    sentiment: tweet.sentiment,
                    score: tweet.score.toFixed(2),
                }))
            );
        }

        // ✅ Étape 2 : Sinon, appel à l’API Twitter
        const result = await twitterClient.v2.search(query, { max_results: 10 });
        const tweets = result.data?.data || [];

        const analyzedTweets = await Promise.all(
            tweets.map(async (tweet) => {
                const sentimentAnalysis = sentiment.analyze(tweet.text);
                let scorePercentage = 0;

                if (sentimentAnalysis.comparative > 0) {
                    scorePercentage = Math.min(sentimentAnalysis.comparative * 100, 100);
                } else if (sentimentAnalysis.comparative < 0) {
                    scorePercentage = Math.max(sentimentAnalysis.comparative * -100, 0);
                }

                let sentimentType = "Neutre";
                if (sentimentAnalysis.comparative > 0) {
                    sentimentType = "Positif";
                } else if (sentimentAnalysis.comparative < 0) {
                    sentimentType = "Négatif";
                }

                const existingTweet = await Tweet.findOne({ tweetId: tweet.id });
                if (!existingTweet) {
                    const newTweet = new Tweet({
                        tweetId: tweet.id,
                        text: tweet.text,
                        sentiment: sentimentType,
                        score: scorePercentage,
                    });
                    await newTweet.save();
                }

                return {
                    tweetId: tweet.id,
                    text: tweet.text,
                    sentiment: sentimentType,
                    score: scorePercentage.toFixed(2),
                };
            })
        );

        res.json(analyzedTweets);
    } catch (error) {
        if (error.code === 429) {
            console.error("Trop de requêtes envoyées à l'API Twitter. Attendez un peu...");
            return res.status(429).json({ error: "Trop de requêtes envoyées. Réessayez dans quelques minutes." });
        }
        console.error("Erreur lors de la recherche Twitter:", error.message);
        res.status(500).json({ error: "Erreur lors de la recherche." });
    }
});


// Démarrage du serveur
app.listen(5000, () => console.log("Serveur lancé sur le port 5000"));
