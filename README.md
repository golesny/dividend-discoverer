# dividend-discoverer
Tool to find the best dividends for a maximum passive income in 30y

# External accounts needed
- Create a OAUTH2 credential id (Free): https://console.developers.google.com
- Create a fixer-io account (Free): https://fixer.io/product
- Create an alpha vantage account (Free): https://www.alphavantage.co/support/#api-key

# Preparation of the project
- Copy the webapp/src/environments/environment.prod.ts.template to environment.prod.ts
- Replace your values there
- copy config.json.template to config.json and config.prod.json and add information in the new file
- create a database and insert for the structure the SQL from file db.init.sql
- create a row in table users with your e-mail and google unique id (this is a 21(?) digits long number)

# build & run on localhost (Google Login)
- cd webapp
- ng build [--watch=true]
- cd ..
- npm start -- dev
- call http://localhost:8080

# build & deploy project to GAE
- cd webapp
- ng build --prod
- cd ..
- gcloud app deploy [--project=PROJECT_ID]
- see url from output
- see logs with: gcloud app logs tail -s default

# install the cron job
- gcloud app deploy cron.yaml
- see [[ https://cloud.google.com/appengine/docs/standard/nodejs/scheduling-jobs-with-cron-yaml ]]