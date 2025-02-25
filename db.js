import Datastore from 'nedb';
import path from 'path';

// Initialize the NeDB database
const dbPath = path.join('./data', 'bot.db');
const db = new Datastore({ filename: dbPath, autoload: true });

// Function to insert an document into the database
export function insertDocument(document) {
    return new Promise((resolve, reject) => {
        db.insert(document, (err, newDoc) => {
            if (err) {
                reject(err);
            } else {
                resolve(newDoc);
            }
        });
    });
}

// Function to update a document in the database
export function updateDocument(query, update, options = {}) {
    return new Promise((resolve, reject) => {
      db.update(query, update, options, (err, numAffected) => {
        if (err) {
          reject(err);
        } else {
          resolve(numAffected); // Resolve with the number of affected documents
        }
      });
    });
}
// Function to delete a document from the database
export function deleteDocument(query, options = {}) {
    return new Promise((resolve, reject) => {
        db.remove(query, options, (err, numRemoved) => {
            if (err) {
                reject(err);
            } else {
                resolve(numRemoved); // Resolve with the number of documents removed
            }
        });
    });
}
// Function to query documents from the database
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