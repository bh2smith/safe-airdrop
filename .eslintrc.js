module.exports = {
  plugins: ["import"],
  extends: ["plugin:import/typescript", "plugin:prettier/recommended", "react-app", "prettier"],
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
  overrides: [
    {
      files: ["*.test.ts", "*.test.tsx"],
      rules: {
        "@typescript-eslint/no-unused-expressions": "off",
      },
    },
  ],
};
