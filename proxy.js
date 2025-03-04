/* eslint-disable no-undef */
import axios from 'axios'; // Import d'Axios
import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());

// Route qui accepte l'URL à récupérer en tant que paramètre
app.get('/proxy', async (req, res) => {
  const { url } = req.query; // Récupère l'URL depuis les paramètres de la requête

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  try {
    // Utilisation d'Axios pour effectuer la requête vers l'URL fournie.
    console.log('Receiving url ', url);

    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json', // Tu peux ajouter d'autres headers ici si nécessaire
      },
    });

    res.json(response.data); // Renvoie la réponse JSON de l'URL
  } catch (error) {
    // Si l'URL cible retourne une erreur
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Démarre le serveur sur le port 3001
app.listen(3001, () => console.log('Proxy en écoute sur http://localhost:3001'));
