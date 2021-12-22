# shopify-bopis

Shopify BOPIS App

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
