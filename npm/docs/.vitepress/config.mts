import { defineConfig } from "vitepress";

export default defineConfig({
  title: "this.me",
  description: "The this.me language engine",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "API", link: "/api/" }
    ]
  }
});
