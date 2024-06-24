const fs = require('fs');
const path = require('path');

// Create a writable stream
const logFile = fs.createWriteStream(path.join(__dirname, 'app.log'), { flags: 'a' });

function formatMessage(message) {
  if (typeof message === 'object') {
    try {
      return JSON.stringify(message, null, 2);
    } catch (error) {
      return message.toString();
    }
  }
  return message;
}

function log(message, ...optionalParams) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `${timestamp} - ${formatMessage(message)} ${optionalParams.map(formatMessage).join(' ')}\n`;
  
  // Write to console
  console.log(formattedMessage);
  
  // Write to file
  logFile.write(formattedMessage);
}

function error(message, ...optionalParams) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `${timestamp} - ERROR: ${formatMessage(message)} ${optionalParams.map(formatMessage).join(' ')}\n`;

  // Write to console
  console.error(formattedMessage);
  
  // Write to file
  logFile.write(formattedMessage);
}

module.exports = { log, error };
