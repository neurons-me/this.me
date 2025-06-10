 // Attributes methods
 /**
 * @module Attributes
 * @description Methods to manage attributes for the `Me` class, with key-vaue pairs.
 */
/**
   * @description Adds or updates an attribute for the `me` instance.
   * 
   * This method allows you to dynamically add or update descriptive attributes 
   * for the `me` instance. Attributes are stored as key-value pairs, where:
   * - The **key** represents the name of the attribute (e.g., "name", "age", "location").
   * - The **value** represents the data associated with that attribute (e.g., "Sui Gn", 30, "Earth").
   * 
   * You can add as many key-value pairs as you want, giving you the flexibility to describe 
   * the `me` instance with plain data. The attributes are stored in an object, and each call 
   * to `be` either adds a new attribute or updates an existing one if the key already exists.
   * 
   * This approach ensures that the `me` instance can evolve and be customized over time 
   * with additional or modified attributes as needed.
   * 
   * @param {string} key - The attribute key (e.g., "name").
   * @param {string|number|boolean|Object} value - The attribute value associated with the key. 
   *   This can be any data type (e.g., string, number, boolean, or even a nested object).
   * 
   * @example
   * // Adding a single attribute
   * me.be("name", "Sui Gn");
   * console.log(me.getAttributes()); // { name: "Sui Gn" }
   * 
   * // Adding multiple attributes
   * me.be("age", 30);
   * me.be("location", "Earth");
   * console.log(me.getAttributes()); 
   * // Output: { name: "Sui Gn", age: 30, location: "Earth" }
   * 
   * // Updating an existing attribute
   * me.be("name", "John Doe");
   * console.log(me.getAttributes()); 
   * // Output: { name: "John Doe", age: 30, location: "Earth" }
   * 
   * // Using complex data types
   * me.be("preferences", { theme: "dark", language: "en" });
   * console.log(me.getAttributes());
   * // Output: { name: "John Doe", age: 30, location: "Earth", preferences: { theme: "dark", language: "en" } }
   */
export function be(attributes, key, value) {
    if (!key || typeof key !== 'string') {
        throw new Error('Invalid key for attribute');
    }
    attributes[key] = value;
  }
  /**
     * @description Retrieves all attributes associated with the `me` instance.
     * 
     * This method provides access to the current set of attributes stored in the `me` instance 
     * as an object containing key-value pairs. Each key represents the name of an attribute, 
     * and its corresponding value represents the data stored for that attribute.
     * 
     * You can either:
     * - Retrieve all attributes at once as a single object.
     * - Access specific attributes directly using their keys.
     * 
     * @returns {Object} An object containing all the key-value pairs representing 
     * the attributes of the `me` instance.
     * 
     * @example
     * // Retrieving all attributes
     * console.log(me.getAttributes()); 
     * // Output: { name: "Sui Gn", age: 30, location: "Earth" }
     * 
     * // Accessing specific attributes by their key
     * const attributes = me.getAttributes();
     * console.log(attributes.name); // "Sui Gn"
     * console.log(attributes.age); // 30
     * console.log(attributes.location); // "Earth"
     */
  export function getAttributes(attributes) {
    return attributes;
  }