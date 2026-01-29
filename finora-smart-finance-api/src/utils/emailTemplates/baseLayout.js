/**
 * Email Base Layout & Shared Styling
 * Gemeinsames Layout für alle Email-Templates
 */

const config = require('../../config/env');
const frontendBaseUrl = config.frontendUrl || 'http://localhost:3001';

/**
 * Basis-Layout für alle Emails
 * @param {string} content - Der Email-Inhalt
 * @returns {string} Vollständiges HTML
 */
function baseLayout(content) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finora</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #1f2937;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      color: #92400e;
    }
    .info {
      background: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      color: #1e40af;
    }
    .link-fallback {
      word-break: break-all;
      color: #6366f1;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Finora</h1>
    </div>
    ${content}
  </div>
</body>
</html>
  `;
}

module.exports = {
  baseLayout,
  frontendBaseUrl,
};
