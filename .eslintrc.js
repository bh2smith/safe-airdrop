module.exports = {
  plugins: ["import", "prettier"],
  extends: [
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    // "react-app",
  ],
  ignorePatterns: ["build/", "node_modules/", "!.prettierrc.js", "lib/"],
  rules: {
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
        },
      },
    ],
  },
};
