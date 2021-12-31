# shopify-bopis

Shopify BOPIS PDP App


## Firebase Hosting

We are using firebase hosting for the Pre-order app deployment
Here are the steps to deploy app on firebase hosting

### Prerequisite

- [Firebase Cli](https://firebase.google.com/docs/cli) should be installed
- Firebase project should be created
- You should have access to firebase project

### Dev deployment

- Update the DEV instance url at .env.production file

- Build the application using following command
  `ionic build`

- Login into firebase
  `firebase login`

- Run following command to deploy to firebase hosting
  `firebase deploy --only hosting:sm-dev`

## How to build application in different environment or modes(staging, production, qa, etc)?

As there is a bug in Ionic cli due to which we cannot pass flag variables for commands (See [#4669](https://github.com/ionic-team/ionic-cli/issues/4642)). To build application in different modes we need to use vue-cli-service to build and then use the built app using capacitor copy command further.

Follow following instructions:

1. Manually build the application using vue-cli-service:
   npx vue-cli-service build --mode=sandbox

2. Copy web assets to the native project without building the app:
   ionic capacitor copy ios --no-build

3. Open the Android Studio / XCode project:
   ionic capacitor open android  
   ionic capacitor open ios



## How to build script:  
npm run build
## Requirements when installing the app on a store:
- Need to have a div with class name product-form__controls-group--submit
- Need the store insance url on which the app needs to be installed
- Need the instance url for fetching the inventory information

## To Do:
- Create a wrapper in hc for the shopify admin API, so to call the API directly from front-end.
- Currently, hardcoded the variant that we are adding to the cart but need to update this when we will fetching the variant information directly using Shopify API.
- Design a UI to get the instance url of the store on which the app needs to be installed.
- Design a UI to get the instance url for fetching the inventory information.
- Show the add to cart popup on click of the pick up button

## Working
- We are using the script tag API to insert out script in a specific store
  Advantage: Using script API will help to remove the script automatically whenever the app is unistalled from store.
- Using the 'dev-hc.hotwax.io/api/checkInventory' endpoint to fetch the inventory information, it returns the facilityId which is then added to the cart item properties when adding the product to the cart.

## UI
- Added a button, using which we fetch the stores information and check for stock availability
- Inserted a div with a fixed height
- Displaying the information in the div and making it scrollable
- Added another button, using which customer can add an item in the cart having a facilityId

## Resources
- Script for the bopis app is hosted on the demo-hc instance
- CSS required for the app is directly inserted in the theme.scss.liquid file in the shopify store


## Links for reference
- Admin API :- https://shopify.dev/docs/admin-api
- Ajax API :- https://shopify.dev/docs/themes/ajax-api
- Authenticating app using OAuth :- https://shopify.dev/tutorials/authenticate-a-public-app-with-oauth
- Embed an app in Shopify Admin :- https://shopify.dev/tutorials/embed-your-app-in-the-shopify-admin
