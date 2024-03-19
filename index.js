//index.js
/**
 * @module This.Me
 * @description
 * This.Me adapts to various environments, enabling `.me` objects to function both locally and within a network. 
 *  A `.me` object authenticated on a network accesses data beyond the local scope, 
 *  while unauthenticated instances are confined to local data.
 *  This dual functionality ensures seamless interoperability and heightened security.
 *  Command Definitions and Interactive Shell.*/

// index.js in the `this.me` package
import Me from './src/me.js';
let ia = new Me('.Lisa');
let me = ia.getMe();

console.log('.me:', me);
console.log('Hello, I am', me);
console.log('Who are you?', Me);
export default Me;
