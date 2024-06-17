require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

const routes = require('./routes');
app.use('/api', routes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: `Sorry, can't find the route ${req.originalUrl}`,
        error: null,
        data: null
    });
});

// 500 handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: false,
        message: 'Something broke!',
        error: err.message,
        data: null
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('listening on port', PORT))

