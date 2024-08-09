import Me from './me.js';
import chalk from 'chalk';

// Create a new Me instance
let me = new Me('suign');
// Add attributes to the identity
me.be({ fullName: "Jose", lastName: "Abella" });
me.be({ xy: "z" });
console.log(me.identify());
// Examplconsole.log(me.identity());e with another instance
let anotherMe = new Me('anotherUser');
anotherMe.be({ nickname: "hero", favoriteColor: "blue" });
console.log(anotherMe.identify());
// Create a new Me instance with dynamic property name
let user = 'suign';
let users = {};
users[user] = new Me(user);
// Add attributes to the identity
users[user].be({ fullName: "ZZZ", lastName: "WWW" });
users[user].be({ xy: "axax" });
console.log(users[user]);


