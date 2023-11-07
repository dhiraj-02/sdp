const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 9000;
app.use(cors());

const userRoutes = require('./routes/userRoutes');
const caseRoutes = require('./routes/caseRoutes');
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/user/', userRoutes);

app.use('/api/case/', caseRoutes);

app.listen(PORT, () => {
    console.log(`Node server running on port: ${PORT}`);
});