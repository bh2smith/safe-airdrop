module.exports = {
  plugins: ["import"],
  extends: [
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "react-app",
    "prettier",
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
