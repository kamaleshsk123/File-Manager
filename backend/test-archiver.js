const archiver = require('archiver');
const fs = require('fs');

const output = fs.createWriteStream(__dirname + '/test.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', function(err) {
  console.error("Archive error:", err);
});

archive.pipe(output);

try {
    archive.append('', { name: 'testfolder/' });
    console.log("Appended empty string");
} catch(e) {
    console.error("Append error:", e);
}

archive.finalize();
