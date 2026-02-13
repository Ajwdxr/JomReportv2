const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**", 
      "out/**", 
      "build/**", 
      "next-env.d.ts",
      "public/**"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "prefer-const": "warn"
    }
  }
];

module.exports = eslintConfig;
