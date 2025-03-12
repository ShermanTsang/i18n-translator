import antfu from "@antfu/eslint-config";

export default antfu({
  rules: {
    "no-console": "off",
    "import/order": "off",
    "prettier/prettier": "error",
  },
  formatters: {},
  extends: ["eslint:recommended", "prettier"],
  plugins: ["prettier"],
});
