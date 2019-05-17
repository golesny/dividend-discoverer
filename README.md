# dividend-discoverer
Tool to find the best dividends for a maximum passive income

# Preparation of the project
- copy config.json.template to config.json and add information in the new file
- copy webapp/src/environments/environments.prod.ts.template to environments.prod.ts and add information

# build & deploy on localhost
- cd webapp
- ng build
- cd ..
- npm start -- dev

# build & deploy project to GAE
- cd webapp
- ng build --prod
- cd ..
- gcloud app deploy