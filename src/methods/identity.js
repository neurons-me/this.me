/**
 * @module Identity
 * @description Methods to manage identity for the `Me` class.
 */

/**
 * Sets up the identity for a `Me` instance.
 * @function
 * @param {string} username - The username to set for the identity.
 * @returns {Object} The identity object containing the username.
 * 
 * @example
 * const identity = setup("suiGn");
 * console.log(identity); // { username: "suiGn" }
 */
export function setup(username) {
  return { username };
}

/**
* Retrieves the username (identity) of the `Me` instance.
* @function
* @param {Object} identity - The identity object of the `Me` instance.
* @returns {Object} The `Me` username identity object.
* 
* @example
* console.log(getMe({ username: "suiGn" })); // { username: "suiGn" }
*/
export function getMe(identity) {
  return identity;
}