# Google Books Search

This is a simple web application built with React (bootstrapped with [Create React App](https://github.com/facebook/create-react-app))
that allows searching of the Google Books data set via the Google Books API

Run `npm install` to install dependencies
Then run `npm start` and Open [http://localhost:3000](http://localhost:3000) to view it in your browser.


## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.

## AN IMPORTANT NOTE ABOUT API LIMITATIONS AND MY APPROACH:

_The Google Books API has a maxResults limit of 40_

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
The application would work the same way with 'volumes' set to that larger list
So it would just be a matter of implementing the promise.all procedure to pull down all the volumes.

## OTHER IMPROVEMENTS:

An improvement to this implementation would be to get and set URL Search Parameters (query string args) 
to allow for initializing state from the url.
So a URL to this app with "?q=shrek&s=20&i=4" in the search area would immediately search for books about "shrek"
and display the results starting at the third page (20-29) with the 4th item expanded
Then as the user does a new search, and interacts, the URL would update so that they could send the state
to another user.\
