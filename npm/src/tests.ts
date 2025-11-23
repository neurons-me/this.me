import me from "./browser/me.browser.ts";
async function runTests() {
  console.log("🧪 Running tests for this.me...");
  try {
    const status = await me.status();
    console.log("Status:", status);
    if (status && typeof status.active === "boolean") {
      console.log("✅ status() returns a valid MonadStatus object");
    } else {
      console.error("❌ status() did not return a valid response");
    }

    const identities = await me.listIdentities();
    console.log("Identities:", identities);
    if (Array.isArray(identities)) {
      console.log("✅ listIdentities() returns an array");
    } else {
      console.error("❌ listIdentities() did not return an array");
    }
  } catch (error) {
    console.error("❌ Error during test execution:", error);
  }
}

runTests();