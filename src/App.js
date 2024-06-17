import React, { useState } from 'react';
import axios from 'axios';

import {
    Container,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    Collapse,
    CircularProgress,
    Box,
    Grid
} from '@mui/material';
import './App.css';

/*
AN IMPORTANT NOTE ABOUT API LIMITATIONS AND MY APPROACH:

The Google Books API has a maxResults limit of 40

My initial approach was to keep the request payload small and fetch only 10 at a time 
This would do a query for every 'page' of results.

However, the requirements call for some displayed values that require looking at the ENTIRE set of volumes:
 
 "The search as a whole should also return the:
  total number of search results,
  name of the single author who appears most commonly in the results,
  earliest and most recent publication dates within the search parameters,"

The response from the API does include a "totalItems" so I can use that, 
but for the most common author(s) and the earliest and most recent
I need to look at each volume's data payload

I decided for this exercise just to use the max query (40) and implement the features 
as if that was the total payload (other than the total volume count)
So the component shows the most common author within the fetched 40 volumes, and the earliest and most recent from that 40 volumes.

All queries will just return 40 volumes or less (there will usually be 10 pages.)

If I were to implement this to display all volumes for any given query
I would do an initial query to get the "totalItems" value and the first 40 volumes 
Then I would use Promise.all() with a list of API urls setting the startIndex and maxResults
values incrementally so that I fetch all of the remaining volumes
The component below would work the same way with 'volumes' set to that larger list
So it would just be a matter of implementing the promise.all procedure to pull down all the volumes.

OTHER IMPROVEMENTS:

An improvement to this implementation would be to use get and set URL Search Parameters (query string args) 
to allow for initializing state from the url.
So a URL to this app with "?q=shrek&s=20&i=4" in the search area would immediately search for books about "shrek"
and display the results starting at the third page (20-29) with the 4th item expanded
Then as the user does a new search, and interacts, the URL would update so that they could send the state
to another user.

*/

function App() {
  const [query, setQuery] = useState(''); // search query - string
  const [volumes, setVolumes] = useState([]); // results of search - array of objects
  const [displayedVolumes, setDisplayedVolumes] = useState([]); // utility state -- just the 10 displayed volumes
  // NB: the books API allows for startIndex and maxResults -- so we could do more efficient calls over the wire
  // however the requirements for most frequent author, oldest and newest only make sense if we make an exhaustive query 
  const [itemCount, setItemCount] = useState(0);
  const [mostFrequentAuthor, setMostFrequentAuthor] = useState('');
  const [oldest, setOldest] = useState('');
  const [newest, setNewest] = useState('');
  const [responseTime, setResponseTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(-1);
  const [startIndex, setStartIndex] = useState(0);
  const [resCount, setResCount] = useState(0);


  const searchBooks = async () => {
    setLoading(true);
    setExpandedIndex(-1);
    const startTime = new Date().getTime();
    try {
      // Using axios to abstract the JSON-P fetch
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
          params: {
              q: query,
              maxResults: 40
          }
      });

      const endTime = new Date().getTime();
      setResponseTime((endTime - startTime) / 1000);

      const data = response.data;
      console.log("Results: ", data);
      setItemCount(data.totalItems);
      console.log('how many items?' , data.items.length);
      setResCount(data.items.length);
      setTitle();
      const authors = data.items.flatMap(item => item.volumeInfo.authors || []);
      const authorCount = authors.reduce((acc, author) => {
          acc[author] = (acc[author] || 0) + 1;
          return acc;
      }, {});
      console.log("authorcount", authorCount);
      let mostFreqAuth = Object.keys(authorCount).reduce((a, b) => authorCount[a] > authorCount[b] ? a : b, '');
      if (authorCount[mostFreqAuth] && authorCount[mostFreqAuth] > 1) {
        let mfas = [];
        for (const [key, value] of Object.entries(authorCount)) {
          if (value == authorCount[mostFreqAuth]) {
            mfas.push(key)
          }
        }
        setMostFrequentAuthor(mfas.join(', '))
      } else {
        setMostFrequentAuthor('')
      }

      const pubDates = data.items.map(item => item.volumeInfo.publishedDate).filter(Boolean);
      const formattedDates = pubDates.map(date => new Date(date)).sort((a, b) => a - b);
      setOldest(formattedDates.length ? formattedDates[0].toISOString().split('T')[0] : 'N/A');
      setNewest(formattedDates.length ? formattedDates[formattedDates.length - 1].toISOString().split('T')[0] : 'N/A');

      setVolumes(data.items);
      setDisplayedVolumes(data.items.slice(0, 10))
    } catch (error) {
      //NB: tell user about error
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      
    }
  }

  const handleSearch = (e) => {
      e.preventDefault()
      setStartIndex(0);
      searchBooks(0);
  };

  const setTitle = (opt_range) => {
    console.log(resCount);
    document.title = `${query} | Google Books Search` + (opt_range || '');
  }

  const handleNextPage = () => {
      const newIndex = startIndex + 10;
      setStartIndex(newIndex);
      setExpandedIndex(-1);
      setDisplayedVolumes(volumes.slice(newIndex, newIndex + 10));
      setTitle(` | ${newIndex} - ${newIndex + 10}`);
  };

  const handlePrevPage = () => {
      const newIndex = Math.max(startIndex - 10, 0);
      setStartIndex(newIndex);
      setExpandedIndex(-1);
      setDisplayedVolumes(volumes.slice(newIndex, newIndex + 10));
      setTitle(` | ${newIndex} - ${newIndex + 10}`);
  };

  const toggleDescription = (index) => {
      setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  return (
    <Container>
      <header className='dq-gbs-header'><Typography  variant="h1" gutterBottom>Google Books Search</Typography></header>
      <form onSubmit={handleSearch}>
      <TextField
          label="Search query"
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
      />
      <Box mt={2} mb={2}>
          <Button variant="contained" color="primary" type="submit" disabled={loading || !query.trim()}>
              {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
          <Button onClick={handlePrevPage} disabled={startIndex === 0 || loading}>
              Previous
          </Button>
          <Button onClick={handleNextPage} disabled={loading || (startIndex + 10) >= resCount}>
              Next
          </Button>
      </Box>
      </form>
      <Box mt={2} mb={2}>
          <Typography>Total Items: {itemCount}</Typography>
          <Typography>Most Common Author(s): {mostFrequentAuthor || "no single author is most common"}</Typography>
          <Typography>Earliest Date: {oldest}</Typography>
          <Typography>Latest Date: {newest}</Typography>
          <Typography>Response Time: {responseTime}s</Typography>
      </Box>
      <List>
          {displayedVolumes.map((volume, index) => (
              <Box key={index} mb={2}>
                  <ListItem button onClick={() => toggleDescription(index)}>
                      <ListItemText
                          primary={`${(volume.volumeInfo.authors || []).join(', ')} - ${volume.volumeInfo.title}`}
                      />
                  </ListItem>
                  <Collapse in={expandedIndex === index} timeout="auto" unmountOnExit>
                      <Box pl={4}>
                          <Typography>{volume.volumeInfo.description || 'No description available'}</Typography>
                      </Box>
                  </Collapse>
              </Box>
          ))}
      </List>
    </Container>
  );
}

export default App;
