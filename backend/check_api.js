const http = require('http');

http.get('http://localhost:5000/api/folders', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
}).on('error', err => console.error(err));
