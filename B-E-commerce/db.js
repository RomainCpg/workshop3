import fs from 'fs';

const filePath = './db.json';

// Fonction pour lire les données du fichier JSON
const readData = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data); // Convertit le contenu du fichier JSON en objet JavaScript
    } catch (err) {
        console.error('Erreur lors de la lecture du fichier JSON', err);
        return { products: [], orders: [], carts: [] }; // Retourne des données par défaut si erreur
    }
};

// Fonction pour écrire des données dans le fichier JSON
const writeData = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Données sauvegardées');
    } catch (err) {
        console.error('Erreur lors de l\'écriture dans le fichier JSON', err);
    }
};

// Exemple d'utilisation : lire et manipuler les données
const db = readData();
console.log('Données actuelles :', db);

// Ajout d'un produit
const newProduct = { id: 5, name: "Smartphone", description: "A new smartphone", price: 499.99, category: "Electronics", inStock: true };
db.products.push(newProduct);

// Sauvegarder les nouvelles données dans le fichier
writeData(db);
