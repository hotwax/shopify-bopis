(function () {
    let jQueryBopis;
    let $location;
    let backdrop;

    // defining a global object having properties which let merchant configure some behavior
    this.bopisCustomConfig = {
        'enableCartRedirection': true
    };

    // TODO Generate instance specific code URL in FTL. Used with <#noparse> after this code so that `` code is escaped
    // let baseUrl = '<@ofbizUrl secure="true"></@ofbizUrl>';
    let baseUrl = 'https://demo-hc.hotwax.io';

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

    if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn['jquery']) < 1.7)) {
        loadScript('//ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js', function(){
          jQueryBopis = jQuery.noConflict(true);
          jQueryBopis(document).ready(function() {
              initialiseBopis();
          });

        });
    } else {
        jQueryBopis = jQuery;
        jQuery(document).ready(function() {
            initialiseBopis();
        });
    }

    function getAccessToken (refresh) {
        return new Promise(function(resolve, reject) {
            jQueryBopis.ajax({
                type: 'POST',
                url: `${baseUrl}/api/getGMBToken`,
                crossDomain: true,
                data: refresh ? JSON.stringify({
                    "refresh": true
                }) : JSON.stringify({}),
                dataType: "json",
                headers: {
                    'Content-Type': 'application/json'
                },
                success: function (data) {
                    localStorage.setItem('accessToken', data.accessToken)
                    resolve(data.accessToken)
                },
                error: function (err) {
                    reject(err);
                }
            })
        })
    }

    // function to get co-ordinates of the user after successfully getting the location
    function locationSuccess (pos) {
        $location = pos.coords;
    }

    // function to display error on console if having any error when getting the location
    function locationError (err) {
        console.error(err.code, err.message);
    }

    // will fetch the current location of the user
    function getCurrentLocation () {
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
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

    // TODO: add preorder check

    async function initialiseBopis () {
        if (location.pathname.includes('products')) {

            // loading css file, commented it as we have stored css directly in the store assets
            jQueryBopis('head').append(`<link rel="stylesheet" type="text/css" href="${baseUrl}/api/shopify-tag.css">`);
            jQueryBopis('head').append(`<link rel="stylesheet" type="text/css" href="${baseUrl}/api/hc-custom-css.css">`);

            if (!localStorage.getItem('accessToken')) {
                await getAccessToken(false);
            }

            await getCurrentLocation();

            jQueryBopis(".hc-store-information").remove();
            jQueryBopis(".hc-open-bopis-modal").remove();
            jQueryBopis(".hc-bopis-modal").remove();

            // TODO Simplify this [name='id']. There is no need to serialize
            const cartForm = jQueryBopis("form[action='/cart/add']");
            const id = cartForm.serializeArray().find(ele => ele.name === "id").value;
            
            let $element = jQueryBopis("form[action='/cart/add']");

            let $pickUpModal = jQueryBopis(`<div id="hc-bopis-modal" class="hc-bopis-modal">
                <div class="hc-modal-content">
                    <div class="hc-modal-header">
                        <span class="hc-close"></span>
                        <h1 class="hc-modal-title">Pick up today</h1>
                    </div>
                    <form id="hc-bopis-form">
                        <input id="hc-bopis-store-pin" name="pin" placeholder="Enter zipcode"/>
                        <button type="submit" class="btn hc-bopis-pick-up-button">Find Stores</button>
                    </form>
                    <div class="hc-store-information"></div>
                    <p class="hc-store-not-found"></p>
                </div>
            </div>`);

            let $btn = jQueryBopis('<button class="btn btn--secondary-accent hc-open-bopis-modal">Pick Up Today</button>');
            
            $element.append($btn);
            jQueryBopis("body").append($pickUpModal);

            $btn.on('click', openBopisModal);

            jQueryBopis(".hc-close").on('click', closeBopisModal);
            jQueryBopis(".hc-bopis-pick-up-button").on('click', handleAddToCartEvent);
            jQueryBopis("body").on('click', function(event) {
                if (event.target == jQueryBopis("#hc-bopis-modal")[0]) {
                    closeBopisModal();
                }
            })

        } else if(location.pathname.includes('cart')) {
            jQueryBopis("[data-cart-item-property-name]:contains('pickupstore')").closest('li').hide();
        }
    }

    function getStoreInformation (accessToken, pin) {
        let account = "100642139089425989218";
        // defined the distance to find the stores in this much radius area
        let distance = 50;

        // applied a condition that if we have location permission then searching the stores for the current location
        // if we have both location and pin, then using the pin to search for stores
        // if we doesn't have location permission and pin, then will fetch all the available stores
        return new Promise(function(resolve, reject) {
            jQueryBopis.ajax({
                type: 'GET',
                url: !($location) || pin ? 
                `https://mybusiness.googleapis.com/v4/accounts/${account}/locations?filter=address.postal_code=%22${pin}%22+AND+open_info.status=OPEN` : 
                `https://mybusiness.googleapis.com/v4/accounts/${account}/locations?filter=distance(latlng, geopoint(${$location.latitude}, ${$location.longitude}))<${distance}`,
                crossDomain: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                },
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

        // this will create a url param like &facilityId=store_1&facilityId=store_1 which is then sent
        // with the url, used this approach as unable to send array in the url params and also unable to
        // pass body as the request type is GET.
        let paramFacilityId = '';
        payload[0].facilityId.map((facility) => {
            paramFacilityId += `&facilityId=${facility}`
        })

        let resp;

        // added try catch to handle network related errors
        try {
            resp = await new Promise(function(resolve, reject) {
                jQueryBopis.ajax({
                    type: 'GET',
                    url: `${baseUrl}/api/checkInventory?sku=${payload[0].sku}${paramFacilityId}`,
                    crossDomain: true,
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
    
    async function handleAddToCartEvent(event) {

        const eventTarget = jQueryBopis(event.target);
        // to stop event bubbling when clicking on the Check Stores button
        event.preventDefault();
        event.stopImmediatePropagation();

        const pin = jQueryBopis("#hc-bopis-store-pin").val();
        let storeInformation = '', result = '';

        // loop to update the token if we are getting any error
        // TODO: can apply a condition defining the number of times we should refresh a token
        while(true) {
            storeInformation = await getStoreInformation(localStorage.getItem('accessToken'), pin).then(data => data).catch(err => err);
            if (storeInformation != "error") {
                break;
            }
            await getAccessToken(true);
        }

        const id = jQueryBopis("form[action='/cart/add']").serializeArray().find(ele => ele.name === "id").value
        
        // when using the demo instance we will use id as sku, and for dev instance we will use sku
        // const sku = meta.product.variants.find(variant => variant.id == id).sku
        const sku = id;

        jQueryBopis('#hc-store-card').remove();
        eventTarget.prop("disabled", true);

        // checking if the number of stores is greater then 0 then creating a payload to check inventory
        if (storeInformation.totalSize > 0) {

            let storeCodes = storeInformation.locations.map((store) => {
                let storeCode = '';

                // if storeCode starts with DC_ then removing the code
                if (store.storeCode.startsWith('DC_'))
                {
                    storeCode = store.storeCode.substring(3);
                } else {
                    storeCode = store.storeCode;
                }

                store.storeCode = storeCode;
                return storeCode;
            })

            // passing the facilityId as an array in the payload
            let payload = [{"sku" : sku, "facilityId": storeCodes}];
            result = await checkInventory(payload)

            // mapping the inventory result with the locations to filter those stores whose inventory
            // is present and the store code is present in the locations.
            result = storeInformation.locations.filter((location) => {
                return result.docs.some((doc) => {
                    return doc.facilityId === location.storeCode && doc.atp > 0;
                })
            })
        }

        displayStoreInformation(result)
        eventTarget.prop("disabled", false);
    }

    function getDay () {
        let days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        let date = new Date();
        let dayName = days[date.getDay()];
        return dayName;
    }

    function openData (regularHours) {
        return regularHours.periods.find(period => period.openDay === getDay());
    }

    function tConvert (time) {
        if (time) {
            // Check correct time format and split into components
            time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    
            if (time.length > 1) { // If time format correct
                time = time.slice(1); // Remove full string match value
                time[5] = +time[0] < 12 ? 'am' : 'pm'; // Set AM/PM
                time[0] = +time[0] % 12 || 12; // Adjust hours
            }
            return time.join(''); // return adjusted time or original string
        }
    }

    // will check for the inventory for the product stock and if available then display the information on the UI
    function displayStoreInformation(result) {

        jQueryBopis('.hc-store-information').empty();
        // TODO Handle it in a better way
        // The content of error is not removed and appended to last error message
        jQueryBopis('.hc-store-not-found').remove();
        jQueryBopis('.hc-modal-content').append(jQueryBopis('<p class="hc-store-not-found"></p>'));
    
        //check for result count, result count contains the number of stores count in result
        if (result.length > 0) {
            result.map(async (store) => {
                let $storeCard = jQueryBopis('<div id="hc-store-card"></div>');
                let $storeInformationCard = jQueryBopis(`
                <div id="hc-store-details">
                    <div id="hc-details-column"><h4 class="hc-store-title">${store.locationName ? store.locationName : ''}</h4><p>${store.address ? store.address.addressLines[0] : ''}</p><p>${store.address.locality ? store.address.locality : ''} ${store.address.administrativeArea ? store.address.administrativeArea : ''} ${store.address.regionCode ? store.address.regionCode : ''}</p></div>
                    <div id="hc-details-column"><p>In stock</p><p>${store.phone ? store.phone : ''}</p><p>Open Today: ${ store.regularHours ? tConvert(openData(store.regularHours).openTime) : ''} - ${store.regularHours ? tConvert(openData(store.regularHours).closeTime) : ''}</p></div>
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
                jQueryBopis('.hc-store-not-found').html('No stores found for current product');
            }
        } else {
            jQueryBopis('.hc-store-not-found').append('No stores found for current product');
        }

        jQueryBopis('h4:empty').hide();
        jQueryBopis('p:empty').hide();
    }
    
    // will add product to cart with a custom property pickupstore
    function updateCart(store, event) {

        let addToCartForm = jQueryBopis("form[action='/cart/add']");

        event.preventDefault();
        event.stopImmediatePropagation();
                
        // let merchant define the behavior whenever pick up button is clicked, merchant can define an event listener for this event
        jQueryBopis(document).trigger('prePickUp');

        let facilityIdInput = jQueryBopis(`<input id="hc-pickupstore" name="properties[pickupstore]" value=${store.storeCode} type="hidden"/>`)
        addToCartForm.append(facilityIdInput)

        let facilityNameInput = jQueryBopis(`<input id="hc-pickupstore" name="properties[Pickup Store]" value="${store.locationName}, ${store.address.addressLines[0]}, ${store.address.locality}, ${store.address.administrativeArea}, ${store.address.postalCode}, ${store.address.regionCode}" type="hidden"/>`)
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
    }
    // TODO move it to intialise block
    // To check whether the url has changed or not, for making sure that the variant is changed.
    let url = location.href; 
    new MutationObserver(() => {
        if (location.href !== url) {
            url = location.href;
            initialiseBopis();
        }
    }).observe(document, {subtree: true, childList: true});

})();