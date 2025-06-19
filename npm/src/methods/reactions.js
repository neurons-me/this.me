//this.me/src/methods/reactions.js
/**
 * @module Reactions
 * @description Methods to manage reactions for the `Me` class.
 */
/**
 * Add a reaction to a target.
 * @function
 * @param {Array} reactions - The reactions array to update.
 * @param {string} type - The type of reaction (e.g., "like", "comment").
 * @param {string} target - The target of the reaction (e.g., "PostID").
 * @param {string} [content=null] - Additional content for the reaction (e.g., a comment).
 * @throws {Error} If the type or target is invalid.
 */
export function react(reactions, type, target, content = null) {
    if (!type || !target) {
      throw new Error('Invalid reaction parameters');
    }
    reactions.push({ type, target, content, timestamp: new Date() });
  }
  
  /**
   * Retrieve all reactions for the identity.
   * @function
   * @param {Array} reactions - The reactions array to retrieve from.
   * @returns {Array} The reactions array.
   * @instance
   */
  export function getReactions(reactions) {
    return reactions;
  }