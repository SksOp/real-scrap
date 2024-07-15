// Im the express module and required functions
import express from 'express';
import { fetchPageData } from './api/fetchpage.js';
import { scrapePageData } from './api/scrapper.js';
import { mergeFunction } from './utils/merge.js';
import cors from 'cors';

// Create an Express application
const app = express();

app.use(express.json());

console.log('--------------------------------');
// Enable CORS
app.use(
  cors({
    origin: '*', // Allow only this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable sending cookies and HTTP authentication
  })
);
// Define a port
const PORT = process.env.PORT || 5000;

app.post('/api', async (req, res) => {
  const { platformEmail, brokerEmail } = req.body;
  console.log('fetching Data');
  const [propertyData, byrutData] = await Promise.all([
    fetchPageData(brokerEmail),
    scrapePageData(platformEmail),
  ]);

  // const propertyData = await scrapePageData(platformEmail)

  // const byrutData = await fetchPageData(brokerEmail)
  


  console.log('Data fetched successfully');
  // console.log('Property Data: ', propertyData, 'byrut Data:', byrutData);

  // console.log('propertyData', propertyData);

  // console.log('byrutData', byrutData);
  const mergeData = mergeFunction(propertyData, byrutData);

  // return res.json(propertyData);

  // return res.json(byrutData);

  return res.json(mergeData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
