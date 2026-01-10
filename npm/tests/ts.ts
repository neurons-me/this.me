import { ME } from "../dist/me.es.js";
const me: any = new ME("test", "secret");
// semantic writes
me.profile.name("Abella");
me.profile.age(30);
// semantic reads
const name: string = me("profile.name");
const age: number = me("profile.age");
// type check only
console.log(name, age);