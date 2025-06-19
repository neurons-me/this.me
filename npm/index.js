// index.js
/**
 * @module This.Me
 * @description
 *  This.Me is a data-structured identity...    
 */

import { validateSetup } from './src/scripts/setup_validation.js';
validateSetup(); // Asegura que ~/.this y ~/.this/me existen antes de continuar
import Me from './src/me.js';
// when a user declares "I am %.me," their digital existence is affirmed and recorded in the system.
export default Me;