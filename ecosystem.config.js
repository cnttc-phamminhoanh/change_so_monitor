/* PM2 config cho SO change monitor (Germton).
   Server tự serve cả API lẫn client/dist nên chỉ cần 1 process duy nhất.

   Cách dùng:
     cd C:\Users\germt\OneDrive\Desktop\germton-service\change_so_monitor
     npm install -g pm2              (chỉ lần đầu)
     cd client; npm run build        (build lại khi sửa frontend; dist đã có sẵn)
     cd ..
     pm2 start ecosystem.config.js
     pm2 status                      (xem trạng thái)
     pm2 logs so-monitor             (xem log)
     pm2 restart so-monitor          (restart sau khi sửa code server)
     pm2 save; pm2 startup           (tự chạy lại khi máy khởi động — tuỳ chọn)

   Lưu ý: mọi biến môi trường (PORT, DB_SERVER, DB_USER, DB_PASSWORD, ...)
   được đọc từ server/.env — không cần khai báo lại ở đây.
*/
'use strict';

const path = require('path');

module.exports = {
  apps: [
    {
      name: 'so-monitor',
      cwd: './server',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      watch: false,
      time: true,
      out_file: path.join(__dirname, 'logs', 'so-monitor-out.log'),
      error_file: path.join(__dirname, 'logs', 'so-monitor-error.log'),
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
