// this.me/src/methods/properties.js
/**
 * @module Properties
 * @description Methods to manage properties for the `Me` class.
 */

/**
 * Validates a property before adding it.
 * @function
 * @param {Object} property - The property to validate.
 * @throws {Error} If the property is invalid.
 */
function validateProperty(property) {
  if (!property || typeof property !== 'object') {
    throw new Error('Invalid property: Must be a non-null object.');
  }
}

/**
 * Adds a property to the identity.
 * @function
 * @param {Array} properties - The properties array to update.
 * @param {Object} property - The property to add (e.g., { type: "ETH", address: "0x123..." }).
 */
function addProperty(properties, property) {
  validateProperty(property);
  properties.push(property);
}

/**
 * Retrieves all properties for the identity.
 * @function
 * @param {Array} properties - The properties array to retrieve from.
 * @returns {Array} The properties array.
 */
function getProperties(properties) {
  return [...properties]; // Return a shallow copy to prevent mutation outside
}

/**
 * Removes a property from the identity.
 * @function
 * @param {Array} properties - The properties array to update.
 * @param {Object} property - The property to remove.
 */
function removeProperty(properties, property) {
  validateProperty(property);
  const index = properties.findIndex(p => JSON.stringify(p) === JSON.stringify(property));
  if (index !== -1) properties.splice(index, 1);
}

/**
 * Checks if a specific property exists.
 * @function
 * @param {Array} properties - The properties array.
 * @param {Object} property - The property to check.
 * @returns {boolean} True if the property exists, otherwise false.
 */
function hasProperty(properties, property) {
  validateProperty(property);
  return properties.some(p => JSON.stringify(p) === JSON.stringify(property));
}

// Named exports
export { addProperty, getProperties, removeProperty, hasProperty };

// Default export (optional for easier import as an object)
export default {
  addProperty,
  getProperties,
  removeProperty,
  hasProperty
};