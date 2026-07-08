function write(category, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${category}] ${message}`);
}

export const logger = {
  log: (category, message) => write(category, message),
  error: (message) => write("ERROR", message),
};
