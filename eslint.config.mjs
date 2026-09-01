import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  ignores: [".eve/**", ".data/**", ".output/**", ".nuxt/**"],
});
