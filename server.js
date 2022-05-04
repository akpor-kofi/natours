const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  //handles uncaught synchronous codeB
  console.log('UNCAUGHT EXCEPTION: shutting down');
  console.log(err.name, '🥲', err.message);
  // should instantly crash the system cause your program is not in a clean state
  process.exit(1);
});

//connect environment configurations
dotenv.config({ path: './config.env' });
const app = require('./app');

// connection string
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection established');
  })
  .catch((err) => {
    console.log(`an error occurred: ${err}`);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port  ${port}...`);
});

process.on('unhandledRejection', (err) => {
  // handles all unhandled promise rejection
  console.log(err.name, '🥲', err.message);
  console.log('UNHANDLED REJECTION: shutting down');
  //SHOULD ALWAYS GRACEFULLY close server in this situation
  server.close(() => {
    process.exit(1);
  });
});
