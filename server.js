const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // 移除查詢參數並清理 URL
  const url = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);

  // 檢查檔案是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 如果檔案不存在，回到 index.html (SPA 行為)
      filePath = path.join(DIST_DIR, 'index.html');
      console.log(`File not found, serving index.html for: ${req.url}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error(`Error reading file ${filePath}:`, err);

        // 如果連 index.html 都找不到，返回一個基本的錯誤頁面
        if (err.code === 'ENOENT' && filePath.endsWith('index.html')) {
          const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Build Error</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
        .error-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #d32f2f; }
        .details { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>🚫 Build Failed</h1>
        <p>The frontend build process did not complete successfully.</p>
        <div class="details">
            <h3>Possible Causes:</h3>
            <ul>
                <li>Expo export command failed to generate dist directory</li>
                <li>Build process encountered errors during compilation</li>
                <li>Missing dependencies or configuration issues</li>
            </ul>
        </div>
        <p><strong>Next Steps:</strong> Check the Railway build logs for detailed error messages.</p>
    </div>
</body>
</html>
          `;
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallbackHtml);
          return;
        }

        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(content);
      console.log(`Served: ${filePath} (${contentType})`);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);

  // 檢查 dist 目錄是否存在
  fs.access(DIST_DIR, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('ERROR: Dist directory does not exist!', DIST_DIR);
      console.log('This indicates that the build process failed.');
      console.log('Check the build logs for errors in the Expo export command.');
    } else {
      // 列出檔案
      fs.readdir(DIST_DIR, (err, files) => {
        if (err) {
          console.error('Error reading dist directory:', err);
        } else {
          console.log('Dist directory contents:', files);
        }
      });
    }
  });
});