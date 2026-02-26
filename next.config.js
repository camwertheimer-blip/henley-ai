/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '50mb',
      },
    },
    api: {
      bodyParser: {
        sizeLimit: '50mb',
      },
    },
  };
  
  module.exports = nextConfig;
  ```
  
  Then replace `route.ts` with the file I gave you above, install the package, and push:
  ```
  npm install pdf-parse
  git add .
  git commit -m "large file support with PDF text extraction"
  git push