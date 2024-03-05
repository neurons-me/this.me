//src/me.js
/**
 * Represents a user identity in the this.me system.
 */
class Me {
    /**
     * Create a me instance.
     * @param {string} name - The first name of the user.
     * @param {string} lastname - The last name of the user.
     * @param {string} birthday - The birthday of the user in YYYY-MM-DD format.
     * @param {string} password - The password chosen by the user.
     * @param {string} pin - The personal identification number chosen by the user.
     */
    constructor(name, lastname, birthday, password, pin) {
        this.name = name;
        this.lastname = lastname;
        this.birthday = birthday;
        this.password = password;
        this.pin = pin;
    }

    /**
     * Validates the user data. Throws an error if any field is empty.
     * @throws Will throw an error if a required field is missing.
     */
    validateData() {
        if (!this.name || !this.lastname || !this.birthday || !this.password || !this.pin) {
            throw new Error("All fields must be filled");
        }
        // Further validation rules can be added here
    }
    
    /**
     * Prepares and returns the identity object for hashing .me.
     * @returns {Object} The identity object (.me) with user data.
     */
    getMe() {
        this.validateData();
        return {
            name: this.name,
            lastname: this.lastname,
            birthday: this.birthday,
            password: this.password, // Password as a separate field
            pin: this.pin           // Pin as a separate field
        };
    }
}

export default Me;
