/**
 * @module Relationships
 * @description Manages user relationships.
 */

// Function to add a relationship
export function addRelationship(relationships, relationship) {
  if (!relationship || !relationship.type || !relationship.username) {
    throw new Error('Invalid relationship object. Must include type and username.');
  }

  relationships.push(relationship);
}

// Function to retrieve relationships
export function getRelationships(relationships, type = null) {
  if (type) {
    return relationships.filter(rel => rel.type === type);
  }
  return relationships;
}

// Function to initialize relationships for a user
export function createRelationships() {
  return [];
}