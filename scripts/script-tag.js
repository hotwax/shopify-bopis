(function () {
    let jQueryBopis, $location, backdrop, currentProduct, body, homeStore, stores, userHomeStore, otherStores, latlon, userLocationPoint, userZipCode, facility, shippingInventory, hcHomeStoreZipCode;
  
    // location data mapping
    const locationJSON = {
        "<facility-id-hotwax>": "<shopify-loation-id>"
    }
    
    // defining a global object having properties which let merchant configure some behavior
    this.bopisCustomConfig = {
        'enableCartRedirection': true,
        'searchProximity': 50, // the radius (in miles) in which the stores needs to be searched
        'searchInputPlaceholder': 'Search by zip code (50 mile radius)',
        'shippingMethods': ['Standard', '2 day', 'Overnight']
      };
      
      let baseUrl = '';
      let maargUrl = ""
  
    let loadScript = function(url, callback){
  
        let script = document.createElement("script");
        script.type = "text/javascript";
  
        if (script.readyState){ 
            script.onreadystatechange = function(){
                if (script.readyState == "loaded" || script.readyState == "complete"){
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {
            script.onload = function(){
                callback();
            };
        }
    
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
        
    };
  
    // adding css in the current page
    let style = document.createElement("link");
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = '';    // shopId and baseUrl is configured on server
  
    document.getElementsByTagName("head")[0].appendChild(style);
  
    if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn['jquery']) < 1.7)) {
        loadScript('//ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js', async function(){
            jQueryBopis = jQuery.noConflict(true);
            jQueryBopis(document).ready(async function() {
                // initialiseBopis();
                await init();
            });
  
        });
    } else {
        jQueryBopis = jQuery;
        jQuery(document).ready(async function() {
            // initialiseBopis();
            await init();
        });
    }
  
    /*
    Fetch the current location of the user using browser's navigator object
  
    @return {location}
    */
    function getCurrentLocation () {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        })
    }
  
    // function will open the modal for the bopis
    function openBopisModal (event) {
        const eventTarget = jQueryBopis(event.target);
  
        // to stop event bubbling when clicking on the Check Stores button
        event.preventDefault();
        event.stopImmediatePropagation();
  
        backdrop = jQueryBopis('<div id="hc-backdrop"></div>');
        jQueryBopis("body").append(backdrop);
        // add overflow style to disable background scroll when modal is opened
        jQueryBopis("body").css("overflow", "hidden");
        jQueryBopis(".hc-bopis-modal")[0].style.display = "block";
    }
  
    function closeBopisModal () {
        jQueryBopis(".hc-bopis-modal")[0].style.display = "none";
        jQueryBopis("body").css("overflow", "scroll");
        backdrop.remove();
    }

    // function will open the modal for the edd
    function openEDDModal (event) {
        const eventTarget = jQueryBopis(event.target);
  
        // to stop event bubbling when clicking on the Check Stores button
        event.preventDefault();
        event.stopImmediatePropagation();
  
        backdrop = jQueryBopis('<div id="hc-backdrop"></div>');
        jQueryBopis("body").append(backdrop);
        // add overflow style to disable background scroll when modal is opened
        jQueryBopis("body").css("overflow", "hidden");
        jQueryBopis(".hc-edd-modal")[0].style.display = "block";
    }
  
    function closeEDDModal () {
        jQueryBopis(".hc-edd-modal")[0].style.display = "none";
        jQueryBopis("body").css("overflow", "scroll");
        backdrop.remove();
    }
  
    /*
    Gets the user home store code from the localStorage

    @return {string} user's home store code and empty string if not found
    */
    function getUserStorePreference() {
        const storeCode = localStorage.getItem('HC_CURRENT_STORE')
        return storeCode && storeCode !== 'null' ? storeCode : '';
    }
  
    /*
        Adds a loader/spinner to the elementId passed. Cloning the spinner object before appending as to not share the same reference when adding on multiple places
  
        @param {string} elementId Element to which the spinner/loader needs to be added
    */
    function addLoader(elementId) {
        jQueryBopis(elementId).append(spinner.clone());
    }
  
    /*
        This method adds the spinner in the header section. Defined a separate method due to styling issues.
        Adds a loader/spinner to the home store element.
    */
    function addHomeStoreLoader() {
        jQueryBopis('#hc-home-store #store').append('<i class="fa fa-spinner hc-loading"></i>');
    }
  
    /*
        Removes a loader/spinner from the elementId passed. It search for `hc-loader-parent` class inside the elementId passed
  
        @param {string} elementId Element from which the spinner/loader needs to be removed
    */
    function removeLoader(elementId) {
        jQueryBopis(`${elementId} > .hc-loader-parent`).remove();
    }
  
    /*
      Add clear icon on the input field when the input field has some value in it
  
      @param {identifier} form identifier inside which we need to search for input field
    */
      function toggleClearIcon(identifier, event) {
        event.preventDefault();
        if(jQueryBopis(`${identifier} input`).val().length) {
            jQueryBopis(`${identifier} .hc-close-icon`).show();
        } else {
            jQueryBopis(`${identifier} .hc-close-icon`).hide();
        }
    }
  
    /*
      Clears the search field text and makes the default search
  
      @param {string} identifier
    */
    function clearSearch(identifier, event) {
        event.preventDefault();
  
        jQueryBopis(`${identifier} input`).val('').trigger('input');    // triggering input event, as when using val() function to update the value of input, input event does not trigger automatically
        jQueryBopis(`${identifier} button`).click();
    }
  
    // For standard shipping method we need to calculate the shippingEstimate for warehouse,
    // if the product inventory is available on warehouse, otherwise we need to check the estimate
    // for store, that's why we are accepting store and warehouse both in this method
    function getShippingEstimate(store, warehouse) {
        const storeDistance = warehouse ? warehouse.dist : store.dist;
        const isRetailStore = store.storeType === 'RETAIL_STORE';

        return bopisCustomConfig.shippingMethods.map((method) => {
        const date = new Date();

        // Getting PST hours of current time as we need to calculate shipping estimate
        const [hour, minute] = new Date().toLocaleString('default', { hour: 'numeric', minute: 'numeric' }).split(':');

        let timeRemaining = '';

        const isStandardShippingMethod = method === 'Standard';
        let days = 0;
        let hours = 0;

        if (isStandardShippingMethod) {
            if (storeDistance < 300) days += 2;
            else if (storeDistance < 600) days += 3;
            else if (storeDistance > 600) days += 5;
        } else if (method === '2 day') {
            timeRemaining += hour < 12 ? `${11 - hour} hrs` : '';
            timeRemaining += hour < 12 && minute <= 59 ? ` ${59 - minute} mins` : '';
        }

        switch (currentDay) {
            case 0:
                hours += isStandardShippingMethod ? 48 : 24;
                break;
            case 1: case 2: case 3: case 4: case 5:
                hours += isStandardShippingMethod ? 24 : 0;
                hours += !isStandardShippingMethod && hour > 12 ? 24 : 0;
                break;
            case 6:
                if (isStandardShippingMethod) {
                    hours += warehouse ? 24 : 48;
                } else if (isRetailStore) {
                    hours += 48;
                } else if (hour > 12) {
                    hours += 24;
                }
                break;
            default:
                break;
        }

        date.setHours(date.getHours() + hours);
        date.setDate(date.getDate() + days);

        if (method === '2 day') date.setDate(date.getDate() + 2);
        else if (method === 'Overnight') date.setDate(date.getDate() + 1);

        // Add 1 day to the estimated date as Delivery is not done on Sunday for any Shipping option
        // Add 2 day to the estimated date as Delivery is not done on Saturday for any Shipping option
        // date.getDay will return 0 for Sunday, thus added boolean check here
        if (!date.getDay()) {
            date.setDate(date.getDate() + 1);
        } else if (date.getDay() === 6) {
            date.setDate(date.getDate() + 2);
        }

        return {
            shippingMethodDesc: method,
            formattedDeliveryDate: date.toLocaleString('default', { day: 'numeric', weekday: 'short', month: 'short' }),
            timeRemaining,
        };
        });
    };

    /*
    Function fetches the current location(lat, lon) of the user by calling getCurrentLocation function and if found, then fetches the
    zipCode for the latLon, and sets the zipCode in the input search field using `val` method and then call the click event for the button
    element of the identifier

    @param {string} identifier Form element identifier inside which `Use My Location` feature is used
    @param {event} event Event for which the function is called
    */
    async function fetchStoresUsingCurrentLocation(identifier, event) {
        event.preventDefault();

        jQueryBopis(`${identifier} input`).val('');

        try {
            const userLocation = await getCurrentLocation()
            $location = userLocation.coords;
        } catch(err) {
            console.error(err.message)
        }

        userLocationPoint = $location ? `${$location.latitude}, ${$location.longitude}` : ''
        let zipCode = ''

        // user's latLon are available then only fetching the zipCode for the latLon
        if(userLocationPoint) {
            zipCode = await getZipCodeForLatlon(userLocationPoint);
        }

        latlon = userLocationPoint;
        userZipCode = zipCode;
        jQueryBopis(`${identifier} i`).removeClass('fa-location-dot').addClass('fa-location-pin-lock');
        jQueryBopis(`${identifier} input`).val(zipCode);
        jQueryBopis(`${identifier} button`).click();

        // checking for zipCode as in some cases we might not have zipCode available for a latLon and in that we don't need to display the clear icon
        // triggering input event, as when using val() function to update the value of input, input event does not trigger automatically
        if(zipCode) {
            jQueryBopis(`${identifier} input`).trigger('input');
        }
    }
  
    async function getCurrentProduct() {
        await jQueryBopis.getJSON(`${window.location.pathname}.js`, function(product) {
            currentProduct = product;
        });
    }
  
    async function isProductAvailable(variantSku) {
        const hasInventoryOnShopify = jQueryBopis("input.hc_inventory").val() > 0
        return !!currentProduct && (hasInventoryOnShopify || currentProduct.variants.find((variant) => variant.sku == variantSku).inventory_policy === 'continue')
    }
  
    /*
      Function performs the initial operation for bopis app, like fetching homeStore ele, getting shopifyShopId, defining spinner/loader and,
      calling methods to display stores information in header and PDP
      */
    async function init() {
        body = jQueryBopis("body")
        homeStore = jQueryBopis('#hc-home-store');
        spinner = jQueryBopis('<div class="hc-loader-parent"><i class="fa fa-spinner hc-loading"></i></div>')
        await updateStoresInformation();

        body.on('click', function(event) {
            if (event.target == jQueryBopis("#hc-dropdown-backdrop")[0]) {
                closeStoreDropdown();
            }
        })
    }
  
    const currentDay = new Date().getDay();
  
    /*
      Function prepares the distance to be displayed on the UI.
      Used parseFloat as toFixed returns a string and thus toLocaleString method does not work
  
      @param {object} store Object containing store information
      @return {string} distance with one decimal value and postfix with `mi`
      */
    function getStoreDistance(store) {
        // used parseFloat as toFixed returns a string and thus toLocaleString method does not work
        return store.dist && store.dist != 'Infinity' ? parseFloat((store.dist).toFixed(1)).toLocaleString() + ' mi' : ''
    }
  
    /*
      Generates the store information card to be displayed on the dropdown page
  
      @param {object} store Contains store information
      @return {ele} HTML DOM element that will be appended in dropdown
      */
    function generateStoreInformationDropdownCard(store) {
        const storeTodayTiming = getStoreTodayTiming(store.timings);
  
        let $storeInformationCard = jQueryBopis(`
        <div class="hc-store-title"><h4 class="hc-font-m">${store.storeName}</h4>
            <span>${getStoreDistance(store)}</span>
        </div>
        <div id="hc-store-dropdown-details">
            <div id="hc-store-dropdown-details-column">
            <p class="hc-text">${store.address1 ? store.address1 : ''}</p>
            <p class="hc-text">${store.city ? store.city : ''}${store.stateCode ? `, ${store.stateCode}` : ''}${store.postalCode ? `, ${store.postalCode}` : ''}${store.countryCode ? `, ${store.countryCode}` : ''}</p>
            </div>
            <div id="hc-store-dropdown-details-column">
            <p class="hc-text">
            ${store.storePhone ? '<i class="fa fa-phone hc-icon hc-list-icon" tabindex="0"></i>' : ''}
            <a href=tel:${store.storePhone ? store.storePhone : ''}>${store.storePhone ? store.storePhone : ''}</a>
            </p>
            <p class="hc-text">
            ${storeTodayTiming.open ? '<i class="fa fa-regular fa-clock hc-icon hc-list-icon" tabindex="0"></i>' : ''}
            ${storeTodayTiming.open ? 'Open Today: <wbr>' + storeTodayTiming.open + ' - ': ''} ${ storeTodayTiming.close ? storeTodayTiming.close : ''}
            </p>
            </div>
        </div>`);
  
        return $storeInformationCard;
    }
  
    /*
      Updates the home store for the user whenever user changes the home store either from the header dropdown or from PDP page
  
      @param {object} store The store object which will be the home store
      @param {event} event custom event pbject
      */
    async function updateUserStorePreference(store, event) {
  
        // empty the store information element as to clear the record and update it
        // This check is needed to enable mutation observer when store changes from find-a-store page, as when changing store from find-a-store page no DOM mainpulation happens
        jQueryBopis('.hc-store-information').empty();
  
        latlon = '' // making latlon empty whenever changing the home store, if not then when fetching the stores again, it honors the searched zipcode latlon
  
        // updating currentStore information(storeCode, name, and latlon) in the localStorage
        store.storeName && (localStorage.setItem('HC_CURRENT_STORE_NAME', store.storeName)); // storing home store name in localStorage, as to display store name on collection/category page
        store.latlon && (localStorage.setItem('HC_CURRENT_STORE_LAT_LON', store.latlon)); // storing home store latLon in localStorage to use when fetching stores information on the basis of homeStore latLon
        localStorage.setItem('HC_CURRENT_STORE', store.storeCode);
  
        // if the user is logged-in then updating the customer's defaultStore information
        if (customerId && shopifyShopId) {
            await setCustomerDefaultStore(store.storeCode);
        }
  
        // closes the dropdown selector, after setting the home store, if the home store is set from dropdown
        const eventTargetClass = jQueryBopis(event.target)[0].className;
        if (eventTargetClass.includes("hc-home-store-dropdown-button")) {
            closeStoreDropdown();
        }
    }
  
    /*
      Renders passed stores on the UI as child elements of parentId
  
      @param {array} stores Array of stores to be displayed on UI
      @param {string} parentIdentifier
      */
    function renderStoresInDropdown(stores, parentIdentifier) {
        removeLoader(parentIdentifier);
  
        if(!Array.isArray(stores) || stores.length <= 0) {
            jQueryBopis(parentIdentifier).append('<div>No stores found</div>');
            return;
        }
  
        stores.map((store) => {
            let $storeDropdownCard = jQueryBopis('<div id="hc-store-dropdown-card"></div>');
            $storeDropdownCard.append(generateStoreInformationDropdownCard(store));
  
            // only display `SET AS MY STORE` when the current store is not the homeStore and pickup is allowed on the store
            if (store.pickup_pref && !store.isHomeStore) {
                let $setAsHomeStoreButton = jQueryBopis('<div class="hc-home-store-dropdown-button hc-pointer" tabindex="0" style="color: #C59A2A">SET AS MY STORE</div>');
                $setAsHomeStoreButton.on("click", updateUserStorePreference.bind(null, store));
                $storeDropdownCard.append($setAsHomeStoreButton);
            }
  
            if (!store.pickup_pref) {
                storeDropdownCard.append(jQueryBopis('<h4 style="margin-top: 10px; text-align: start; font-size: .8em;" tabindex="0">Store Pickup Unavailable</h4>'));
            }
  
            let $lineBreak = jQueryBopis('<hr class="hc-horizontal-rule"/>')
            $storeDropdownCard.append($lineBreak);
  
            jQueryBopis(parentIdentifier).append($storeDropdownCard);
  
            // hide all the h4 and p tags which are empty in the modal
            jQueryBopis(parentIdentifier).find('h4:empty').hide();
            jQueryBopis(parentIdentifier).find('p:empty').hide();
        })
    }
  
    /*
      Function handles the logic for store search in the dropdown
      */
    async function searchStoresInDropdown(event) {
        jQueryBopis('#hc-other-stores').empty();
        addLoader('#hc-other-stores');

        event.preventDefault();
        const zipCode = jQueryBopis(".hc-bopis-store-pin").val()
        const userHomeStoreCode = getUserStorePreference();

        // if we have user's location point then changing the title to Results as the stores are fetched on the basis of user's location
        if(userLocationPoint) {
            jQueryBopis('#hc-other-stores-title > .hc-store-dropdown-title').text('Results:');
        } else if(!zipCode) {
            // if made an empty search then not fetching the latlon from server and assigning latlon an empty value
            jQueryBopis('#hc-other-stores-title > .hc-store-dropdown-title').text(`${userHomeStoreCode ? 'Other Stores:' : 'Select a Store'}`);
            latlon = '';
        } else {
            jQueryBopis('#hc-other-stores-title > .hc-store-dropdown-title').text('Results:');
            !latlon && (latlon = await getLatLonForZipCode(zipCode));
        }

        // removing the fa-location-pin-lock icon and adding fa-location-dot icon if user's location is not available but the current icon is pin-lock
        if(!userLocationPoint && jQueryBopis('.hc-bopis-form i').hasClass('fa-location-pin-lock')) {
            jQueryBopis('.hc-bopis-form i').removeClass('fa-location-pin-lock').addClass('fa-location-dot')
        }

        // making userLocationPoint empty after checking some UI condition as once the searchbar is used for searching
        // we don't need to have lock icon for location in search bar
        userLocationPoint = ''

        // If the latlon for searched zipcode is not present then display error string
        if(zipCode && !latlon) {
            renderStoresInDropdown([], '#hc-other-stores')
            return;
        }

        let searchedStores = stores;

        if(latlon) {
            searchedStores = await fetchStores();
        }

        if (searchedStores && searchedStores.length > 0) {
            searchedStores.map((store) => {
                if(store.storeCode === userHomeStoreCode) {
                    store.isHomeStore = true
                } else {
                    store.isHomeStore = false
                }
            })

            const otherStores = searchedStores.filter((store) => store.storeCode !== userHomeStoreCode);

            // only display home store information again, when some searched is made otherwise do not display
            // home store information
            if (!zipCode) {
                renderStoresInDropdown(otherStores, '#hc-other-stores')
                latlon = ''
                return;
            }

            renderStoresInDropdown(searchedStores, '#hc-other-stores')
        } else {
            // if no stores found for the searched zipCode
            renderStoresInDropdown([], '#hc-other-stores')
        }
        latlon = ''
    }
  
    /*
      Function handles the logic for store search on PDP page
      TODO: when enabled make sure to update the search logic by checking the search logic of dropdown
      */
    async function searchStoresOnPDP(event) {
        // jQueryBopis(`#hc-pdp-other-stores-${productId}`).empty();
        // addLoader(`#hc-pdp-other-stores-${productId}`);

        if(event) {
            event.preventDefault();
        }
        const zipCode = jQueryBopis(".hc-edd-pin").val()
        const userHomeStoreCode = getUserStorePreference();

        // if made an empty search then not fetching the latlon from server and assigning latlon an empty value
        if(!zipCode) {
        //     jQuery(`.hc-pdp-other-stores-title-${productId}`).text(`${userHomeStoreCode ? 'Other Stores:' : 'Select a Store:'}`)
            latlon = '';
        } else {
        //     jQuery(`.hc-pdp-other-stores-title-${productId}`).text("Results:")
            !latlon && (latlon = await getLatLonForZipCode(zipCode));
        }

        if(zipCode == userZipCode) {
            jQueryBopis('#hc-edd-form i').removeClass('fa-location-dot').addClass('fa-location-pin-lock')
        } else if(jQueryBopis('#hc-edd-form i').hasClass('fa-location-pin-lock')) {
            jQueryBopis('#hc-edd-form i').removeClass('fa-location-pin-lock').addClass('fa-location-dot')
        }

        // If the latlon for searched zipcode is not present then display error string
        if(zipCode && !latlon) {
            jQueryBopis("#hc-edd-title").hide();
            jQueryBopis(".hc-no-store-found").show();
            // renderEDD("")
            return;
        }

        let searchedStores = shippingInventory;

        if(latlon) {
            searchedStores = await fetchStores();

            const sku = jQueryBopis("input.hc_product_sku").text() || jQueryBopis("input.hc_product_sku").val();
            const storeCodes = searchedStores.map((store) => store.storeCode)
            shippingInventory = await checkShippingInventory(sku, storeCodes)
        }

        if(searchedStores && searchedStores.length > 0) {

            searchedStores.map((store) => {
                if(store.storeCode === userHomeStoreCode) {
                    store.isHomeStore = true
                } else {
                    store.isHomeStore = false
                }
            })

        //   const otherStores = searchedStores.filter((store) => store.storeCode !== userHomeStoreCode);

            // only display home store information again, when some searched is made otherwise do not display
            // home store information and only display otherStores information
            // Added this check as after completing search for the first time we again needs to display the other stores information
            if (!zipCode) {
                jQueryBopis("#hc-edd-title").hide();
                jQueryBopis(".hc-no-store-found").show();
                latlon = ''
                return;
            }


            if(shippingInventory && shippingInventory.resultList.length > 0) {
                const resultList = shippingInventory.resultList[0]
                const shippingFacility = resultList.facilities.find(fac => fac.atp > 0)
    
                if(shippingFacility) {
                    facility = searchedStores.find((location) => location.storeCode === shippingFacility.facilityId)
                    await renderEDD(zipCode);
                } else {
                    jQueryBopis("#hc-edd-title").hide();
                    zipCode && jQueryBopis(".hc-no-store-found").show();
                }
            }
        } else {
            // if no stores found for the searched zipCode
            zipCode && jQueryBopis(".hc-no-store-found").show();
        }
        latlon = ''
    }
  
    /*
      Function added the store search form in the dropdown and defines click event for location icon and button
      */
      function renderStoreSearchFormInDropdown() {
        const bopisForm = jQueryBopis(`<form class="hc-bopis-form">
            <div class="hc-input-wrapper">
                <input class="hc-bopis-store-pin" name="pin" aria-label="${bopisCustomConfig.searchInputPlaceholder}" placeholder="${bopisCustomConfig.searchInputPlaceholder}" style="width: 100%; border:0px;"/>
                <i class="fa-solid fa-xmark hc-icon hc-close-icon" style="display: none;" tabindex="0"></i>
                <i class="fa-solid fa-location-dot hc-icon hc-location-icon" tabindex="0"></i>
            </div>
            <button type="submit" class="btn hc-bopis-pick-up-button">Find Stores</button>
        </form>`)
        jQueryBopis('#hc-dropdown-bopis-form').append(bopisForm);
  
        // calling toggleClearIcon function when the input event is triggered
        jQueryBopis('.hc-bopis-store-pin').on('input', toggleClearIcon.bind(null, '.hc-bopis-form'));
        jQueryBopis(".hc-bopis-form .hc-close-icon").on('click', clearSearch.bind(null, '.hc-bopis-form'))
  
        jQueryBopis(".hc-bopis-form .hc-location-icon").on('click', fetchStoresUsingCurrentLocation.bind(null, '.hc-bopis-form'));
  
        jQueryBopis(".hc-bopis-pick-up-button").on('click', searchStoresInDropdown);
    }
  
    /*
      Function checks for homeStore and otherStores and then calls renderStoresInDropdown to display store information on UI
      */
      function updateStoresInformationInDropDown() {
        if (jQueryBopis('.hc-caret-icon').length == 0) {
            const caretDownIcon = jQueryBopis('<i class="fa fa-caret-down hc-caret-icon" style="cursor: pointer;"></i>')
            homeStore.append(caretDownIcon);
        }
  
        jQueryBopis("#hc-store-dropdown") && jQueryBopis("#hc-store-dropdown").remove();
  
        let $storeDropdown = jQueryBopis(`<div id="hc-store-dropdown" class="hc-store-dropdown">
            <div class="hc-store-dropdown-content">
                <div class="hc-store-dropdown-information">
                    <div id="hc-home-store-information-dropdown">
                        <div id="hc-my-store-title"></div>
                        <div id="hc-my-store"></div>
                    </div>
                    <div id="hc-dropdown-bopis-form"></div>
                    <div id="hc-other-stores-information-dropdown">
                        <div id="hc-other-stores-title"></div>
                        <div id="hc-other-stores"></div>
                    </div>
                </div>
            </div>
        </div>`);
  
        jQueryBopis("#hc-my-store-bopis").append($storeDropdown);
  
        if (userHomeStore) {
            const storeTodayTiming = getStoreTodayTiming(userHomeStore.timings);
            const homeStoreName = userHomeStore.storeName + ' ' + (storeTodayTiming.open && storeTodayTiming.close ? `<span id="home-store-metadata">(Open from ${storeTodayTiming.open} to ${storeTodayTiming.close})</span>` : '<span id="home-store-metadata">(Closed Today)</span>')
            jQueryBopis('#hc-home-store #store').html(homeStoreName);
  
            let $userHomeStoreTitle = jQueryBopis('<h2 class="hc-store-dropdown-title hc-font-xl">My Store:</h2>');
            jQueryBopis('#hc-my-store-title').append($userHomeStoreTitle);
  
            renderStoresInDropdown([userHomeStore], '#hc-my-store')
        }
  
        renderStoreSearchFormInDropdown();
  
        if (otherStores && otherStores.length) {
            let $otherStoresTitle = jQueryBopis(`<h2 class="hc-store-dropdown-title hc-font-xl">${userHomeStore ? 'Other Stores:' : 'Select a Store'}</h2>`);
            jQueryBopis('#hc-other-stores-title').append($otherStoresTitle);
        }
  
        // removing all the children from hc-other-stores, as when searching we need to clear all the previous data
        jQueryBopis('#hc-other-stores').empty();
  
        renderStoresInDropdown(otherStores, '#hc-other-stores');
  
        homeStore.on('click', openStoreDropdown);
    }
  
    /*
      Function calls the getStoreInformation method to get the store information and prepare the store timing object for the stores
  
      @return {array} An array of object containing stores information, and empty if stores not found
      */
    async function fetchStores() {
        let storesInformationResp;
  
        try {
            storesInformationResp = await getStoreInformation();
        } catch(err) {
            // if storeLookup api throws any error than removing the loader added and also changed text to default text
            jQueryBopis('#hc-home-store #store > .hc-loading').remove();
            jQueryBopis('#hc-home-store #store').text('Select a store');
        }
        let storesInformation = [];
  
        if(storesInformationResp && storesInformationResp.response && storesInformationResp.response.numFound > 0) {
            storesInformation = storesInformationResp.response.docs.map((store) => {
                store.timings = getStoreTiming(store);
                return store;
            })
        }
        return storesInformation;
    }
  
  
    /*
      It fetches the updated stores information by calling fetchStores function and then set the userHomeStore and otherStores information globally
      Also, calls the functions to update stores information in dropdown and on PDP
    */
    async function updateStoresInformation() {
        const userHomeStoreCode = getUserStorePreference();
  
        // only adding loaders only when we have some information of homeStore to update
        if(userHomeStoreCode) {
            // empty the home store information in the header and adds a loader on the same
            jQueryBopis('#hc-home-store #store').empty();
            addHomeStoreLoader();
        }
        stores = await fetchStores();
  
        // assigning initial values to global variables
        userHomeStore = ''
        otherStores = []
  
        if(stores.length > 0) {
            userHomeStore = userHomeStoreCode ? stores.find((store) => store.storeCode === userHomeStoreCode) : '';
            otherStores = userHomeStoreCode ? stores.filter((store) => store.storeCode !== userHomeStoreCode) : stores;
  
            if(userHomeStore) {
                userHomeStore.isHomeStore = true;
            }
  
            otherStores.map((store) => store.isHomeStore = false)
        }
  
        updateStoresInformationInDropDown();
  
        // only update stores information on PDP when we are on product details page
        if(location.pathname.includes('/products/')) {
            await initialiseBopis();
            await initialiseEDD();
        }
    }
  
    // function will open the modal for the stores information
    function openStoreDropdown (event) {
        // to stop event bubbling when clicking on the Check Stores button
        event.preventDefault();
        event.stopImmediatePropagation();

        dropdownBackdrop = jQueryBopis('<div id="hc-dropdown-backdrop"></div>');
        body.append(dropdownBackdrop);

        jQueryBopis('#hc-home-store .hc-caret-icon').remove();
        const caretUpIcon = jQueryBopis('<i class="fa fa-caret-up hc-caret-icon" style="cursor: pointer;"></i>')
        homeStore.append(caretUpIcon);

        jQueryBopis(".grid.grid--no-gutters.grid--table.site-header__mobile-nav")[0].style["z-index"] = "unset";

        // add overflow style to disable background scroll when modal is opened
        body.css("overflow", "hidden");
        jQueryBopis(".hc-store-dropdown").show();
    }
  
    function closeStoreDropdown () {
        jQueryBopis('#hc-home-store .hc-caret-icon').remove();
        const caretDownIcon = jQueryBopis('<i class="fa fa-caret-down hc-caret-icon" style="cursor: pointer;"></i>')
        homeStore.append(caretDownIcon);
        jQueryBopis(".hc-store-dropdown").hide();
        jQueryBopis(".grid.grid--no-gutters.grid--table.site-header__mobile-nav")[0].style["z-index"] = 11;
        body.css("overflow", "scroll");
        jQueryBopis("#hc-dropdown-backdrop").remove();
    }
  
    async function initialiseBopis () {  
        if (location.pathname.includes('/products/')) {
            await getCurrentProduct(); // fetch the information for the current product
  
            // jQueryBopis(".hc-store-information").remove();
            jQueryBopis(".hc-bopis-modal").remove();
  
            // Using this pattern to access sku as the input field is updated in shopify
            const sku = jQueryBopis("input.hc_product_sku").text() || jQueryBopis("input.hc_product_sku").val();
  
            // Do not enable BOPIS when the current product is not available
            // TODO: uncomment this | Commented out, as having inventory specific issues on shopify
            if(!(await isProductAvailable(sku))) return;
  
            const bopisButton = jQueryBopis("#hc-bopis-button");
            const existingBopisButton = jQueryBopis("#hc-bopis-button > button");
  
            // check if the product is Pre-order or backorder and having continue selling enabled and if yes, then do not enable bopis
            if (await isProductProrderedOrBackordered(meta.product.id, sku).catch(err => false)) return;
  
            let $pickUpModal = jQueryBopis(`<div id="hc-bopis-modal" class="hc-bopis-modal">
                <div class="hc-modal-content">
                    <div class="hc-modal-header">
                        <span class="hc-close hc-bopis-close"></span>
                        <h1 class="hc-modal-title">Pick up today</h1>
                    </div>
                    <form id="hc-bopis-form-pdp">
                      <div class="hc-input-wrapper">
                          <input id="hc-bopis-store-pin" name="pin" placeholder="Enter zipcode" style="width: 100%; border:0px;"/>
                          <i class="fa-solid fa-xmark hc-icon hc-close-icon" style="display: none;" tabindex="0"></i>
                          <i class="fa-solid fa-location-dot hc-icon hc-location-icon" tabindex="0"></i>
                      </div>
                      <button type="submit" class="btn hc-bopis-pick-up-button">Find Stores</button>
                    </form>
                    <div class="hc-store-information"></div>
                    <p class="hc-store-not-found"></p>
                </div>
            </div>`);
  
            // check if the element with id hc-bopis-button has button element in it then don't add button
            if (existingBopisButton.length == 0) {
                let $btn = jQueryBopis('<button class="btn btn--secondary-accent hc-open-bopis-modal">Pick Up Today</button>');
                bopisButton.append($btn);
            }
  
            jQueryBopis("body").append($pickUpModal);
  
            bopisButton.on('click', openBopisModal);
  
            jQueryBopis(".hc-bopis-close").on('click', closeBopisModal);
            jQueryBopis("body").on('click', function(event) {
                if (event.target == jQueryBopis("#hc-bopis-modal")[0]) {
                    closeBopisModal();
                  }
            })
            
            jQueryBopis('#hc-bopis-store-pin').on('input', toggleClearIcon.bind(null, '#hc-bopis-form-pdp'));
            jQueryBopis("#hc-bopis-form-pdp .hc-close-icon").on('click', clearSearch.bind(null, '#hc-bopis-form-pdp'))
            jQueryBopis("#hc-bopis-form-pdp .hc-location-icon").on('click', handleAddToCartEvent.bind(null, true));
            jQueryBopis(".hc-bopis-pick-up-button").on('click', handleAddToCartEvent.bind(null, false));
  
            handleAddToCartEvent();
  
        } else if(location.pathname.includes("/cart/")) {
            // finding this property on cart page as some themes may display hidden properties on cart page
            jQueryBopis("[data-cart-item-property-name]:contains('pickupstore')").closest('li').hide();
        }
    }
  
    function getStoreInformation() {
        const payload = {
            viewSize: 100,
            filters: ["storeType: RETAIL_STORE"]
        }
  
        // fetching home store latLon from localStorage
        const homeStoreLatLon = localStorage.getItem('HC_CURRENT_STORE_LAT_LON');
  
        if(latlon) {
            payload["point"] = latlon
        } else if (homeStoreLatLon) {
            payload["point"] = homeStoreLatLon
        }

        // applied a condition that if we have location permission then searching the stores for the current location
        // if we have both location and pin, then using the pin to search for stores
        // if we doesn't have location permission and pin, then will fetch all the available stores
        return new Promise(function(resolve, reject) {
            jQueryBopis.ajax({
                type: 'POST',
                url: `${baseUrl}/api/storeLookup`,
                crossDomain: true,
                data: payload,
                success: function (res) {
                    resolve(res)
                },
                error: function (err, textStatus) {
                    reject(textStatus);
                }
            })
        })
    }
  
    async function checkInventory(payload) {
        const params = {
            filters: {
                sku: payload.sku,
                facilityId: payload.facilityIds,
                facilityId_op: 'in'
            },
            viewSize: payload.facilityIds.length
        }
  
        let resp;
  
        // added try catch to handle network related errors
        try {
            resp = await new Promise(function(resolve, reject) {
                jQueryBopis.ajax({
                    type: 'POST',
                    url: `${baseUrl}/api/checkInventory`, // Replace this with checkCartInventory api
                    crossDomain: true,
                    data: JSON.stringify(params),
                    dataType: 'JSON',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (xhr, textStatus, exception) {
                        reject(textStatus)
                    }
                })
            })
        } catch (err) {
            resp = err;
        }
        return resp;
    }
    
    async function handleAddToCartEvent(useCurrentLocation = false, event) {
        let eventTarget;
        if (event) {
            eventTarget = jQueryBopis(event.target);
            // to stop event bubbling when clicking on the Check Stores button
            event.preventDefault();
            event.stopImmediatePropagation();
        }
  
        const queryString = jQueryBopis("#hc-bopis-store-pin").val();
  
        if(useCurrentLocation) {
            jQueryBopis("#hc-bopis-store-pin").val("")
            try {
                const userLocation = await getCurrentLocation()
                $location = userLocation.coords;
            } catch(err) {
                console.error(err.message)
            }
            userLocationPoint = $location ? `${$location.latitude}, ${$location.longitude}` : ''
            let zipCode = ''
        
            // user's latLon are available then only fetching the zipCode for the latLon
            if(userLocationPoint) {
                zipCode = await getZipCodeForLatlon(userLocationPoint);
            }
            latlon = userLocationPoint;
            userZipCode = zipCode;
            jQueryBopis("#hc-bopis-form-pdp i").removeClass('fa-location-dot').addClass('fa-location-pin-lock');
            jQueryBopis("#hc-bopis-form-pdp input").val(zipCode);
            // checking for zipCode as in some cases we might not have zipCode available for a latLon and in that we don't need to display the clear icon
            // triggering input event, as when using val() function to update the value of input, input event does not trigger automatically
            if(zipCode) {
                jQueryBopis("#hc-bopis-form-pdp input").trigger('input');
            }
        } else {
            // Always fetching latLon for quert String need to optimize this
            latlon = await getLatLonForZipCode(queryString);
        }
  
        // removing the fa-location-pin-lock icon and adding fa-location-dot icon if user's location is not available but the current icon is pin-lock
        if(!userLocationPoint && jQueryBopis('#hc-bopis-form-pdp i').hasClass('fa-location-pin-lock')) {
            jQueryBopis('#hc-bopis-form-pdp i').removeClass('fa-location-pin-lock').addClass('fa-location-dot')
        }
  
  
        let storeInformation = await getStoreInformation(queryString).then(data => data).catch(err => err);
        let result = '';
  
        const sku = jQueryBopis("input.hc_product_sku").text() || jQueryBopis("input.hc_product_sku").val();
  
        jQueryBopis('#hc-store-card').remove();
        if (event) eventTarget.prop("disabled", true);
  
        // checking if the number of stores is greater then 0 then creating a payload to check inventory
        if (storeInformation && storeInformation.response && storeInformation.response.numFound > 0) {
  
            let storeCodes = storeInformation.response.docs.filter(store => store["pickup_pref"] === "true").map((store) => {
                let storeCode = '';
                store.timings = getStoreTiming(store);
  
                // if storeCode starts with DC_ then removing the code
                if (store.storeCode.startsWith('DC_')) {
                    storeCode = store.storeCode.substring(3);
                } else {
                    storeCode = store.storeCode;
                }
  
                store.storeCode = storeCode;
                return storeCode;
            })
  
            // passing the facilityId as an array in the payload
            let payload = {"sku" : sku, "facilityIds": storeCodes};
            result = await checkInventory(payload)
  
            // mapping the inventory result with the locations to filter those stores whose inventory
            // is present and the store code is present in the locations.
            if (result.docs) {
                result = storeInformation.response.docs.filter((location) => {
                    return result.docs.some((doc) => {
                          if(doc.facilityId === location.storeCode && doc.atp > 0) {
                              location["isInStock"] = true;
                          } else {
                              location["isInStock"] = false;
                          }
                        return location.isInStock;
                    })
                })
            }
        }
  
        displayStoreInformation(result)
        displayHomeStoreInformation(storeInformation.response.docs)
        if (event) eventTarget.prop("disabled", false);
    }
  
    /*
        Function finds the name for day of the week
  
        @return {string} Day of the week
    */
    function getDay() {
        let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        let date = new Date();
        let dayName = days[date.getDay()];
        return dayName;
    }
  
    function getStoreTodayTiming(timing) {
        return timing[getDay()] ? timing[getDay()] : {};
    }
  
    function getConvertedTime (time) {
        if (time) {
            // Check correct time format and split into components
            time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
  
            if (time.length > 1) { // If time format correct
                time.pop(); // remove seconds from the time
                time = time.slice(1); // Remove full string match value
                time[5] = +time[0] < 12 ? 'am' : 'pm'; // Set AM/PM
                time[0] = +time[0] % 12 || 12; // Adjust hours
            }
            return time.join(''); // return adjusted time or original string
        }
        return '';
    }
  
    /*
    Function returns the open and close timing for a store for all week days
  
    @param {object} store An object containing store information
    @return {object} An object containing open and close timing for all week days
    */
    function getStoreTiming(store) {
        let days = {'monday': {}, 'tuesday': {}, 'wednesday': {}, 'thursday': {}, 'friday': {}, 'saturday': {}, 'sunday': {}};
  
        const storeTimingDays = Object.keys(store).filter((key) => key.includes('open') || key.includes('close'));
  
        return storeTimingDays.reduce((obj, key) => {
            const time = store[key];
            if (key.includes('open')) {
                obj[key.replace('_open', '')]['open'] = getConvertedTime(time)
            }
            if (key.includes('close')) {
                obj[key.replace('_close', '')]['close'] = getConvertedTime(time)
            }
            return obj;
        }, days)
    }
  
    /*
        Fetch the latlon information for a zip, if present.
  
        @param {number} zipCode for which the latlon needs to be fetched
        @return {number} location for the zipcode in the format <lat,lon>
    */
    async function getLatLonForZipCode(zipCode) {
        let latLon = ''
  
        // Need to check for leading zero, as we have indexing specific issue when the zip starts with 0
        const query = zipCode.startsWith('0') ? `${zipCode} OR ${zipCode.substring(1)}` : zipCode;
  
        const payload = {
            "json": {
                "params": {
                    "q": `postcode:${query}`
                }
            }
        }
  
        try {
            latLon = await new Promise(function(resolve, reject) {
                jQueryBopis.ajax({
                    type: 'POST',
                    url: `${baseUrl}/api/postcodeLookup`,
                    data: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    crossDomain: true,
                    success: function (data) {
                        // added error check in here as in error case, api still returns 200 but has an error in response
                        if(data.error) {
                            reject('')
                        } else {
                            // assuming that when fetching the latlon for a zipcode there will only be one associated
                            // latlon for a zipcode and hence accessing the 0th index of docs
                            resolve(data.response.numFound > 0 ? data.response.docs[0].location : '');
                        }
                    },
                    error: function (xhr, textStatus, exception) {
                        reject(textStatus)
                    }
                })
            })
        } catch (err) {
            latLon = ''
        }
        return latLon;
    }
  
    /*
        Fetch the zipCode information for the latlon, and does not honor proximity.
  
        @param {string} pt lat,lon for which the zipCode needs to be fetched
        @return {string} code for the passed latlon if found, otherwise empty
    */
    async function getZipCodeForLatlon(pt) {
        let zipCode = ''
        const payload = {
            "json" : {
                "params": {
                    "q": "*:*",
                    "fq": "{!geofilt sfield=location}",
                    "pt": pt,
                    "d": 50 // passed d as 50, as we want zipCode in 50 radius
                }
            }
        }
  
        try {
            zipCode = await new Promise(function(resolve, reject) {
                jQueryBopis.ajax({
                    type: 'POST',
                    url: `${baseUrl}/api/postcodeLookup`,
                    data: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    crossDomain: true,
                    success: function (data) {
                        if(data.error) {
                            reject('')
                        } else {
                            // assuming that when fetching the zipcode for a latlon there will be multiple
                            // zipcodes as we are passing d as 50 and hence accessing the 0th index of docs
                            resolve(data.response.numFound > 0 ? data.response.docs[0].postcode : '');
                        }
                    },
                    error: function (xhr, textStatus, exception) {
                        reject(textStatus)
                    }
                })
            })
        } catch (err) {
            zipCode = ''
        }
        return zipCode;
    }
  
    // will check for the inventory for the product stock and if available then display the information on the UI
    function displayHomeStoreInformation(storeInformation) {

        const homeStoreWrapper = jQueryBopis('#hc-home-store-pdp')

        homeStoreWrapper.empty();
        const userHomeStoreCode = getUserStorePreference();

        if (userHomeStoreCode) {

            let homeStore = storeInformation.find(store => store.storeCode === userHomeStoreCode)

            if(!homeStore) {
                homeStore = stores.find(store => store.storeCode === userHomeStoreCode)
            }

            if(!homeStore) {
                return;
            }

            homeStoreWrapper.append('<h6 style="margin: unset;">My Store:</h6>')
            let $storeCard = jQueryBopis('<div id="hc-store-card"></div>');
            const storeTodayTiming = getStoreTodayTiming(homeStore.timings);

            let $storeInformationCard = jQueryBopis(`
                <div id="hc-store-details">
                    <div id="hc-details-column">
                        <p class="hc-store-dist-metadata">${homeStore.dist && homeStore.dist !== "Infinity" ? parseFloat((homeStore.dist).toFixed(1)).toLocaleString() + ' mi. away from you' : ''}</p>
                        <h4 class="hc-store-title">${homeStore.storeName ? homeStore.storeName : ''}</h4>
                        <p>${homeStore.address1 ? homeStore.address1 : ''}</p>
                        <p>${homeStore.city ? homeStore.city : ''}${homeStore.stateCode ? `, ${homeStore.stateCode}` : ''}${homeStore.postalCode ? `, ${homeStore.postalCode}` : ''}${homeStore.countryCode ? `, ${homeStore.countryCode}` : ''}</p>
                    </div>
                    <div id="hc-details-column">
                        <p>
                        <i class="fa ${homeStore.isInStock ? 'fa-check' : 'fa-xmark'} hc-icon hc-list-icon" tabindex="0" style="color: ${homeStore.isInStock ? 'green' : 'red'};"></i>
                        ${homeStore.isInStock ? 'In stock' : 'Out of stock'}
                        </p>
                        <p>
                        <i class="fa fa-phone hc-icon hc-list-icon" tabindex="0"></i>
                        <a href=tel:${homeStore.storePhone}>${homeStore.storePhone ? homeStore.storePhone : '-'}</a>
                        </p>
                        <p>
                        <i class="fa fa-regular fa-clock hc-icon hc-list-icon" tabindex="0"></i>
                        ${ storeTodayTiming.open ? 'Open Today: <wbr>' + storeTodayTiming.open + ' - ': ''} ${storeTodayTiming.close ? storeTodayTiming.close : ''}
                        </p>
                    </div>
                </div>`);
                $storeCard.append($storeInformationCard);

                if(homeStore.isInStock) {
                    let $pickUpButton = jQueryBopis('<button class="btn btn--secondary-accent hc-store-pick-up-button">Pick Up Here</button>');
                    $pickUpButton.on("click", updateCart.bind(null, homeStore));
    
                    $storeCard.append($pickUpButton);
                }

                let $lineBreak = jQueryBopis('<hr/>')
                $storeCard.append($lineBreak);

            homeStoreWrapper.append($storeCard);
        }
    }
  
  
    // will check for the inventory for the product stock and if available then display the information on the UI
    function displayStoreInformation(result) {
  
        jQueryBopis('.hc-store-information').empty();
        // TODO Handle it in a better way
        // The content of error is not removed and appended to last error message
        jQueryBopis('.hc-store-not-found').remove();
        jQueryBopis('.hc-modal-content').append(jQueryBopis('<p class="hc-store-not-found"></p>'));
        const hcModalContent = jQueryBopis('.hc-modal-content')
  
        jQueryBopis('.hc-store-information').append('<div id="hc-home-store-pdp"></div>')
  
        const userHomeStoreCode = getUserStorePreference();
    
        //check for result count, result count contains the number of stores count in result
        //TODO: find a better approach to handle the error secenario
        if (result.length > 0 && !result.includes('error')) {
            result.map(async (store) => {
                if(userHomeStoreCode === store.storeCode) {
                    return;
                }
  
                let $storeCard = jQueryBopis('<div id="hc-store-card"></div>');
                const storeTodayTiming = getStoreTodayTiming(store.timings);
                let $storeInformationCard = jQueryBopis(`
                <div id="hc-store-details">
                    <div id="hc-details-column">
                      <p class="hc-store-dist-metadata">${store.dist && store.dist !== "Infinity" ? parseFloat((store.dist).toFixed(1)).toLocaleString() + ' mi. away from you' : ''}</p>
                      <h4 class="hc-store-title">${store.storeName ? store.storeName : ''}</h4>
                      <p>${store.address1 ? store.address1 : ''}</p>
                      <p>${store.city ? store.city : ''}${store.stateCode ? `, ${store.stateCode}` : ''}${store.postalCode ? `, ${store.postalCode}` : ''}${store.countryCode ? `, ${store.countryCode}` : ''}</p>
                    </div>
                    <div id="hc-details-column">
                      <p>
                        <i class="fa fa-check hc-icon hc-list-icon" tabindex="0" style="color: green;"></i>
                        In stock
                      </p>
                      <p>
                        <i class="fa fa-phone hc-icon hc-list-icon" tabindex="0"></i>
                        <a href=tel:${store.storePhone}>${store.storePhone ? store.storePhone : '-'}</a>
                      </p>
                      <p>
                        <i class="fa fa-regular fa-clock hc-icon hc-list-icon" tabindex="0"></i>
                        ${ storeTodayTiming.open ? 'Open Today: <wbr>' + storeTodayTiming.open + ' - ': ''} ${storeTodayTiming.close ? storeTodayTiming.close : ''}
                      </p>
                    </div>
                </div>`);
  
                let $pickUpButton = jQueryBopis('<button class="btn btn--secondary-accent hc-store-pick-up-button">Pick Up Here</button>');
                $pickUpButton.on("click", updateCart.bind(null, store));
  
                let $lineBreak = jQueryBopis('<hr/>')
  
                $storeCard.append($storeInformationCard);
                $storeCard.append($pickUpButton);
                $storeCard.append($lineBreak);
  
                jQueryBopis('.hc-store-information').append($storeCard);
            })
  
            //check whether the storeCard contains any children, if not then displaying error
            if (!jQueryBopis('.hc-store-information').children().length) {
                jQueryBopis('.hc-store-not-found').html('No stores found for this product');
            }
        } else {
            // Added check as we are displaying the home store inside the hc-store-information element
            // and in that case we do not need to display the below error
            if (!jQueryBopis('.hc-store-information').children().length) {
                jQueryBopis('.hc-store-not-found').append('No stores found for this product');
            }
        }
  
        // hide all the h4 and p tags which are empty in the modal
        hcModalContent.find('h4:empty').hide();
        hcModalContent.find('p:empty').hide();
    }
    
    // will add product to cart with a custom property pickupstore
    function updateCart(store, event) {
        let addToCartForm = jQueryBopis(".hc-product-form");
  
        event.preventDefault();
        event.stopImmediatePropagation();
                
        // let merchant define the behavior whenever pick up button is clicked, merchant can define an event listener for this event
        jQueryBopis(document).trigger('prePickUp');
  
        // made the property hidden by adding underscore before the property name
        let facilityIdInput = jQueryBopis(`<input id="hc-store-code" name="properties[_pickupstore]" value=${store.storeCode ? store.storeCode : ''} type="hidden"/>`)
        addToCartForm.append(facilityIdInput)
  
        //   Added this property to be used in the fulfillment flow
        let shopifyLocationIdInput = jQueryBopis(`<input id="hc-store-code" name="properties[_shopifyLocationId]" value=${store.storeCode ? locationJSON[store.storeCode] : ''} type="hidden"/>`)
        addToCartForm.append(shopifyLocationIdInput)

        //   Added this property to be used in the in checkout shipping rate extension
        let deliveryMethodInput = jQueryBopis(`<input id="hc-store-code" name="properties[Delivery Method]" value="Pick Up At ${store.storeName ? store.storeName : ''}${store.address1 ? `, ${store.address1}` : ''}" type="hidden"/>`)
        addToCartForm.append(deliveryMethodInput)
  
        let facilityNameInput = jQueryBopis(`<input id="hc-pickupstore-address" name="properties[Pickup Store]" value="${store.storeName ? store.storeName : ''}${store.address1 ? `, ${store.address1}` : ''}${store.city ? `, ${store.city}` : ''}" type="hidden"/>`)
        addToCartForm.append(facilityNameInput)
  
        // using the cart add endpoint to add the product to cart, as using the theme specific methods is not recommended.
        jQueryBopis.ajax({
            type: "POST",
            url: '/cart/add.js',
            data: addToCartForm.serialize(),
            dataType: 'JSON',
            success: function () {
  
                // let merchant define the behavior after the item is successfully added as a pick up item, merchant can define an event listener for this event
                jQueryBopis(document).trigger('postPickUp');
  
                // redirecting the user to the cart page after the product gets added to the cart
                if (bopisCustomConfig.enableCartRedirection) {
                    location.replace('/cart');
                }
            }
        })
  
        facilityIdInput.remove();
        facilityNameInput.remove();
        deliveryMethodInput.remove();
        shopifyLocationIdInput.remove();
    }
  
    async function checkShippingInventory(sku, storeIds) {

        let resp;

        // added try catch to handle network related errors
        try {
            resp = await new Promise(function(resolve, reject) {
                jQueryBopis.ajax({
                    type: 'POST',
                    url: `${maargUrl}/rest/s1/ofbiz-oms-usl/checkShippingInventory`,
                    crossDomain: true,
                    data: JSON.stringify({
                        productStoreId: 'STORE',
                        inventoryGroupId: 'FAC_GRP',
                        internalNames: sku,
                        facilityIds: storeIds,
                    }),
                    dataType: 'JSON',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (xhr, textStatus, exception) {
                        reject(textStatus)
                    }
                })
            })
        } catch (err) {
            resp = err;
        }
        return resp;
    }
  
    function renderEDD(homeStoreZipCode) {
        const eddWrapper = jQueryBopis("#hc-edd")
        jQueryBopis(".hc-edd-modal").remove();

        eddWrapper.empty();

        let shippingEstimate = [];

        let defaultShippingEstimate = "";
        if(facility && homeStoreZipCode) {
            shippingEstimate = getShippingEstimate(facility);
            defaultShippingEstimate = shippingEstimate.find(estimate => estimate.shippingMethodDesc === "Standard")

            if(!defaultShippingEstimate) {
                defaultShippingEstimate = shippingEstimate[0]
            }
        }

        let $eddModal = jQueryBopis(`<div id="hc-edd-modal" class="hc-edd-modal">
            <div class="hc-modal-content hc-edd-content">
                <div class="hc-modal-header">
                    <span class="hc-close hc-edd-close"></span>
                    <h1 class="hc-modal-title">Estimated Delivery Date</h1>
                </div>
                <div class="hc-edd-information"></div>
            </div>
        </div>`);

        const shippingDetails = jQueryBopis(`<div>
            <p id="hc-edd-title">Estimated Delivery Date: <span class="hc-pointer" id="hc-edd-date">${defaultShippingEstimate.formattedDeliveryDate}</span></p>
            <div class="hc-edd-info">
                <div>
                    <span id="hc-edd-ship-title">Ship to: </span>
                    <span id="hc-edd-zipcode">${homeStoreZipCode} </span>
                </div>
                <span id="hc-edd-toggle-button" class="hc-pointer">Change</span>
            </div>
            <div class="hc-edd-wrapper" style="display: none;">
                <form id="hc-edd-form">
                    <div class="hc-input-wrapper">
                        <input id="hc-edd-pin" class="hc-edd-pin" name="pin" placeholder="Enter zipcode" style="width: 100%; border:0px;"/>
                        <i class="fa-solid fa-xmark hc-icon hc-close-icon" style="display: none;" tabindex="0"></i>
                        <i class="fa-solid fa-location-dot hc-icon hc-location-icon" tabindex="0"></i>
                    </div>
                    <button style="display: none;" type="submit" class="btn hc-edd-button">Find Stores</button>
                </form>
            </div>
            <span class="hc-no-store-found">No nearby stores available </span>
        </div>`)

        eddWrapper.append(shippingDetails);

        jQueryBopis("body").append($eddModal);
        
        if(shippingEstimate && shippingEstimate.length > 0) {
            shippingEstimate.map(estimate => {
                jQueryBopis(".hc-edd-information").append(`<p class="hc-edd-info"><strong>${estimate.shippingMethodDesc}: </strong><span>${estimate.formattedDeliveryDate}</span></p>`)
            })
        }

        jQueryBopis(".hc-edd-close").on('click', closeEDDModal);
        jQueryBopis("body").on('click', function(event) {
            if (event.target == jQueryBopis("#hc-edd-modal")[0]) {
                closeEDDModal();
            }
        })

        if(!homeStoreZipCode) {
            jQueryBopis("#hc-edd-title").hide();
            jQueryBopis(".hc-no-store-found").hide();
            jQueryBopis(".hc-edd-info > div").hide();
            jQueryBopis("#hc-edd-toggle-button").text("Check availability");
        } else if(!facility) {
            jQueryBopis("#hc-edd-title").hide();
        } else {
            jQueryBopis(".hc-no-store-found").hide();
        }

        jQueryBopis('.hc-edd-pin').on('input', toggleClearIcon.bind(null, '.hc-edd-wrapper'));
        jQueryBopis(".hc-edd-wrapper .hc-close-icon").on('click', clearSearch.bind(null, '.hc-edd-wrapper'))
        jQueryBopis(".hc-edd-wrapper .hc-location-icon").on('click', fetchStoresUsingCurrentLocation.bind(null, '.hc-edd-wrapper'));
        jQueryBopis(".hc-edd-button").on('click', searchStoresOnPDP);

        jQueryBopis("#hc-edd-date").on('click', openEDDModal);

        jQueryBopis("#hc-edd-toggle-button").on('click', function() {

            jQueryBopis(".hc-no-store-found").hide();
            if(jQuery(".hc-edd-wrapper").is(":visible")) {
                jQueryBopis(".hc-edd-wrapper").hide();
            } else {
                jQueryBopis(".hc-edd-wrapper").show();
            }
        })
    }
  
    async function initialiseEDD() {
  
        if(location.pathname.includes('/products/')) {

            jQueryBopis(".hc-edd-modal").remove();

            const homeStoreLatLon = localStorage.getItem('HC_CURRENT_STORE_LAT_LON');
    
            let homeStoreZipCode = ""
            if(homeStoreLatLon) {
                latlon = homeStoreLatLon;
                homeStoreZipCode = await getZipCodeForLatlon(homeStoreLatLon)
                hcHomeStoreZipCode = homeStoreZipCode
            }
    
            await renderEDD(homeStoreZipCode);
            jQueryBopis(".hc-edd-pin").val(homeStoreZipCode)
            await searchStoresOnPDP()
        }        
    }
  
    // TODO move it to intialise block
    // To check whether the url has changed or not, for making sure that the variant is changed.
    let url = location.href;
    let currentHomeStore = getUserStorePreference();
    new MutationObserver(async () => {
        if (location.href !== url) {
            url = location.href;
            await initialiseBopis();
            initialiseEDD();
        }

        // Fetch the stores again whenever current store changes
        // Need to fetch stores again as the distance between stores is calculated on the basis of current store
        if (currentHomeStore !== getUserStorePreference()) {
            currentHomeStore = getUserStorePreference();
            updateStoresInformation();
        }
        // added condition to run the script again as when removing a product the script does not run
        // and thus the store id again becomes visible
      //   if (location.pathname.includes('cart')) initialiseBopis();
    }).observe(document, {subtree: true, childList: true});
  
})();