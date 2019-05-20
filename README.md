# dividend-discoverer
Tool to find the best dividends for a maximum passive income

# Preparation of the project
- Create a OAUTH2 credential id in https://console.developers.google.com
- Copy the webapp/src/environments/environment.prod.ts.template to environment.prod.ts
- Replace the values there

- copy config.json.template to config.json and config.prod.json and add information in the new file

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