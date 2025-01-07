//this.me/src/me.js
import Registry from './registry';
class Me {
  static registry = Registry.load();
  constructor(username = 'default') {
    if (Me.registry[username]) {
      throw new Error(`Username ${username} already exists.`);
    }

    this.username = username;
    this.identity = {
      username,
      devices: [],
    };

    this.addDevice(); // Automatically adds the current device
    Me.registry[username] = this.identity;
    Registry.save(Me.registry);
  }

  static load(username) {
    if (!Me.registry[username]) {
      throw new Error(`Username ${username} does not exist.`);
    }
    return new Me(username, Me.registry[username]);
  }

  addDevice(deviceInfo = null) {
    const device = deviceInfo || {
      deviceId: crypto.randomUUID(),
      hostname: os.hostname(),
      platform: os.platform(),
      isPrimary: this.identity.devices.length === 0,
    };

    this.identity.devices.push(device);
    Registry.save(Me.registry);
  }

  removeDevice(deviceId) {
    this.identity.devices = this.identity.devices.filter((d) => d.deviceId !== deviceId);
    Registry.save(Me.registry);
  }

  listDevices() {
    return this.identity.devices;
  }

  static getAllUsers() {
    return Object.keys(Me.registry);
  }
}

export default Me;
