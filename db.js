import Datastore from 'nedb';
import path from 'path';

// Initialize the NeDB database
const dbPath = path.join('./data', 'bot.db');
const db = new Datastore({ filename: dbPath, autoload: true });

// Function to insert an article into the database
export function insertDocument(article) {
    return new Promise((resolve, reject) => {
        db.insert(article, (err, newDoc) => {
            if (err) {
                reject(err);
            } else {
                resolve(newDoc);
            }
        });
    });
}

// Function to query articles from the database
export function queryDocuments(query = {}, limit = 10) {
    return new Promise((resolve, reject) => {
        db.find(query)
            .limit(limit)
            .exec((err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
    });
}

// Optional: Function to ensure indexes for faster queries
export function ensureIndex(fieldName) {
    db.ensureIndex({ fieldName }, (err) => {
        if (err) {
            console.error(`Error creating index on ${fieldName}:`, err);
        } else {
            console.log(`Index created on ${fieldName}`);
        }
    });
}