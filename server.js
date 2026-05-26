const express = require('express');
const app = express();
const PORT = process.env.PORT || 7001;

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});